import os
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from repositories.lesson_repo import LessonRepository
from services.lesson_service import LessonService
from schemas.lesson import (
    LessonCreate,
    LessonResponse,
    LessonDetailsResponse,
    LessonStats,
    AudioMetadataResponse,
    TranscriptMetadataResponse
)
from schemas.audio import AudioUploadResponse
from schemas.transcript import TranscriptUploadResponse
from schemas.segment import SegmentResponse
from repositories.segment_repo import SegmentRepository

router = APIRouter(prefix="/lessons", tags=["Lessons"])

def get_lesson_service(db: Session = Depends(get_db)) -> LessonService:
    repo = LessonRepository(db)
    return LessonService(repo)

@router.post("", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(payload: LessonCreate, service: LessonService = Depends(get_lesson_service)):
    lesson = service.create_lesson(title=payload.title)
    return lesson

@router.get("", response_model=List[LessonDetailsResponse])
def list_lessons(service: LessonService = Depends(get_lesson_service)):
    lessons = service.get_all_lessons()
    
    response = []
    for lesson in lessons:
        # Calculate stats dynamically from children records
        total_segments = len(lesson.segments)
        completed_segments = sum(1 for s in lesson.segments if s.status == "COMPLETED")
        needs_review_segments = sum(1 for s in lesson.segments if s.status == "NEEDS_REVIEW")
        
        accuracies = []
        for s in lesson.segments:
            if s.attempts:
                best_acc = max(a.accuracy for a in s.attempts)
                accuracies.append(best_acc)
        
        avg_acc = sum(accuracies) / len(accuracies) if accuracies else None

        stats = LessonStats(
            total_segments=total_segments,
            completed_segments=completed_segments,
            needs_review_segments=needs_review_segments,
            average_accuracy=avg_acc
        )
        
        audio_file = None
        if lesson.audio_file:
            audio_file = AudioMetadataResponse(
                filename=lesson.audio_file.filename,
                duration=lesson.audio_file.duration
            )
            
        transcript_file = None
        if lesson.transcript:
            transcript_file = TranscriptMetadataResponse(
                filename=f"transcript.{lesson.transcript.format}",
                format=lesson.transcript.format
            )

        response.append(
            LessonDetailsResponse(
                id=lesson.id,
                title=lesson.title,
                created_at=lesson.created_at,
                audio_file=audio_file,
                transcript_file=transcript_file,
                stats=stats
            )
        )
    return response

@router.get("/{id}", response_model=LessonDetailsResponse)
def get_lesson_details(id: int, service: LessonService = Depends(get_lesson_service)):
    lesson = service.get_lesson(id)
    
    total_segments = len(lesson.segments)
    completed_segments = sum(1 for s in lesson.segments if s.status == "COMPLETED")
    needs_review_segments = sum(1 for s in lesson.segments if s.status == "NEEDS_REVIEW")
    
    accuracies = []
    for s in lesson.segments:
        if s.attempts:
            best_acc = max(a.accuracy for a in s.attempts)
            accuracies.append(best_acc)
    avg_acc = sum(accuracies) / len(accuracies) if accuracies else None

    stats = LessonStats(
        total_segments=total_segments,
        completed_segments=completed_segments,
        needs_review_segments=needs_review_segments,
        average_accuracy=avg_acc
    )
    
    audio_file = None
    if lesson.audio_file:
        audio_file = AudioMetadataResponse(
            filename=lesson.audio_file.filename,
            duration=lesson.audio_file.duration
        )
        
    transcript_file = None
    if lesson.transcript:
        transcript_file = TranscriptMetadataResponse(
            filename=f"transcript.{lesson.transcript.format}",
            format=lesson.transcript.format
        )

    return LessonDetailsResponse(
        id=lesson.id,
        title=lesson.title,
        created_at=lesson.created_at,
        audio_file=audio_file,
        transcript_file=transcript_file,
        stats=stats
    )

@router.get("/{id}/segments", response_model=List[SegmentResponse])
def list_lesson_segments(id: int, service: LessonService = Depends(get_lesson_service), db: Session = Depends(get_db)):
    service.get_lesson(id) # Verify lesson exists
    segment_repo = SegmentRepository(db)
    segments = segment_repo.get_by_lesson(id)
    
    response = []
    for s in segments:
        best_acc = None
        best_text = None
        if s.attempts:
            best_attempt = max(s.attempts, key=lambda a: a.accuracy)
            best_acc = best_attempt.accuracy
            best_text = best_attempt.typed_text
            
        # Reveal transcript if the segment is completed or has any attempts
        if s.status == "COMPLETED" or (s.attempts and len(s.attempts) > 0):
            masked_transcript = s.transcript
        else:
            masked_transcript = " ".join(
                "".join("*" if c.isalnum() else c for c in w) 
                for w in s.transcript.split()
            )

        response.append(
            SegmentResponse(
                id=s.id,
                index=s.index,
                start_time=s.start_time,
                end_time=s.end_time,
                duration=s.duration,
                status=s.status,
                is_bookmarked=s.is_bookmarked,
                best_accuracy=best_acc,
                masked_transcript=masked_transcript,
                best_attempt_text=best_text
            )
        )
    return response

@router.delete("/{id}")
def delete_lesson(id: int, service: LessonService = Depends(get_lesson_service)):
    service.delete_lesson(id)
    return {"message": "Lesson deleted successfully"}

@router.post("/{id}/audio", response_model=AudioUploadResponse)
async def upload_audio(id: int, file: UploadFile = File(...), service: LessonService = Depends(get_lesson_service)):
    content = await file.read()
    audio = service.save_audio(lesson_id=id, filename=file.filename, content=content)
    return AudioUploadResponse(
        lesson_id=audio.lesson_id,
        filename=audio.filename,
        duration=audio.duration,
        status="ready"
    )

@router.post("/{id}/transcript", response_model=TranscriptUploadResponse)
async def upload_transcript(id: int, file: UploadFile = File(...), service: LessonService = Depends(get_lesson_service)):
    content = await file.read()
    ext = os.path.splitext(file.filename)[1].lower().replace(".", "")
    transcript = service.save_transcript(lesson_id=id, filename=file.filename, content=content, format=ext)
    return TranscriptUploadResponse(
        lesson_id=transcript.lesson_id,
        filename=file.filename,
        format=transcript.format,
        segments_created=len(transcript.lesson.segments)
    )

@router.post("/{id}/auto-transcribe")
def auto_transcribe_lesson(id: int, service: LessonService = Depends(get_lesson_service)):
    segments_created = service.auto_transcribe(lesson_id=id)
    return {
        "message": "Auto-transcription completed successfully",
        "segments_created": segments_created
    }
