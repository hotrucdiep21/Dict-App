from pydantic import BaseModel

class AudioUploadResponse(BaseModel):
    lesson_id: int
    filename: str
    duration: float
    status: str = "ready"
