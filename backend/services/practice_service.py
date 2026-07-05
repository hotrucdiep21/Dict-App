from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from models.attempt import AttemptORM
from models.segment import SegmentORM
from repositories.segment_repo import SegmentRepository
from repositories.attempt_repo import AttemptRepository
from services.diff_service import compute_diff
from utils.exceptions import InvalidFileException

class PracticeService:
    def __init__(self, segment_repo: SegmentRepository, attempt_repo: AttemptRepository):
        self.segment_repo = segment_repo
        self.attempt_repo = attempt_repo

    def check_attempt(
        self,
        segment_id: int,
        typed_text: str,
        replay_count: int,
        back_jump_count: int,
        typing_duration: int
    ) -> Tuple[AttemptORM, List[Dict[str, Any]]]:
        # Fetch segment from DB
        segment = self.segment_repo.get_by_id(segment_id)
        if not segment:
            raise InvalidFileException(f"Segment with ID {segment_id} was not found.")

        # Compute accuracy and word differences
        accuracy, diff_tokens = compute_diff(segment.transcript, typed_text)

        # Update segment practice state
        # If accuracy >= 90% mark as COMPLETED. Otherwise mark as NEEDS_REVIEW
        if accuracy >= 90.0:
            segment.status = "COMPLETED"
        else:
            segment.status = "NEEDS_REVIEW"
        
        self.segment_repo.save(segment)

        # Log attempt history
        attempt = AttemptORM(
            segment_id=segment_id,
            typed_text=typed_text,
            accuracy=accuracy,
            replay_count=replay_count,
            back_jump_count=back_jump_count,
            typing_duration=typing_duration
        )
        saved_attempt = self.attempt_repo.create(attempt)

        return saved_attempt, diff_tokens

    def toggle_bookmark(self, segment_id: int) -> SegmentORM:
        segment = self.segment_repo.get_by_id(segment_id)
        if not segment:
            raise InvalidFileException(f"Segment with ID {segment_id} was not found.")
        return self.segment_repo.toggle_bookmark(segment)
