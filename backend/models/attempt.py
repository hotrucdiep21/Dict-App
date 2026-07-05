from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from models.base import Base

class AttemptORM(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    segment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("segments.id", ondelete="CASCADE"),
        nullable=False
    )
    typed_text: Mapped[str] = mapped_column(Text, nullable=False)
    accuracy: Mapped[float] = mapped_column(Float, nullable=False)
    replay_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    back_jump_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    typing_duration: Mapped[int] = mapped_column(Integer, nullable=False) # in seconds
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    segment = relationship("SegmentORM", back_populates="attempts")

    # Indexing optimizations
    __table_args__ = (
        Index("idx_attempt_segment_id", "segment_id"),
    )
