from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.session import get_db
from repositories.segment_repo import SegmentRepository
from repositories.attempt_repo import AttemptRepository
from services.practice_service import PracticeService
from schemas.segment import SegmentDetailsResponse, BookmarkResponse, AttemptResponse, CheckAttemptRequest, CheckAttemptResponse
from utils.exceptions import AppException

router = APIRouter(prefix="/segments", tags=["Segments"])

def get_segment_repo(db: Session = Depends(get_db)) -> SegmentRepository:
    return SegmentRepository(db)

@router.get("/{id}", response_model=SegmentDetailsResponse)
def get_segment_details(id: int, repo: SegmentRepository = Depends(get_segment_repo)):
    segment = repo.get_by_id(id)
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Segment with ID {id} was not found."
        )
    
    # Map attempt log entities to response schemas
    attempts_response = [
        AttemptResponse(
            id=a.id,
            accuracy=a.accuracy,
            replay_count=a.replay_count,
            back_jump_count=a.back_jump_count,
            typing_duration=a.typing_duration,
            created_at=a.created_at
        ) for a in segment.attempts
    ]

    return SegmentDetailsResponse(
        id=segment.id,
        lesson_id=segment.lesson_id,
        index=segment.index,
        start_time=segment.start_time,
        end_time=segment.end_time,
        duration=segment.duration,
        transcript=segment.transcript,
        status=segment.status,
        is_bookmarked=segment.is_bookmarked,
        attempts=attempts_response
    )

@router.post("/{id}/bookmark", response_model=BookmarkResponse)
def toggle_bookmark(id: int, repo: SegmentRepository = Depends(get_segment_repo)):
    segment = repo.get_by_id(id)
    if not segment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Segment with ID {id} was not found."
        )
    
    updated_segment = repo.toggle_bookmark(segment)
    return BookmarkResponse(
        segment_id=updated_segment.id,
        is_bookmarked=updated_segment.is_bookmarked
    )

def get_practice_service(db: Session = Depends(get_db)) -> PracticeService:
    segment_repo = SegmentRepository(db)
    attempt_repo = AttemptRepository(db)
    return PracticeService(segment_repo, attempt_repo)

@router.post("/{id}/check", response_model=CheckAttemptResponse)
def check_segment_attempt(
    id: int,
    payload: CheckAttemptRequest,
    service: PracticeService = Depends(get_practice_service)
):
    attempt, diff = service.check_attempt(
        segment_id=id,
        typed_text=payload.typed_text,
        replay_count=payload.replay_count,
        back_jump_count=payload.back_jump_count,
        typing_duration=payload.typing_duration
    )
    return CheckAttemptResponse(
        attempt_id=attempt.id,
        accuracy=attempt.accuracy,
        status=attempt.segment.status,
        diff=diff
    )
