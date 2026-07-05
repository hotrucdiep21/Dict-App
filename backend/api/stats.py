import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import select

from db.session import get_db
from services.stats_service import StatsService
from models.attempt import AttemptORM

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("")
def get_stats(db: Session = Depends(get_db)):
    service = StatsService(db)
    return service.get_global_stats()

@router.get("/export")
def export_stats(format: str = Query("csv", pattern="^(csv|json)$"), db: Session = Depends(get_db)):
    # Fetch attempts sorted by completion date
    attempts = db.execute(
        select(AttemptORM).order_by(AttemptORM.created_at.desc())
    ).scalars().all()
    
    if format == "json":
        data = []
        for a in attempts:
            data.append({
                "lesson_title": a.segment.lesson.title if a.segment else "Unknown",
                "segment_index": a.segment.index if a.segment else 0,
                "accuracy": a.accuracy,
                "replay_count": a.replay_count,
                "back_jump_count": a.back_jump_count,
                "typing_duration": a.typing_duration,
                "created_at": a.created_at.isoformat()
            })
        return JSONResponse(content=data)
        
    # Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header columns
    writer.writerow([
        "Lesson Title",
        "Segment Index",
        "Accuracy (%)",
        "Replay Count",
        "Back Jump Count",
        "Typing Duration (s)",
        "Created At"
    ])
    
    # Write attempt rows
    for a in attempts:
        writer.writerow([
            a.segment.lesson.title if a.segment else "Unknown",
            a.segment.index if a.segment else 0,
            a.accuracy,
            a.replay_count,
            a.back_jump_count,
            a.typing_duration,
            a.created_at.isoformat()
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dictation_history.csv"}
    )
