from datetime import datetime
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base

class LessonORM(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    # ON DELETE CASCADE is configured via SQLAlchemy cascade rules to automatically delete related resources
    audio_file = relationship(
        "AudioFileORM",
        back_populates="lesson",
        uselist=False,
        cascade="all, delete-orphan"
    )
    transcript = relationship(
        "TranscriptORM",
        back_populates="lesson",
        uselist=False,
        cascade="all, delete-orphan"
    )
    segments = relationship(
        "SegmentORM",
        back_populates="lesson",
        cascade="all, delete-orphan"
    )
