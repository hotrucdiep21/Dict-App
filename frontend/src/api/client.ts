export interface LessonStats {
  total_segments: number;
  completed_segments: number;
  needs_review_segments: number;
  average_accuracy: number | null;
}

export interface AudioMetadata {
  filename: string;
  duration: number;
}

export interface TranscriptMetadata {
  filename: string;
  format: string;
}

export interface LessonDetails {
  id: number;
  title: string;
  created_at: string;
  audio_file: AudioMetadata | null;
  transcript_file: TranscriptMetadata | null;
  stats: LessonStats;
}

export interface Segment {
  id: number;
  index: number;
  start_time: number;
  end_time: number;
  duration: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'COMPLETED';
  is_bookmarked: boolean;
  best_accuracy: number | null;
  masked_transcript: string;
  best_attempt_text: string | null;
}

export interface Attempt {
  id: number;
  accuracy: number;
  replay_count: number;
  back_jump_count: number;
  typing_duration: number;
  created_at: string;
}

export interface SegmentDetails {
  id: number;
  lesson_id: number;
  index: number;
  start_time: number;
  end_time: number;
  duration: number;
  transcript: string;
  status: string;
  is_bookmarked: boolean;
  attempts: Attempt[];
}

export interface DiffWord {
  word: string;
  type: 'correct' | 'typo' | 'incorrect' | 'missing' | 'extra';
  original?: string;
}

export interface CheckResponse {
  attempt_id: number;
  accuracy: number;
  status: string;
  diff: DiffWord[];
}

export interface BookmarkResponse {
  segment_id: number;
  is_bookmarked: boolean;
}

export interface HardestSegment {
  lesson_title: string;
  segment_index: number;
  best_accuracy: number;
  attempts_count: number;
}

export interface MissedWord {
  word: string;
  miss_count: number;
}

export interface GlobalStats {
  overall_accuracy: number;
  total_listening_time: number;
  total_replay_count: number;
  total_back_jump_count: number;
  average_attempts_per_segment: number;
  completion_progress: number;
  hardest_segments: HardestSegment[];
  missed_words: MissedWord[];
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('/') ? path : `/api/v1/${path}`;
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || errData?.detail || `HTTP error! status: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}

export const api = {
  getLessons: () => apiFetch<LessonDetails[]>('lessons'),
  getLesson: (id: number) => apiFetch<LessonDetails>(`lessons/${id}`),
  getLessonSegments: (id: number) => apiFetch<Segment[]>(`lessons/${id}/segments`),
  createLesson: (title: string) => apiFetch<LessonDetails>('lessons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  }),
  uploadAudio: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ filename: string; duration: number }>(`lessons/${id}/audio`, {
      method: 'POST',
      body: formData,
    });
  },
  uploadTranscript: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ segments_created: number }>(`lessons/${id}/transcript`, {
      method: 'POST',
      body: formData,
    });
  },
  deleteLesson: (id: number) => apiFetch<{ message: string }>(`lessons/${id}`, {
    method: 'DELETE',
  }),
  autoTranscribe: (id: number) => {
    return apiFetch<{ message: string; segments_created: number }>(`lessons/${id}/auto-transcribe`, {
      method: 'POST',
    });
  },
  getSegmentDetails: (id: number) => apiFetch<SegmentDetails>(`segments/${id}`),
  toggleBookmark: (id: number) => apiFetch<BookmarkResponse>(`segments/${id}/bookmark`, {
    method: 'POST',
  }),
  checkAttempt: (
    segmentId: number,
    typedText: string,
    stats: { replay_count: number; back_jump_count: number; typing_duration: number }
  ) => apiFetch<CheckResponse>(`segments/${segmentId}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      typed_text: typedText,
      ...stats,
    }),
  }),
  getStats: () => apiFetch<GlobalStats>('stats'),
};
