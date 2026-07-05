from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Optional, Sequence

from models.segment import SegmentORM
from repositories.base import BaseRepository

class SegmentRepository(BaseRepository):
    def get_by_id(self, segment_id: int) -> Optional[SegmentORM]:
        statement = select(SegmentORM).where(SegmentORM.id == segment_id)
        return self.db.execute(statement).scalar_one_or_none()

    def get_by_lesson(self, lesson_id: int) -> Sequence[SegmentORM]:
        statement = select(SegmentORM).where(SegmentORM.lesson_id == lesson_id).order_by(SegmentORM.index.asc())
        return self.db.execute(statement).scalars().all()

    def save(self, segment: SegmentORM) -> SegmentORM:
        self.db.add(segment)
        self.db.commit()
        self.db.refresh(segment)
        return segment

    def toggle_bookmark(self, segment: SegmentORM) -> SegmentORM:
        segment.is_bookmarked = not segment.is_bookmarked
        self.db.add(segment)
        self.db.commit()
        self.db.refresh(segment)
        return segment
