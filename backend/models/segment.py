from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base

class SegmentORM(Base):
    __tablename__ = "segments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False
    )
    index: Mapped[int] = mapped_column(Integer, nullable=False) # 1-based index
    start_time: Mapped[float] = mapped_column(Float, nullable=False)
    end_time: Mapped[float] = mapped_column(Float, nullable=False)
    duration: Mapped[float] = mapped_column(Float, nullable=False)
    transcript: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="NOT_STARTED", nullable=False) # NOT_STARTED, IN_PROGRESS, COMPLETED, NEEDS_REVIEW
    is_bookmarked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    lesson = relationship("LessonORM", back_populates="segments")
    attempts = relationship("AttemptORM", back_populates="segment", cascade="all, delete-orphan")

    # Table constraints and optimizations
    __table_args__ = (
        UniqueConstraint("lesson_id", "index", name="uq_lesson_segment_index"),
        Index("idx_segment_lesson_id", "lesson_id"),
        Index("idx_segment_status", "status"),
    )
