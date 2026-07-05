import re
from typing import List, Dict, Any, Tuple
from difflib import SequenceMatcher

def normalize_text(text: str) -> str:
    """Standardizes string token matching by lowercasing and stripping punctuation."""
    text = text.lower()
    # Replace smart quotes and dashes with standard equivalents
    text = text.replace("’", "'").replace("`", "'").replace("–", " ").replace("-", " ")
    # Keep alphanumeric characters, spaces, and apostrophes
    text = re.sub(r"[^\w\s']", "", text)
    return text

def tokenize_text(text: str) -> List[str]:
    """Tokenizes normalized text strings into lists of words."""
    return [w for w in normalize_text(text).split() if w]

def calculate_levenshtein(s1: str, s2: str) -> int:
    """Computes standard edit distance between two strings."""
    if len(s1) < len(s2):
        return calculate_levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def compute_diff(original: str, typed: str) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Compares the user typed answer with the original segment transcript.
    Returns: (accuracy_percentage, diff_tokens_list)
    """
    orig_tokens = tokenize_text(original)
    typed_tokens = tokenize_text(typed)
    
    if not orig_tokens:
        return (100.0 if not typed_tokens else 0.0), []
        
    matcher = SequenceMatcher(None, orig_tokens, typed_tokens)
    diff_result = []
    correct_words_count = 0.0
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            # Words matched exactly
            for word in orig_tokens[i1:i2]:
                diff_result.append({"word": word, "type": "correct"})
                correct_words_count += 1.0
        elif tag == 'delete':
            # Words omitted by the user
            for word in orig_tokens[i1:i2]:
                diff_result.append({"word": word, "type": "missing"})
        elif tag == 'insert':
            # Unnecessary extra words typed by the user
            for word in typed_tokens[j1:j2]:
                diff_result.append({"word": word, "type": "extra"})
        elif tag == 'replace':
            # Replacement block
            orig_sub = orig_tokens[i1:i2]
            typed_sub = typed_tokens[j1:j2]
            
            max_len = max(len(orig_sub), len(typed_sub))
            for idx in range(max_len):
                if idx < len(orig_sub) and idx < len(typed_sub):
                    o_word = orig_sub[idx]
                    t_word = typed_sub[idx]
                    dist = calculate_levenshtein(o_word, t_word)
                    
                    # Typo check: edit distance <= 2 for words longer than 3 chars
                    if dist <= 2 and len(o_word) > 3:
                        diff_result.append({"word": t_word, "type": "typo", "original": o_word})
                        correct_words_count += 0.5  # Award partial credit (50%)
                    else:
                        diff_result.append({"word": t_word, "type": "incorrect", "original": o_word})
                elif idx < len(orig_sub):
                    diff_result.append({"word": orig_sub[idx], "type": "missing"})
                else:
                    diff_result.append({"word": typed_sub[idx], "type": "extra"})
                    
    # Calculate score clamped to 0.0 - 100.0
    accuracy = (correct_words_count / len(orig_tokens)) * 100.0
    accuracy = max(0.0, min(100.0, accuracy))
    
    return round(accuracy, 1), diff_result
