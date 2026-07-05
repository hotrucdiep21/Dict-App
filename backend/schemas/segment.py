from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class AttemptResponse(BaseModel):
    id: int
    accuracy: float
    replay_count: int
    back_jump_count: int
    typing_duration: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class SegmentResponse(BaseModel):
    id: int
    index: int
    start_time: float
    end_time: float
    duration: float
    status: str
    is_bookmarked: bool
    best_accuracy: Optional[float] = None
    masked_transcript: Optional[str] = None
    best_attempt_text: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

class SegmentDetailsResponse(BaseModel):
    id: int
    lesson_id: int
    index: int
    start_time: float
    end_time: float
    duration: float
    transcript: str
    status: str
    is_bookmarked: bool
    attempts: List[AttemptResponse] = []

    model_config = {
        "from_attributes": True
    }

class BookmarkResponse(BaseModel):
    segment_id: int
    is_bookmarked: bool

class CheckAttemptRequest(BaseModel):
    typed_text: str
    replay_count: int = 0
    back_jump_count: int = 0
    typing_duration: int = 0  # in seconds

class DiffWord(BaseModel):
    word: str
    type: str  # correct, typo, incorrect, missing, extra
    original: Optional[str] = None

class CheckAttemptResponse(BaseModel):
    attempt_id: int
    accuracy: float
    status: str
    diff: List[DiffWord]

