import os
from mutagen import File
from typing import List
from sqlalchemy import select

from models.lesson import LessonORM
from models.audio import AudioFileORM
from models.transcript import TranscriptORM
from models.segment import SegmentORM
from repositories.lesson_repo import LessonRepository
from utils.exceptions import LessonNotFoundException, InvalidFileException
from utils.parser import parse_srt, parse_json_transcript
from config.settings import settings

class LessonService:
    def __init__(self, lesson_repo: LessonRepository):
        self.lesson_repo = lesson_repo

    def create_lesson(self, title: str) -> LessonORM:
        if not title or not title.strip():
            raise InvalidFileException("Lesson title cannot be empty.")
        return self.lesson_repo.create(title=title.strip())

    def get_lesson(self, lesson_id: int) -> LessonORM:
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise LessonNotFoundException(lesson_id)
        return lesson

    def get_all_lessons(self) -> List[LessonORM]:
        return self.lesson_repo.get_all()

    def save_audio(self, lesson_id: int, filename: str, content: bytes) -> AudioFileORM:
        lesson = self.get_lesson(lesson_id)
        
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".mp3", ".wav", ".m4a"]:
            raise InvalidFileException(f"Unsupported audio format: {ext}. Only MP3, WAV, and M4A are supported.")

        # Ensure upload folder exists
        audio_dir = os.path.join(settings.upload_dir, "audio")
        os.makedirs(audio_dir, exist_ok=True)

        # Save audio file to disk
        filepath = os.path.join(audio_dir, f"{lesson_id}_{filename}")
        try:
            with open(filepath, "wb") as f:
                f.write(content)
        except Exception as e:
            raise InvalidFileException(f"Failed to write audio file to disk: {str(e)}")

        # Calculate duration using Mutagen
        try:
            audio_info = File(filepath)
            if audio_info is not None and audio_info.info is not None:
                duration = float(audio_info.info.length)
            else:
                duration = 0.0
        except Exception:
            duration = 0.0

        # Save audio metadata
        audio = AudioFileORM(
            lesson_id=lesson_id,
            filename=filename,
            filepath=filepath,
            duration=duration
        )
        saved_audio = self.lesson_repo.save_audio(audio)

        # If a single TXT segment exists with 0.0 duration, update its bounds to match audio duration
        if lesson.segments and len(lesson.segments) == 1:
            segment = lesson.segments[0]
            if segment.start_time == 0.0 and segment.end_time == 0.0:
                segment.end_time = duration
                segment.duration = duration
                self.lesson_repo.db.add(segment)
                self.lesson_repo.db.commit()

        return saved_audio

    def save_transcript(self, lesson_id: int, filename: str, content: bytes, format: str) -> TranscriptORM:
        lesson = self.get_lesson(lesson_id)

        clean_format = format.lower().strip()
        if clean_format not in ["srt", "txt", "json"]:
            raise InvalidFileException(f"Unsupported transcript format: {clean_format}. Only SRT, TXT, and JSON are supported.")

        # Ensure upload folder exists
        transcripts_dir = os.path.join(settings.upload_dir, "transcripts")
        os.makedirs(transcripts_dir, exist_ok=True)

        # Save transcript file to disk
        filepath = os.path.join(transcripts_dir, f"{lesson_id}_transcript.{clean_format}")
        try:
            with open(filepath, "wb") as f:
                f.write(content)
        except Exception as e:
            raise InvalidFileException(f"Failed to write transcript file to disk: {str(e)}")

        # Decode contents safely
        try:
            raw_content = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                raw_content = content.decode("latin-1")
            except Exception:
                raise InvalidFileException("Failed to decode transcript file. Ensure it is UTF-8 or Latin-1 encoded.")

        # Parse segments data based on format
        segments_data = []
        if clean_format == "srt":
            segments_data = parse_srt(raw_content)
        elif clean_format == "json":
            segments_data = parse_json_transcript(raw_content)
        elif clean_format == "txt":
            duration = lesson.audio_file.duration if lesson.audio_file else 0.0
            segments_data = [{
                "start_time": 0.0,
                "end_time": duration,
                "duration": duration,
                "transcript": raw_content.strip()
            }]

        # Remove any existing segments for this lesson first
        # Doing this explicitly protects against unique constraint conflicts
        for existing_segment in list(lesson.segments):
            self.lesson_repo.db.delete(existing_segment)
        self.lesson_repo.db.flush()

        # Save transcript object in database
        transcript = TranscriptORM(
            lesson_id=lesson_id,
            raw_content=raw_content,
            format=clean_format
        )
        saved_transcript = self.lesson_repo.save_transcript(transcript)

        # Insert newly parsed Segment ORM rows
        for i, data in enumerate(segments_data, 1):
            segment = SegmentORM(
                lesson_id=lesson_id,
                index=i,
                start_time=data["start_time"],
                end_time=data["end_time"],
                duration=data["duration"],
                transcript=data["transcript"],
                status="NOT_STARTED",
                is_bookmarked=False
            )
            self.lesson_repo.db.add(segment)

        self.lesson_repo.db.commit()
        return saved_transcript

    def delete_lesson(self, lesson_id: int) -> None:
        lesson = self.get_lesson(lesson_id)
        
        # Delete audio file from disk
        if lesson.audio_file and os.path.exists(lesson.audio_file.filepath):
            try:
                os.remove(lesson.audio_file.filepath)
            except Exception:
                pass
        
        # Delete transcript file from disk
        if lesson.transcript:
            filepath = os.path.join(settings.upload_dir, "transcripts", f"{lesson_id}_transcript.{lesson.transcript.format}")
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception:
                    pass

        self.lesson_repo.delete(lesson)
