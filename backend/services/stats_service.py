from sqlalchemy import select, func
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from collections import Counter

from models.lesson import LessonORM
from models.segment import SegmentORM
from models.attempt import AttemptORM
from services.diff_service import compute_diff

class StatsService:
    def __init__(self, db: Session):
        self.db = db

    def get_global_stats(self) -> Dict[str, Any]:
        # Fetch all segments and attempts
        segments = self.db.execute(select(SegmentORM)).scalars().all()
        attempts = self.db.execute(select(AttemptORM)).scalars().all()

        total_segments = len(segments)
        completed_segments = sum(1 for s in segments if s.status == "COMPLETED")
        
        # Calculate completion ratio
        completion_progress = (completed_segments / total_segments * 100.0) if total_segments > 0 else 0.0

        total_listening_time = sum(a.typing_duration for a in attempts)
        total_replay_count = sum(a.replay_count for a in attempts)
        total_back_jump_count = sum(a.back_jump_count for a in attempts)

        # Calculate average attempts per attempted segment
        attempted_segment_ids = {a.segment_id for a in attempts}
        attempted_count = len(attempted_segment_ids)
        avg_attempts = (len(attempts) / attempted_count) if attempted_count > 0 else 0.0

        # Calculate overall average accuracy based on best attempts of each segment
        best_accuracies = []
        for s in segments:
            if s.attempts:
                best_acc = max(a.accuracy for a in s.attempts)
                best_accuracies.append(best_acc)
        overall_accuracy = (sum(best_accuracies) / len(best_accuracies)) if best_accuracies else 0.0

        # Extract hardest segments (segments with lowest best accuracy or highest attempt count)
        hardest_segments_data = []
        for s in segments:
            if s.attempts:
                best_acc = max(a.accuracy for a in s.attempts)
                hardest_segments_data.append({
                    "lesson_title": s.lesson.title,
                    "segment_index": s.index,
                    "best_accuracy": best_acc,
                    "attempts_count": len(s.attempts)
                })
        
        # Sort hardest segments by attempts descending, then best accuracy ascending
        hardest_segments_data.sort(key=lambda x: (-x["attempts_count"], x["best_accuracy"]))
        hardest_segments = hardest_segments_data[:5]

        # Extract misspelled / missed words frequencies
        # We parse the diff of the most recent attempt of each segment
        missed_words_counter = Counter()
        for s in segments:
            # Get the most recent attempt
            if s.attempts:
                latest_attempt = max(s.attempts, key=lambda a: a.created_at)
                _, diff_tokens = compute_diff(s.transcript, latest_attempt.typed_text)
                for token in diff_tokens:
                    if token["type"] in ["typo", "incorrect", "missing"]:
                        # Extract the target word that was missed or typed incorrectly
                        target_word = token.get("original") or token["word"]
                        missed_words_counter[target_word] += 1

        # Format most missed words
        missed_words = [
            {"word": word, "miss_count": count}
            for word, count in missed_words_counter.most_common(10)
        ]

        return {
            "overall_accuracy": round(overall_accuracy, 1),
            "total_listening_time": total_listening_time,
            "total_replay_count": total_replay_count,
            "total_back_jump_count": total_back_jump_count,
            "average_attempts_per_segment": round(avg_attempts, 1),
            "completion_progress": round(completion_progress, 1),
            "hardest_segments": hardest_segments,
            "missed_words": missed_words
        }
