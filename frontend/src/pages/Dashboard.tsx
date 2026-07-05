import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trash2, Plus, Upload, BookOpen, Clock, 
  RefreshCw, ChevronRight, BarChart2, CheckCircle2, 
  HelpCircle, AlertTriangle, FileText, Download 
} from 'lucide-react';
import { api } from '../api/client';
import type { LessonDetails, GlobalStats } from '../api/client';

export default function Dashboard() {
  const [lessons, setLessons] = useState<LessonDetails[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lessonsList, globalStats] = await Promise.all([
        api.getLessons(),
        api.getStats()
      ]);
      setLessons(lessonsList);
      setStats(globalStats);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsCreating(true);
      // 1. Create Lesson
      setCreationStatus('Creating lesson metadata...');
      const lesson = await api.createLesson(newTitle);
      
      // 2. Upload Audio if present
      if (audioFile) {
        setCreationStatus('Uploading audio file...');
        await api.uploadAudio(lesson.id, audioFile);
      }
      
      // 3. Upload Subtitles if present, otherwise auto-transcribe
      if (srtFile) {
        setCreationStatus('Uploading subtitle file...');
        await api.uploadTranscript(lesson.id, srtFile);
      } else {
        setCreationStatus('Transcribing audio automatically (this may take a few seconds)...');
        await api.autoTranscribe(lesson.id);
      }

      // Refresh
      await loadData();
      setIsModalOpen(false);
      setNewTitle('');
      setAudioFile(null);
      setSrtFile(null);
      setCreationStatus('');
    } catch (err: any) {
      alert(err.message || 'Error occurred while creating lesson');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lesson? All progress and audio files will be removed.')) {
      return;
    }
    try {
      await api.deleteLesson(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete lesson');
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading && lessons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <RefreshCw className="animate-spin mr-2" /> Loading practice dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Antigravity Dictation
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            Improve your English listening comprehension through keyboard-first transcription practice.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-5 py-3 rounded-xl transition duration-200 shadow-lg shadow-indigo-500/10 cursor-pointer"
          >
            <Plus size={18} />
            Create Lesson
          </button>
          <a
            href="/api/v1/stats/export?format=csv"
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium px-4 py-3 rounded-xl transition duration-200"
          >
            <Download size={16} />
            Export CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl flex items-center gap-3 text-sm">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Analytics Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex justify-between items-start text-slate-400 mb-2">
              <span className="text-xs md:text-sm font-medium">Overall Accuracy</span>
              <BarChart2 size={18} className="text-indigo-400" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-white">
              {stats.overall_accuracy}%
            </div>
            <p className="text-xs text-indigo-400/80 mt-1">Best attempts average</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex justify-between items-start text-slate-400 mb-2">
              <span className="text-xs md:text-sm font-medium">Listening Time</span>
              <Clock size={18} className="text-purple-400" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-white">
              {formatDuration(stats.total_listening_time)}
            </div>
            <p className="text-xs text-purple-400/80 mt-1">HH:MM:SS total duration</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex justify-between items-start text-slate-400 mb-2">
              <span className="text-xs md:text-sm font-medium">Replays & Jumps</span>
              <RefreshCw size={18} className="text-pink-400" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-white">
              {stats.total_replay_count} <span className="text-sm text-slate-500 font-normal">/ {stats.total_back_jump_count}</span>
            </div>
            <p className="text-xs text-pink-400/80 mt-1">Audio loop repeats & jumps</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex justify-between items-start text-slate-400 mb-2">
              <span className="text-xs md:text-sm font-medium">Completion Progress</span>
              <CheckCircle2 size={18} className="text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-white">
              {stats.completion_progress}%
            </div>
            <p className="text-xs text-emerald-400/80 mt-1">Completed segments ratio</p>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Lessons Grid list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <BookOpen size={20} className="text-indigo-400" />
              Practice Lessons
            </h2>
            
            {lessons.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                <p>No lessons available yet.</p>
                <p className="text-xs mt-1">Click "Create Lesson" above to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson) => {
                  const hasAudio = !!lesson.audio_file;
                  const hasSRT = !!lesson.transcript_file;
                  const segmentsCount = lesson.stats.total_segments;
                  const completionPercentage = segmentsCount > 0 
                    ? Math.round((lesson.stats.completed_segments / segmentsCount) * 100)
                    : 0;

                  return (
                    <div 
                      key={lesson.id} 
                      className="group border border-slate-900 bg-slate-950/40 hover:border-slate-800/80 p-5 rounded-xl transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-slate-100 group-hover:text-indigo-300 transition duration-200">
                            {lesson.title}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hasAudio ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 text-slate-600'}`}>
                              Audio
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hasSRT ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-900 text-slate-600'}`}>
                              Subtitles
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-xs text-slate-500">
                          <span>Created {new Date(lesson.created_at).toLocaleDateString()}</span>
                          {segmentsCount > 0 && (
                            <span>{segmentsCount} segments ({lesson.stats.completed_segments} complete)</span>
                          )}
                        </div>

                        {/* Progress slider bar */}
                        {segmentsCount > 0 && (
                          <div className="w-full max-w-sm mt-3 space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Completed</span>
                              <span>{completionPercentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                                style={{ width: `${completionPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lesson Operations Panel */}
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition duration-150 cursor-pointer"
                          title="Delete Lesson"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        {hasAudio && hasSRT ? (
                          <Link
                            to={`/lessons/${lesson.id}`}
                            className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white border border-indigo-500/20 font-medium px-4 py-2.5 rounded-lg transition duration-200 cursor-pointer text-sm"
                          >
                            Practice
                            <ChevronRight size={16} />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            {!hasAudio && (
                              <div className="relative flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-550 text-indigo-300 hover:text-white border border-indigo-500/20 font-medium px-3 py-2 rounded-lg transition duration-200 cursor-pointer text-xs">
                                <Upload size={14} />
                                Add Audio
                                <input 
                                  type="file"
                                  accept=".mp3,.wav,.m4a"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        await api.uploadAudio(lesson.id, file);
                                        loadData();
                                      } catch (err: any) {
                                        alert(err.message || 'Failed to upload audio');
                                      }
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                            )}
                            {!hasSRT && (
                              <div className="relative flex items-center gap-1 bg-purple-500/10 hover:bg-purple-550 text-purple-300 hover:text-white border border-purple-500/20 font-medium px-3 py-2 rounded-lg transition duration-200 cursor-pointer text-xs">
                                <Upload size={14} />
                                Add Subtitles
                                <input 
                                  type="file"
                                  accept=".srt,.txt,.json"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        await api.uploadTranscript(lesson.id, file);
                                        loadData();
                                      } catch (err: any) {
                                        alert(err.message || 'Failed to upload subtitles');
                                      }
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Hardest segments & Missed Words */}
        <div className="space-y-6">
          {/* Hardest Segments card */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-pink-400" />
              Focus Needed (Hardest Segments)
            </h2>
            {stats?.hardest_segments && stats.hardest_segments.length > 0 ? (
              <div className="space-y-3">
                {stats.hardest_segments.map((seg, i) => (
                  <div key={i} className="bg-slate-950/50 border border-slate-900 p-3.5 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-300 font-semibold">
                      <span>Segment #{seg.segment_index}</span>
                      <span className="text-pink-400">{seg.best_accuracy}% accuracy</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{seg.lesson_title}</span>
                      <span>{seg.attempts_count} attempts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Practice segments to see focus analysis data.</p>
            )}
          </div>

          {/* Missed Words cloud */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
              <HelpCircle size={18} className="text-purple-400" />
              Common Typing Errors
            </h2>
            {stats?.missed_words && stats.missed_words.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.missed_words.map((item, i) => {
                  // Dynamic coloring and size based on miss intensity
                  const size = item.miss_count > 5 ? 'text-sm font-bold bg-rose-500/10 text-rose-300' : 'text-xs bg-slate-900 text-slate-400';
                  return (
                    <span 
                      key={i} 
                      className={`px-3 py-1.5 rounded-lg border border-slate-900 ${size}`}
                    >
                      {item.word} ({item.miss_count})
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Missed words will appear here as you submit typos.</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Lesson</h2>
              <p className="text-xs text-slate-400 mt-1">Enter a lesson title and select the audio/srt files to upload.</p>
            </div>
            
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">LESSON TITLE</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Zenlish Listening Unit 1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">AUDIO FILE (.mp3, .wav)</label>
                  <div className="relative border border-dashed border-slate-800 hover:border-indigo-500 bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition">
                    <input 
                      type="file"
                      accept=".mp3,.wav,.m4a"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={20} className="mx-auto mb-2 text-slate-500" />
                    <span className="block text-xs text-slate-400 truncate">
                      {audioFile ? audioFile.name : "Select Audio"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-350 mb-1">SRT TRANSCRIPT (.srt) - OPTIONAL</label>
                  <div className="relative border border-dashed border-slate-800 hover:border-indigo-500 bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition">
                    <input 
                      type="file"
                      accept=".srt,.txt,.json"
                      onChange={(e) => setSrtFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload size={20} className="mx-auto mb-2 text-slate-500" />
                    <span className="block text-xs text-slate-400 truncate">
                      {srtFile ? srtFile.name : "Select Transcript"}
                    </span>
                  </div>
                </div>
              </div>

              {isCreating && creationStatus && (
                <div className="bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2.5 animate-pulse">
                  <RefreshCw className="animate-spin text-indigo-400 shrink-0" size={14} />
                  <span>{creationStatus}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-800 text-white font-medium text-sm flex items-center gap-2 transition"
                >
                  {isCreating ? <RefreshCw className="animate-spin mr-1" size={14} /> : null}
                  Create Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
