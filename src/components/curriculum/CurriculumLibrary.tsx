import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { CurriculumNote, SubjectType } from '../../types/index.js';
import {
  Search,
  BookOpen,
  Bookmark,
  Sparkles,
  Edit3,
  Plus,
  Trash2,
  Clock,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';

interface CurriculumLibraryProps {
  onStudyWithRobot: (subject: SubjectType, noteId: string) => void;
}

export const CurriculumLibrary: React.FC<CurriculumLibraryProps> = ({ onStudyWithRobot }) => {
  const { user, token, role } = useAuth();
  const [notes, setNotes] = useState<CurriculumNote[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active Note Modal / Reader
  const [readingNote, setReadingNote] = useState<CurriculumNote | null>(null);

  // Admin Edit / Create State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<CurriculumNote>>({
    title: '',
    subject: 'physics',
    gradeLevel: 'Grade 11-12',
    summary: '',
    contentMarkdown: '',
    keyFormulas: [],
    visualKeywords: [],
    publishedStatus: 'published',
  });
  const [formulaInput, setFormulaInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetchNotes();
    if (token) fetchBookmarks();
  }, [selectedSubject, token]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const url =
        selectedSubject === 'all'
          ? '/api/curriculum'
          : `/api/curriculum?subject=${selectedSubject}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Failed to load curriculum notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/curriculum/bookmarks/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarkedIds(data.bookmarkedIds || []);
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  const handleToggleBookmark = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;

    try {
      const res = await fetch(`/api/curriculum/${noteId}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isBookmarked) {
          setBookmarkedIds((prev) => [...prev, noteId]);
        } else {
          setBookmarkedIds((prev) => prev.filter((id) => id !== noteId));
        }
      }
    } catch (err) {
      console.error('Bookmark toggle error:', err);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || role !== 'admin') return;

    try {
      const isNew = !editFormData.id;
      const method = isNew ? 'POST' : 'PUT';
      const endpoint = isNew ? '/api/curriculum' : `/api/curriculum/${editFormData.id}`;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (res.ok) {
        setIsEditing(false);
        fetchNotes();
        if (readingNote && editFormData.id === readingNote.id) {
          const updated = await res.json();
          setReadingNote(updated.note);
        }
      }
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!token || role !== 'admin' || !confirm('Permanently delete this curriculum note?')) return;

    try {
      const res = await fetch(`/api/curriculum/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReadingNote(null);
        fetchNotes();
      }
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q) ||
      n.visualKeywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const subjects: { id: string; label: string }[] = [
    { id: 'all', label: 'All Subjects' },
    { id: 'physics', label: 'Physics' },
    { id: 'mathematics', label: 'Mathematics' },
    { id: 'biology', label: 'Biology' },
    { id: 'computer_science', label: 'Computer Science' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-2">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Curriculum & Grounded Notes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Teacher-verified syllabus notes that ground Aero's interactive explanations.
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={() => {
              setEditFormData({
                title: '',
                subject: 'physics',
                gradeLevel: 'Grade 11-12',
                summary: '',
                contentMarkdown: '',
                keyFormulas: [],
                visualKeywords: [],
                publishedStatus: 'published',
              });
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish New Note</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Subject buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto w-full sm:w-auto">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedSubject === sub.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or formulas..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No curriculum notes found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => {
            const isBookmarked = bookmarkedIds.includes(note.id);
            return (
              <div
                key={note.id}
                onClick={() => setReadingNote(note)}
                className="flex flex-col justify-between p-6 bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all shadow-lg cursor-pointer group"
              >
                <div>
                  {/* Metadata line */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                    <span className="capitalize text-cyan-400">{note.subject.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      {role === 'admin' && (
                        <span
                          className={`text-[10px] font-sans px-1.5 py-0.5 rounded ${
                            note.publishedStatus === 'published'
                              ? 'text-emerald-400 bg-emerald-950/40'
                              : 'text-amber-400 bg-amber-950/40'
                          }`}
                        >
                          {note.publishedStatus}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleToggleBookmark(note.id, e)}
                        className={`p-1 rounded hover:bg-slate-800 ${
                          isBookmarked ? 'text-cyan-400' : 'text-slate-500'
                        }`}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark note'}
                      >
                        <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors leading-snug">
                    {note.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {note.summary}
                  </p>

                  {/* Formulas pill-less unboxed preview */}
                  {note.keyFormulas && note.keyFormulas.length > 0 && (
                    <div className="mt-4 p-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-xs font-mono text-cyan-300/90 truncate">
                      {note.keyFormulas[0]}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{note.readTimeMinutes} min read</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStudyWithRobot(note.subject, note.id);
                    }}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Study with Aero</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- DETAIL READER MODAL --- */}
      {readingNote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono text-cyan-400 capitalize">
                  {readingNote.subject.replace('_', ' ')} · {readingNote.gradeLevel}
                </div>
                <h3 className="text-xl font-bold text-slate-100 mt-1">{readingNote.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {role === 'admin' && (
                  <button
                    onClick={() => {
                      setEditFormData(readingNote);
                      setIsEditing(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                    title="Edit Note"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
                {role === 'admin' && (
                  <button
                    onClick={() => handleDeleteNote(readingNote.id)}
                    className="p-2 text-rose-400 hover:text-rose-300 bg-slate-800 rounded-lg"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setReadingNote(null)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Note content body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Key formulas section */}
              {readingNote.keyFormulas && readingNote.keyFormulas.length > 0 && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                  <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                    Governing Invariants & Formulas
                  </div>
                  <div className="space-y-1.5 font-mono text-sm text-cyan-200">
                    {readingNote.keyFormulas.map((f, i) => (
                      <div key={i} className="p-2 bg-slate-900/60 rounded border border-slate-800/80">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full markdown text */}
              <div className="prose prose-invert prose-cyan text-xs sm:text-sm text-slate-300 max-w-none whitespace-pre-wrap leading-relaxed font-sans">
                {readingNote.contentMarkdown}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/40">
              <span className="text-xs text-slate-500 font-mono">
                Author: {readingNote.authorName}
              </span>
              <button
                onClick={() => {
                  const sub = readingNote.subject;
                  const id = readingNote.id;
                  setReadingNote(null);
                  onStudyWithRobot(sub, id);
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Interactive Tutor on This Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADMIN EDIT / CREATE MODAL --- */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNote}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">
                {editFormData.id ? 'Edit Curriculum Note' : 'Create New Curriculum Note'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Subject</label>
                  <select
                    value={editFormData.subject}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, subject: e.target.value as SubjectType })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  >
                    <option value="physics">Physics</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="biology">Biology</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="computer_science">Computer Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Publication Status</label>
                  <select
                    value={editFormData.publishedStatus}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        publishedStatus: e.target.value as 'published' | 'draft',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  >
                    <option value="published">Published (Visible to students)</option>
                    <option value="draft">Draft (Restricted to faculty)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Summary</label>
                <input
                  type="text"
                  value={editFormData.summary || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Markdown Content</label>
                <textarea
                  rows={8}
                  required
                  value={editFormData.contentMarkdown || ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, contentMarkdown: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  placeholder="Enter markdown curriculum content..."
                />
              </div>

              {/* Formulas Input */}
              <div>
                <label className="block text-slate-300 mb-1">Key Formulas (LaTeX)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                    placeholder="e.g. v_x = v_0 \cos(\theta)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (formulaInput.trim()) {
                        setEditFormData({
                          ...editFormData,
                          keyFormulas: [...(editFormData.keyFormulas || []), formulaInput.trim()],
                        });
                        setFormulaInput('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200"
                  >
                    Add
                  </button>
                </div>
                {editFormData.keyFormulas && editFormData.keyFormulas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editFormData.keyFormulas.map((f, idx) => (
                      <span
                        key={idx}
                        className="p-1.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300 flex items-center gap-1.5"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() =>
                            setEditFormData({
                              ...editFormData,
                              keyFormulas: editFormData.keyFormulas?.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-rose-400 hover:text-rose-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl cursor-pointer"
              >
                Save & Deploy Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
