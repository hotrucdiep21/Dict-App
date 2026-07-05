import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCw, Play, Pause, Menu, X, Mic,
  Bookmark, RefreshCw, Flame, ChevronLeft, ChevronRight,
  Rewind, FastForward
} from 'lucide-react';
import { api } from '../api/client';
import type { LessonDetails, Segment, SegmentDetails, CheckResponse } from '../api/client';
import { usePracticeStore } from '../store/store';

// Client-side text normalization
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/’/g, "'")
    .replace(/`/g, "'")
    .replace(/–/g, " ")
    .replace(/-/g, " ")
    .replace(/[^\w\s']/g, "");
}

function tokenizeText(text: string): string[] {
  return normalizeText(text).split(/\s+/).filter(Boolean);
}

// Levenshtein distance for typo checking
function levenshteinDistance(s1: string, s2: string): number {
  if (s1.length < s2.length) return levenshteinDistance(s2, s1);
  if (s2.length === 0) return s1.length;
  let previousRow = Array.from(Array(s2.length + 1).keys());
  for (let i = 0; i < s1.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[previousRow.length - 1];
}

interface RealtimeDiffWord {
  word: string;
  type: 'correct' | 'typo' | 'incorrect' | 'missing' | 'extra';
  original?: string;
}

// Longest Common Subsequence Alignment Algorithm
function alignWords(originalWords: string[], typedWords: string[]): RealtimeDiffWord[] {
  const dp: number[][] = Array(originalWords.length + 1).fill(null).map(() => Array(typedWords.length + 1).fill(0));
  for (let i = 1; i <= originalWords.length; i++) {
    for (let j = 1; j <= typedWords.length; j++) {
      if (normalizeText(originalWords[i - 1]) === normalizeText(typedWords[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = originalWords.length;
  let j = typedWords.length;
  const matches: { [key: number]: number } = {};
  while (i > 0 && j > 0) {
    if (normalizeText(originalWords[i - 1]) === normalizeText(typedWords[j - 1])) {
      matches[i - 1] = j - 1;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const diff: RealtimeDiffWord[] = [];
  let typedIdx = 0;
  for (let origIdx = 0; origIdx < originalWords.length; origIdx++) {
    if (origIdx in matches) {
      const tIdx = matches[origIdx];
      while (typedIdx < tIdx) {
        diff.push({ word: typedWords[typedIdx], type: 'extra' });
        typedIdx++;
      }
      diff.push({ word: originalWords[origIdx], type: 'correct' });
      typedIdx++;
    } else {
      if (typedIdx < typedWords.length && (origIdx === originalWords.length - 1 || !(origIdx + 1 in matches) || matches[origIdx + 1] > typedIdx)) {
        const tWord = typedWords[typedIdx];
        const dist = levenshteinDistance(normalizeText(originalWords[origIdx]), normalizeText(tWord));
        if (dist <= 2 && originalWords[origIdx].length > 3) {
          diff.push({ word: tWord, type: 'typo', original: originalWords[origIdx] });
        } else {
          diff.push({ word: tWord, type: 'incorrect', original: originalWords[origIdx] });
        }
        typedIdx++;
      } else {
        diff.push({ word: originalWords[origIdx], type: 'missing' });
      }
    }
  }
  while (typedIdx < typedWords.length) {
    diff.push({ word: typedWords[typedIdx], type: 'extra' });
    typedIdx++;
  }
  return diff;
}

function calculateRealtimeAccuracy(diff: RealtimeDiffWord[], totalOriginalWords: number): number {
  if (totalOriginalWords === 0) return 0;
  let correctCount = 0;
  for (const token of diff) {
    if (token.type === 'correct') correctCount += 1.0;
    else if (token.type === 'typo') correctCount += 0.5;
  }
  const acc = (correctCount / totalOriginalWords) * 100;
  return Math.round(Math.max(0, Math.min(100, acc)));
}

export default function LessonPractice() {
  const { id } = useParams<{ id: string }>();
  const lessonId = Number(id);
  const navigate = useNavigate();

  // Component states
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [currentSegIdx, setCurrentSegIdx] = useState<number>(0);
  const [segmentDetails, setSegmentDetails] = useState<SegmentDetails | null>(null);
  const [typedText, setTypedText] = useState('');
  
  // Realtime Diff computation states
  const [realtimeDiff, setRealtimeDiff] = useState<RealtimeDiffWord[]>([]);
  const [realtimeAccuracy, setRealtimeAccuracy] = useState(0);

  // Submitting / Checking state & drawer
  const [checkResult, setCheckResult] = useState<CheckResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);

  // Audio references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Zustand Store variables
  const {
    isPlaying, playbackRate, isLooping,
    replayCount, backJumpCount, typingDuration,
    timerActive, setIsPlaying, setPlaybackRate,
    toggleLooping, incrementReplay, incrementBackJump,
    incrementDuration, resetStats, startTimer, stopTimer
  } = usePracticeStore();

  // Load Lesson and Segments list on mount
  useEffect(() => {
    loadLessonAndSegments();
  }, [lessonId]);

  const loadLessonAndSegments = async () => {
    try {
      setLoading(true);
      const [lessonDetails, segmentsList] = await Promise.all([
        api.getLesson(lessonId),
        api.getLessonSegments(lessonId)
      ]);
      setLesson(lessonDetails);
      setSegments(segmentsList);

      const savedIndex = localStorage.getItem(`lesson_${lessonId}_segment_index`);
      const savedSpeed = localStorage.getItem(`lesson_${lessonId}_speed`);
      const savedLoop = localStorage.getItem(`lesson_${lessonId}_loop`);

      if (savedSpeed) setPlaybackRate(Number(savedSpeed));
      if (savedLoop) {
        if (JSON.parse(savedLoop) !== isLooping) toggleLooping();
      }

      let restoredIndex = 0;
      if (savedIndex && Number(savedIndex) < segmentsList.length) {
        restoredIndex = Number(savedIndex);
      }
      setCurrentSegIdx(restoredIndex);
    } catch (err) {
      console.error(err);
      alert('Failed to load lesson practice materials');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Load details whenever segment index changes
  useEffect(() => {
    if (segments.length > 0) {
      loadSegmentDetails(segments[currentSegIdx].id);
      localStorage.setItem(`lesson_${lessonId}_segment_index`, String(currentSegIdx));
    }
  }, [currentSegIdx, segments]);

  const loadSegmentDetails = async (segmentId: number) => {
    try {
      const details = await api.getSegmentDetails(segmentId);
      setSegmentDetails(details);
      setTypedText('');
      setCheckResult(null);
      setRealtimeDiff([]);
      setRealtimeAccuracy(0);
      resetStats();
      stopTimer();
      
      if (audioRef.current) {
        audioRef.current.currentTime = details.start_time;
        setCurrentTime(details.start_time);
        audioRef.current.playbackRate = playbackRate;
      }
      
      setTimeout(() => textareaRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
    }
  };

  // Run real-time alignment whenever typing input changes
  useEffect(() => {
    if (segmentDetails) {
      const originalTokens = tokenizeText(segmentDetails.transcript);
      const typedTokens = tokenizeText(typedText);
      const aligned = alignWords(originalTokens, typedTokens);
      setRealtimeDiff(aligned);
      setRealtimeAccuracy(calculateRealtimeAccuracy(aligned, originalTokens.length));
    }
  }, [typedText, segmentDetails]);

  // Persist speed alterations
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
    localStorage.setItem(`lesson_${lessonId}_speed`, String(playbackRate));
  }, [playbackRate, lessonId]);

  // Persist loop toggles
  useEffect(() => {
    localStorage.setItem(`lesson_${lessonId}_loop`, String(isLooping));
  }, [isLooping, lessonId]);

  // Timer stopwatch trigger
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && timerActive) {
      interval = setInterval(() => {
        incrementDuration();
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timerActive]);

  const insertTextAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const newVal = currentVal.substring(0, start) + text + currentVal.substring(end);
    setTypedText(newVal);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (checkResult) {
          handleNextSegment();
        } else {
          handleCheckAnswer();
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        handleReplay();
        return;
      }

      if (e.key === '>') {
        e.preventDefault();
        handleNextSegment();
        return;
      }

      if (e.key === '<') {
        e.preventDefault();
        handlePrevSegment();
        return;
      }

      // Shortcut: plain '2' to Rewind 3s, 'Ctrl + 2' to type number '2'
      if (e.key === '2') {
        e.preventDefault();
        if (e.ctrlKey) {
          insertTextAtCursor('2');
        } else {
          handleRewind();
        }
        return;
      }

      // Shortcut: plain '3' to Forward 3s, 'Ctrl + 3' to type number '3'
      if (e.key === '3') {
        e.preventDefault();
        if (e.ctrlKey) {
          insertTextAtCursor('3');
        } else {
          handleForward();
        }
        return;
      }

      if (isInputFocused) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'r':
          e.preventDefault();
          handleReplay();
          break;
        case 'b':
          e.preventDefault();
          handleRewind();
          break;
        case 'f':
          e.preventDefault();
          handleForward();
          break;
        case 'n':
          e.preventDefault();
          handleNextSegment();
          break;
        case 'p':
          e.preventDefault();
          handlePrevSegment();
          break;
        case 'l':
          e.preventDefault();
          toggleLooping();
          break;
        case '+':
        case '=':
          e.preventDefault();
          setPlaybackRate(playbackRate + 0.1);
          break;
        case '-':
          e.preventDefault();
          setPlaybackRate(playbackRate - 0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, playbackRate, isLooping, segmentDetails, currentSegIdx, typedText, checkResult]);

  const togglePlay = () => {
    if (!audioRef.current || !segmentDetails) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      stopTimer();
    } else {
      if (audioRef.current.currentTime >= segmentDetails.end_time) {
        audioRef.current.currentTime = segmentDetails.start_time;
      }
      audioRef.current.play();
      setIsPlaying(true);
      startTimer();
    }
  };

  const handleReplay = () => {
    if (!audioRef.current || !segmentDetails) return;
    audioRef.current.currentTime = segmentDetails.start_time;
    setCurrentTime(segmentDetails.start_time);
    
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
    
    incrementReplay();
    startTimer();
  };

  const handleRewind = () => {
    if (!audioRef.current || !segmentDetails) return;
    const newPos = Math.max(segmentDetails.start_time, audioRef.current.currentTime - 3);
    audioRef.current.currentTime = newPos;
    setCurrentTime(newPos);
    
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
    
    incrementBackJump();
    startTimer();
  };

  const handleForward = () => {
    if (!audioRef.current || !segmentDetails) return;
    const newPos = Math.min(segmentDetails.end_time, audioRef.current.currentTime + 3);
    audioRef.current.currentTime = newPos;
    setCurrentTime(newPos);
    
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current || !segmentDetails) return;
    const pos = audioRef.current.currentTime;
    setCurrentTime(pos);

    if (pos >= segmentDetails.end_time) {
      if (isLooping) {
        audioRef.current.currentTime = segmentDetails.start_time;
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        stopTimer();
      }
    }
  };

  const handleNextSegment = () => {
    if (currentSegIdx < segments.length - 1) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setCurrentSegIdx(currentSegIdx + 1);
    }
  };

  const handlePrevSegment = () => {
    if (currentSegIdx > 0) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setCurrentSegIdx(currentSegIdx - 1);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!segmentDetails) return;
    try {
      const res = await api.toggleBookmark(segmentDetails.id);
      setSegmentDetails({
        ...segmentDetails,
        is_bookmarked: res.is_bookmarked
      });
      const segmentsList = await api.getLessonSegments(lessonId);
      setSegments(segmentsList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckAnswer = async () => {
    if (!segmentDetails || isSubmitting || !typedText.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await api.checkAttempt(segmentDetails.id, typedText, {
        replay_count: replayCount,
        back_jump_count: backJumpCount,
        typing_duration: typingDuration
      });

      setCheckResult(res);

      const [updatedDetails, segmentsList] = await Promise.all([
        api.getSegmentDetails(segmentDetails.id),
        api.getLessonSegments(lessonId)
      ]);
      
      setSegmentDetails(updatedDetails);
      setSegments(segmentsList);
      textareaRef.current?.focus();
    } catch (err: any) {
      alert(err.message || 'Error checking attempt answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccuracyEmoji = (acc: number) => {
    if (acc >= 90) return '🔥';
    if (acc >= 50) return '😐';
    return '😔';
  };



  const formatSegmentTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `[${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}]`;
  };

  const renderSidebarTranscript = (seg: Segment) => {
    if (!seg.best_attempt_text) {
      return <span>{seg.masked_transcript}</span>;
    }
    
    const originalTokens = tokenizeText(seg.masked_transcript);
    const typedTokens = tokenizeText(seg.best_attempt_text || '');
    const diff = alignWords(originalTokens, typedTokens);
    
    return (
      <span className="flex flex-wrap gap-x-1.5 gap-y-1">
        {diff.map((token, i) => {
          if (token.type === 'correct') {
            return (
              <span key={i} className="text-emerald-450 font-bold">
                {token.word}
              </span>
            );
          }
          if (token.type === 'typo' || token.type === 'incorrect') {
            return (
              <span key={i} className="text-amber-500 font-bold inline-flex items-center gap-0.5">
                {token.word}
                {token.original && (
                  <span className="text-slate-550 font-sans text-[9px] font-normal">({token.original})</span>
                )}
              </span>
            );
          }
          if (token.type === 'missing') {
            return (
              <span key={i} className="text-slate-650 tracking-wider">
                {"*".repeat(token.word.length)}
              </span>
            );
          }
          if (token.type === 'extra') {
            return (
              <span key={i} className="text-indigo-400 italic">
                ({token.word})
              </span>
            );
          }
          return null;
        })}
      </span>
    );
  };

  if (loading || !lesson || !segmentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin mr-2" /> Loading practice workspace...
      </div>
    );
  }

  const audioUrl = `/uploads/audio/${lessonId}_${lesson.audio_file?.filename}`;
  const totalSegments = segments.length;
  const progressRatio = totalSegments > 0 
    ? (currentTime - segmentDetails.start_time) / segmentDetails.duration 
    : 0;

  // Choose which diff dataset to render: final check result or real-time typing diff
  const activeDiff = checkResult ? checkResult.diff : realtimeDiff;
  const activeAccuracy = checkResult ? checkResult.accuracy : realtimeAccuracy;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-80px)]">
      {/* Hidden Audio element */}
      <audio 
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleAudioTimeUpdate}
        preload="auto"
      />
      {/* Sidebar PHỤ ĐỀ (Exact Left Panel matching) */}
      <div className="w-full lg:w-80 flex flex-col bg-slate-950/40 border border-slate-900 rounded-2xl p-5 h-[350px] lg:h-[650px]">
        <h3 className="font-extrabold text-sm text-slate-200 border-b border-slate-900 pb-3 mb-4 tracking-wider flex items-center gap-2">
          <Bookmark size={16} className="text-emerald-500" />
          PHỤ ĐỀ
        </h3>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {segments.map((seg, i) => {
            const isActive = i === currentSegIdx;

            return (
              <div 
                key={seg.id}
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setIsPlaying(false);
                  setCurrentSegIdx(i);
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition duration-150 space-y-2 select-none ${
                  isActive 
                    ? 'border-emerald-500/50 bg-emerald-950/10 text-emerald-300' 
                    : 'border-slate-900/60 bg-slate-950/20 text-slate-500 hover:border-slate-800 hover:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold tracking-wide">
                  <span>#{seg.index} - {formatSegmentTime(seg.start_time)}</span>
                  <span>{seg.duration}s</span>
                </div>
                <div className="text-xs break-words leading-relaxed font-mono font-medium">
                  {renderSidebarTranscript(seg)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="pt-3 border-t border-slate-900 text-[10px] text-slate-650 flex justify-between font-mono font-bold">
          <span>Hoàn thành: {segments.filter(s => s.status === 'COMPLETED').length}/{totalSegments}</span>
          <span>TB: {lesson.stats.average_accuracy || 0}%</span>
        </div>
      </div>

      {/* Center Console: Practice Workspace */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="max-w-xl w-full space-y-6">
          {/* Outline Control Nav Bar (Exact Image Matching) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="p-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition cursor-pointer"
                title="Quay lại"
              >
                <ArrowLeft size={20} />
              </button>
              
              <button
                onClick={handlePrevSegment}
                disabled={currentSegIdx === 0}
                className="p-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Phân đoạn trước (P)"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={handleReplay}
                className="p-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition cursor-pointer"
                title="Phát lại từ đầu (R)"
              >
                <RotateCw size={20} />
              </button>

              <button
                onClick={handleRewind}
                className="p-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition cursor-pointer"
                title="Tua lại 3s (B)"
              >
                <Rewind size={20} />
              </button>
              
              <button
                onClick={togglePlay}
                className="p-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition cursor-pointer"
                title="Phát / Dừng (Space)"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <button
                onClick={handleForward}
                className="p-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition cursor-pointer"
                title="Tua đi 3s (F)"
              >
                <FastForward size={20} />
              </button>

              <button
                onClick={handleNextSegment}
                disabled={currentSegIdx === segments.length - 1}
                className="p-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Phân đoạn sau (N)"
              >
                <ChevronRight size={20} />
              </button>

              <button
                onClick={handleNextSegment}
                className="px-4 py-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition font-bold text-sm cursor-pointer"
                title="Bỏ qua phân đoạn này (N)"
              >
                Bỏ qua
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleBookmarkToggle}
                className={`p-2 border-2 rounded-xl transition cursor-pointer ${
                  segmentDetails.is_bookmarked 
                    ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                    : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Bookmark segment"
              >
                <Bookmark size={20} className={segmentDetails.is_bookmarked ? 'fill-purple-400' : ''} />
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 border-2 border-emerald-500 rounded-xl text-emerald-500 bg-transparent hover:bg-emerald-950/20 active:bg-emerald-950/40 transition cursor-pointer lg:hidden"
                title="Mục lục bài học"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* Locked Seek Progress Bar */}
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${Math.min(100, progressRatio * 100)}%` }}
            />
          </div>

          {/* Dictation Textarea Box (Exact Image Matching) */}
          <div className="relative bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-44 shadow-lg">
            {typedText && (
              <button
                onClick={() => setTypedText('')}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition cursor-pointer bg-slate-900/60 p-1 rounded-full z-10"
              >
                <X size={16} />
              </button>
            )}

            <textarea
              ref={textareaRef}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="Nghe kỹ và gõ lại những gì bạn nghe thấy..."
              disabled={isSubmitting}
              className="w-full h-28 bg-transparent text-slate-100 placeholder-slate-650 focus:outline-none resize-none leading-relaxed text-sm pr-6"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-slate-500">
              <div className="flex items-center gap-2">
                <Mic size={18} className="text-slate-400" />
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Easy
                </span>
              </div>
              {isPlaying && (
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                  <Flame size={12} className="text-emerald-500 animate-pulse" />
                  Thời gian: {typingDuration}s
                </span>
              )}
            </div>
          </div>

          {/* Big Action button */}
          <button
            onClick={checkResult ? handleNextSegment : handleCheckAnswer}
            disabled={isSubmitting || (!typedText.trim() && !checkResult)}
            className="w-full bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 disabled:bg-slate-900 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition duration-150 flex items-center justify-center gap-1 cursor-pointer text-sm shadow-md"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : checkResult ? (
              'Tiếp theo ➔'
            ) : (
              'Kiểm tra ➔'
            )}
          </button>

          {/* Real-time word badges list */}
          {activeDiff.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="text-sm font-semibold text-slate-350 flex items-center gap-1.5 font-mono">
                <span>Khớp:</span>
                <span className={activeAccuracy >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
                  {activeAccuracy}%
                </span>
                <span>{getAccuracyEmoji(activeAccuracy)}</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {activeDiff.map((token, i) => {
                  if (token.type === 'correct') {
                    return (
                      <div 
                        key={i} 
                        className="border border-emerald-950 bg-emerald-950/20 text-emerald-400 font-medium px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        {token.word}
                      </div>
                    );
                  }
                  if (token.type === 'typo' || token.type === 'incorrect') {
                    return (
                      <div 
                        key={i} 
                        className="border border-amber-950 bg-amber-950/20 text-amber-400 font-medium px-3 py-1.5 rounded-lg text-sm transition"
                      >
                        {token.word}
                      </div>
                    );
                  }
                  if (token.type === 'missing') {
                    return (
                      <div 
                        key={i} 
                        className="border border-slate-900 bg-slate-950/40 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-sm select-none tracking-widest font-mono"
                        title="Chưa gõ từ này"
                      >
                        {"*".repeat(token.word.length)}
                      </div>
                    );
                  }
                  if (token.type === 'extra') {
                    return (
                      <div 
                        key={i} 
                        className="border border-indigo-950 bg-indigo-950/20 text-indigo-400 italic px-3 py-1.5 rounded-lg text-sm transition"
                        title="Gõ dư từ này"
                      >
                        ({token.word})
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}

          {/* Speed multiplier settings tray */}
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-900 p-4 rounded-xl text-xs gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold uppercase">Tốc độ:</span>
              {[0.5, 0.75, 0.9, 1.0, 1.1, 1.25].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackRate(s)}
                  className={`px-2 py-1 rounded font-mono text-[10px] cursor-pointer ${
                    playbackRate === s 
                      ? 'bg-emerald-500 text-slate-950 font-bold' 
                      : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s.toFixed(2)}x
                </button>
              ))}
            </div>
            <button
              onClick={toggleLooping}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold tracking-wide uppercase transition cursor-pointer ${
                isLooping 
                  ? 'bg-pink-500/10 border-pink-500/30 text-pink-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              Lặp lại
            </button>
          </div>
        </div>
      </div>

      {/* Floating drawer segment lists on smaller screens */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div 
            onClick={() => setShowSidebar(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <div className="relative w-80 bg-[#090d16] border-l border-slate-900 h-full p-5 flex flex-col justify-between shadow-2xl z-10">
            <div>
              <div className="flex justify-between items-center border-b border-slate-900 pb-3 mb-4">
                <h3 className="font-bold text-slate-250 text-sm uppercase tracking-wider">PHỤ ĐỀ</h3>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-900 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
                {segments.map((seg, i) => {
                  const isActive = i === currentSegIdx;

                  return (
                    <button
                      key={seg.id}
                      onClick={() => {
                        if (audioRef.current) audioRef.current.pause();
                        setIsPlaying(false);
                        setCurrentSegIdx(i);
                        setShowSidebar(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition duration-150 space-y-1.5 cursor-pointer ${
                        isActive 
                          ? 'border-emerald-500/50 bg-emerald-950/10 text-emerald-300' 
                          : 'border-slate-900/60 bg-slate-950/20 text-slate-550'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <span>#{seg.index} - {formatSegmentTime(seg.start_time)}</span>
                        <span>{seg.duration}s</span>
                      </div>
                      <div className="text-xs break-words leading-relaxed font-mono font-medium">
                        {renderSidebarTranscript(seg)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-slate-600 border-t border-slate-900 pt-3 flex justify-between font-mono font-bold">
              <span>Đã hoàn thành: {segments.filter(s => s.status === 'COMPLETED').length}/{totalSegments}</span>
              <span>TB: {lesson.stats.average_accuracy || 0}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
