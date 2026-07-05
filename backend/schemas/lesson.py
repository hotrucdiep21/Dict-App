from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class LessonCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="The title of the lesson")

class LessonResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class AudioMetadataResponse(BaseModel):
    filename: str
    duration: float

    model_config = {
        "from_attributes": True
    }

class TranscriptMetadataResponse(BaseModel):
    filename: str
    format: str

    model_config = {
        "from_attributes": True
    }

class LessonStats(BaseModel):
    total_segments: int = 0
    completed_segments: int = 0
    needs_review_segments: int = 0
    average_accuracy: Optional[float] = None

class LessonDetailsResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    audio_file: Optional[AudioMetadataResponse] = None
    transcript_file: Optional[TranscriptMetadataResponse] = None
    stats: Optional[LessonStats] = None

    model_config = {
        "from_attributes": True
    }
