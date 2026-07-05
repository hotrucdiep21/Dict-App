import os
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_lesson_full_lifecycle():
    # 1. Create Lesson
    response = client.post("/api/v1/lessons", json={"title": "Integration Test Lesson"})
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    lesson_id = data["id"]
    assert data["title"] == "Integration Test Lesson"

    # 2. Upload Real MP3 File (provided in uploads/ folder)
    mp3_path = "uploads/zenlish-test-02-95-97.mp3"
    if os.path.exists(mp3_path):
        with open(mp3_path, "rb") as f:
            audio_data = f.read()
    else:
        audio_data = b"ID3\x03\x00\x00\x00\x00\x00\x00"

    response = client.post(
        f"/api/v1/lessons/{lesson_id}/audio",
        files={"file": ("test.mp3", audio_data, "audio/mpeg")}
    )
    assert response.status_code == 200
    audio_response = response.json()
    assert audio_response["filename"] == "test.mp3"
    # If using the real mp3 file, the duration should be positive
    if os.path.exists(mp3_path):
        assert audio_response["duration"] > 0.0

    # 3. Upload SRT Transcript
    srt_content = (
        "1\n"
        "00:00:01,000 --> 00:00:05,000\n"
        "Clean architecture is awesome.\n\n"
        "2\n"
        "00:00:06,000 --> 00:00:10,000\n"
        "Write tests for your backend code.\n"
    ).encode("utf-8")

    response = client.post(
        f"/api/v1/lessons/{lesson_id}/transcript",
        files={"file": ("test.srt", srt_content, "text/plain")}
    )
    assert response.status_code == 200
    transcript_response = response.json()
    assert transcript_response["format"] == "srt"
    assert transcript_response["segments_created"] == 2

    # 4. Get Lesson Segments
    response = client.get(f"/api/v1/lessons/{lesson_id}/segments")
    assert response.status_code == 200
    segments = response.json()
    assert len(segments) == 2
    seg1_id = segments[0]["id"]
    seg2_id = segments[1]["id"]
    assert segments[0]["status"] == "NOT_STARTED"

    # 5. Check Bookmark Toggle
    response = client.post(f"/api/v1/segments/{seg1_id}/bookmark")
    assert response.status_code == 200
    assert response.json()["is_bookmarked"] is True

    # 6. Fetch Segment Details
    response = client.get(f"/api/v1/segments/{seg1_id}")
    assert response.status_code == 200
    details = response.json()
    assert details["is_bookmarked"] is True
    assert details["transcript"] == "Clean architecture is awesome."

    # 7. Check Attempt with Typo (90% threshold check)
    # Target: "Clean architecture is awesome."
    # User types: "Clean architecure is awesome" (typo: architecure -> distance 1)
    response = client.post(
        f"/api/v1/segments/{seg1_id}/check",
        json={
            "typed_text": "Clean architecure is awesome.",
            "replay_count": 2,
            "back_jump_count": 1,
            "typing_duration": 15
        }
    )
    assert response.status_code == 200
    check_response = response.json()
    assert check_response["accuracy"] >= 80.0  # Partial credit given for typo
    assert check_response["status"] in ["COMPLETED", "NEEDS_REVIEW"]

    # 8. Check Perfect Attempt
    # Target: "Write tests for your backend code."
    response = client.post(
        f"/api/v1/segments/{seg2_id}/check",
        json={
            "typed_text": "Write tests for your backend code.",
            "replay_count": 1,
            "back_jump_count": 0,
            "typing_duration": 10
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"

    # 9. Get Global Stats
    response = client.get("/api/v1/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_listening_time"] >= 25
    assert stats["total_replay_count"] >= 3
    assert len(stats["missed_words"]) >= 0

    # 10. Export Data (CSV and JSON)
    response = client.get("/api/v1/stats/export?format=json")
    assert response.status_code == 200
    assert len(response.json()) >= 2

    response = client.get("/api/v1/stats/export?format=csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]

    # 11. Delete Lesson
    response = client.delete(f"/api/v1/lessons/{lesson_id}")
    assert response.status_code == 200

    # 12. Verify Cleanup
    response = client.get(f"/api/v1/lessons/{lesson_id}")
    assert response.status_code == 404
