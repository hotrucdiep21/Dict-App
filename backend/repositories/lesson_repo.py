from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Optional, Sequence

from models.lesson import LessonORM
from models.audio import AudioFileORM
from models.transcript import TranscriptORM
from repositories.base import BaseRepository

class LessonRepository(BaseRepository):
    def create(self, title: str) -> LessonORM:
        lesson = LessonORM(title=title)
        self.db.add(lesson)
        self.db.commit()
        self.db.refresh(lesson)
        return lesson

    def get_by_id(self, lesson_id: int) -> Optional[LessonORM]:
        statement = select(LessonORM).where(LessonORM.id == lesson_id)
        return self.db.execute(statement).scalar_one_or_none()

    def get_all(self) -> Sequence[LessonORM]:
        statement = select(LessonORM).order_by(LessonORM.id.desc())
        return self.db.execute(statement).scalars().all()

    def delete(self, lesson: LessonORM) -> None:
        self.db.delete(lesson)
        self.db.commit()

    def save_audio(self, audio: AudioFileORM) -> AudioFileORM:
        # Delete existing audio for this lesson if present
        existing = self.db.execute(
            select(AudioFileORM).where(AudioFileORM.lesson_id == audio.lesson_id)
        ).scalar_one_or_none()
        if existing:
            self.db.delete(existing)
            self.db.flush()
        
        self.db.add(audio)
        self.db.commit()
        self.db.refresh(audio)
        return audio

    def save_transcript(self, transcript: TranscriptORM) -> TranscriptORM:
        # Delete existing transcript for this lesson if present
        existing = self.db.execute(
            select(TranscriptORM).where(TranscriptORM.lesson_id == transcript.lesson_id)
        ).scalar_one_or_none()
        if existing:
            self.db.delete(existing)
            self.db.flush()

        self.db.add(transcript)
        self.db.commit()
        self.db.refresh(transcript)
        return transcript
