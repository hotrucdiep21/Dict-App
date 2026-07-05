from pydantic import BaseModel

class TranscriptUploadResponse(BaseModel):
    lesson_id: int
    filename: str
    format: str
    segments_created: int
