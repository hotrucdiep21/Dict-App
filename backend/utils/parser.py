import re
import json
from typing import List, Dict, Any

from utils.exceptions import InvalidFileException

def parse_time_to_seconds(time_str: str) -> float:
    """Converts HH:MM:SS,mmm or HH:MM:SS.mmm format to float seconds."""
    try:
        time_str = time_str.strip().replace(',', '.')
        parts = time_str.split(':')
        if len(parts) != 3:
            raise ValueError()
        hours = float(parts[0])
        minutes = float(parts[1])
        seconds = float(parts[2])
        return hours * 3600 + minutes * 60 + seconds
    except Exception:
        raise InvalidFileException(f"Invalid timestamp format encountered: '{time_str}'")

def parse_srt(content: str) -> List[Dict[str, Any]]:
    """Parses SRT subtitle files into individual segment cards exactly matching SRT timelines."""
    content = content.replace('\r\n', '\n').strip()
    # Split by double newlines
    blocks = re.split(r'\n\s*\n', content)
    
    segments = []
    for idx, block in enumerate(blocks, 1):
        lines = [line.strip() for line in block.split('\n') if line.strip()]
        if len(lines) < 3:
            continue
        
        time_row = ""
        text_start_index = 2
        
        if "-->" in lines[1]:
            time_row = lines[1]
        elif "-->" in lines[0]:
            time_row = lines[0]
            text_start_index = 1
        else:
            continue
            
        times = time_row.split("-->")
        if len(times) != 2:
            raise InvalidFileException(f"Invalid timeline range format: '{time_row}'")
            
        start = parse_time_to_seconds(times[0])
        end = parse_time_to_seconds(times[1])
        
        if start >= end:
            raise InvalidFileException(f"Invalid boundary: Start time {start}s cannot be >= End time {end}s.")
            
        raw_text = " ".join(lines[text_start_index:])
        clean_text = re.sub(r'<[^>]*>', '', raw_text).strip()
        
        if clean_text:
            segments.append({
                "index": len(segments) + 1,
                "start_time": start,
                "end_time": end,
                "duration": round(end - start, 3),
                "transcript": clean_text
            })
            
    if not segments:
        raise InvalidFileException("SRT parsing resulted in zero valid segments.")
        
    # Group raw timeline blocks into statement-based segments
    merged_segments = []
    current = None
    
    for raw in segments:
        if current is None:
            current = dict(raw)
            continue
            
        should_split = False
        
        # 1. Punctuation boundary: ends with comma, period, question, exclamation, colon, or semicolon
        last_char = current["transcript"].strip()[-1]
        if last_char in [".", ",", "?", "!", ":", ";"]:
            should_split = True
            
        # 2. Timing gap: pause of >= 1.0 second
        gap = raw["start_time"] - current["end_time"]
        if gap >= 1.0:
            should_split = True
            
        # 3. Size safeguard: prevent statements from exceeding 10.0 seconds
        projected_duration = raw["end_time"] - current["start_time"]
        if projected_duration > 10.0:
            should_split = True
            
        # 4. Next line starts with a title case word (e.g. 'No. 95' or 'Welcome')
        first_word = raw["transcript"].split()[0] if raw["transcript"].split() else ""
        if first_word.startswith("No.") or (first_word.istitle() and len(first_word) > 1):
            should_split = True
            
        if should_split:
            merged_segments.append(current)
            current = dict(raw)
        else:
            # Merge with the current statement
            current["end_time"] = raw["end_time"]
            current["duration"] = round(current["end_time"] - current["start_time"], 3)
            current["transcript"] = current["transcript"] + " " + raw["transcript"]
            
    if current is not None:
        merged_segments.append(current)
        
    # Re-index the merged segments
    for idx, seg in enumerate(merged_segments, 1):
        seg["index"] = idx
        
    return merged_segments

def parse_json_transcript(content: str) -> List[Dict[str, Any]]:
    """Parses custom JSON transcript format."""
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise InvalidFileException("Invalid JSON format. Cannot parse transcript.")
        
    raw_segments = data.get("segments", [])
    if not raw_segments or not isinstance(raw_segments, list):
        raise InvalidFileException("JSON transcript must contain a 'segments' array.")
        
    segments = []
    for item in raw_segments:
        start = item.get("start") or item.get("start_time")
        end = item.get("end") or item.get("end_time")
        text = item.get("transcript") or item.get("text")
        
        if start is None or end is None or text is None:
            raise InvalidFileException("JSON segments must contain 'start', 'end', and 'transcript' properties.")
            
        start = float(start)
        end = float(end)
        text = str(text).strip()
        
        if start >= end:
            raise InvalidFileException(f"Invalid segment range: start {start}s >= end {end}s.")
            
        if text:
            segments.append({
                "start_time": start,
                "end_time": end,
                "duration": round(end - start, 3),
                "transcript": text
            })
            
    return segments
