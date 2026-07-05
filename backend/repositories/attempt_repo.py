from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Sequence

from models.attempt import AttemptORM
from repositories.base import BaseRepository

class AttemptRepository(BaseRepository):
    def create(self, attempt: AttemptORM) -> AttemptORM:
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def get_by_segment(self, segment_id: int) -> Sequence[AttemptORM]:
        statement = select(AttemptORM).where(AttemptORM.segment_id == segment_id).order_by(AttemptORM.created_at.desc())
        return self.db.execute(statement).scalars().all()
