import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LessonPractice from './pages/LessonPractice';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#090d16] text-slate-100">
        {/* Navigation Header */}
        <header className="border-b border-slate-900 bg-slate-950/30 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded font-mono">AG</span>
              Antigravity Dictation
            </Link>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Version 1.0 (Local Only)</span>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)]">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lessons/:id" element={<LessonPractice />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
