import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { CurriculumNote, SubjectType } from '../../types/index.js';
import {
  Upload,
  Image as ImageIcon,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Layers,
  GraduationCap,
  X,
  Eye,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { user, token, role, logout } = useAuth();
  const [notes, setNotes] = useState<CurriculumNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Available classes managed by admin
  const [availableClasses, setAvailableClasses] = useState<string[]>([
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
  ]);

  // Modal / Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectType>('physics');
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 11');
  const [summary, setSummary] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [notePhotoUrl, setNotePhotoUrl] = useState<string>('');
  const [whatIsTaughtList, setWhatIsTaughtList] = useState<string[]>([]);
  const [whatIsTaughtInput, setWhatIsTaughtInput] = useState('');
  const [keyFormulas, setKeyFormulas] = useState<string[]>([]);
  const [formulaInput, setFormulaInput] = useState('');
  const [publishedStatus, setPublishedStatus] = useState<'published' | 'draft'>('published');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) fetchAdminNotes();
  }, [token, selectedSubject, selectedClass]);

  const fetchAdminNotes = async () => {
    try {
      setIsLoading(true);
      let url = '/api/curriculum';
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedClass !== 'all') params.append('classGrade', selectedClass);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Failed to load admin notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Photo File Upload (Convert to base64 Data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNotePhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCreate = () => {
    setEditingNoteId(null);
    setTitle('');
    setSubject('physics');
    setChapterNumber(notes.length + 1);
    setGradeLevel('Grade 11');
    setSummary('');
    setContentMarkdown('');
    setNotePhotoUrl('');
    setWhatIsTaughtList([]);
    setWhatIsTaughtInput('');
    setKeyFormulas([]);
    setFormulaInput('');
    setPublishedStatus('published');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (note: CurriculumNote) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setSubject(note.subject);
    setChapterNumber(note.chapterNumber || 1);
    setGradeLevel(note.gradeLevel);
    setSummary(note.summary);
    setContentMarkdown(note.contentMarkdown);
    setNotePhotoUrl(note.notePhotoUrl || '');
    setWhatIsTaughtList(note.whatIsTaught || []);
    setWhatIsTaughtInput('');
    setKeyFormulas(note.keyFormulas || []);
    setFormulaInput('');
    setPublishedStatus(note.publishedStatus);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payload = {
      title,
      subject,
      chapterNumber,
      gradeLevel,
      summary,
      contentMarkdown,
      notePhotoUrl: notePhotoUrl || undefined,
      whatIsTaught: whatIsTaughtList,
      keyFormulas,
      publishedStatus,
    };

    try {
      const endpoint = editingNoteId ? `/api/curriculum/${editingNoteId}` : '/api/curriculum';
      const method = editingNoteId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditorOpen(false);
        fetchAdminNotes();
      }
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this chapter note?')) return;
    try {
      const res = await fetch(`/api/curriculum/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAdminNotes();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="p-8 text-center max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <ShieldAlert className="w-12 h-12 text-purple-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Admin Portal Restricted</h3>
        <p className="text-xs text-slate-400">
          The admin portal requires administrator credentials. Log in with username <strong>admin</strong> and password <strong>admin</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-2">
      {/* Portal Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-purple-950/20 border border-purple-800/40 rounded-3xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-purple-300 font-semibold uppercase">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Faculty & Curriculum Control Center</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            Admin Portal: Curriculum & Note Uploads
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Configure what chapters, subjects, and classes are taught. Upload note photos and diagrams that Aero will display and teach.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-950"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Chapter & Note Photo</span>
        </button>
      </div>

      {/* Class Scope & Filtering Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs">
        {/* Class Selection */}
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-slate-400 font-mono">Target Class:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono"
          >
            <option value="all">All Configured Classes</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-400 font-mono">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono"
          >
            <option value="all">All Subjects</option>
            <option value="physics">Physics</option>
            <option value="mathematics">Mathematics</option>
            <option value="biology">Biology</option>
            <option value="chemistry">Chemistry</option>
            <option value="computer_science">Computer Science</option>
          </select>
        </div>
      </div>

      {/* Chapters & Uploaded Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <div
            key={note.id}
            className="flex flex-col justify-between p-6 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-3xl transition-all shadow-xl group"
          >
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="text-purple-400 font-bold capitalize">
                  Chapter {note.chapterNumber || 1} · {note.subject}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                    note.publishedStatus === 'published'
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/50'
                      : 'bg-amber-950/50 text-amber-300 border border-amber-800/50'
                  }`}
                >
                  {note.publishedStatus.toUpperCase()}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                {note.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{note.summary}</p>

              {/* Uploaded Note Photo Preview */}
              {note.notePhotoUrl ? (
                <div className="mt-3 relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={note.notePhotoUrl}
                    alt={note.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-950/80 rounded text-[10px] font-mono text-cyan-300">
                    Uploaded Note Photo
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-slate-950/50 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs flex items-center justify-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>No note photo attached</span>
                </div>
              )}

              {/* What is taught bullet preview */}
              {note.whatIsTaught && note.whatIsTaught.length > 0 && (
                <div className="mt-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="text-[10px] font-mono text-purple-300 uppercase">
                    What Aero Teaches:
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-0.5">
                    {note.whatIsTaught.slice(0, 2).map((item, i) => (
                      <li key={i} className="truncate">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">{note.gradeLevel}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(note)}
                  className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
                  title="Edit Chapter & Materials"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1.5 text-rose-400 hover:text-rose-300 bg-slate-800 rounded-lg"
                  title="Delete Chapter"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- CHAPTER & NOTE PHOTO UPLOAD MODAL --- */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNote}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  {editingNoteId ? 'Edit Chapter & Materials' : 'Upload Chapter Notes & Materials'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure what Aero teaches and upload notes/photos for students
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Title & Chapter Number */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-slate-300 mb-1">Chapter #</label>
                  <input
                    type="number"
                    min={1}
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-slate-300 mb-1">Chapter Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Kinematics: 2D Projectile Motion & Vector Invariants"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  />
                </div>
              </div>

              {/* Subject & Target Class */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as SubjectType)}
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
                  <label className="block text-slate-300 mb-1">Target Class</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  >
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Publish Status</label>
                  <select
                    value={publishedStatus}
                    onChange={(e) => setPublishedStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  >
                    <option value="published">Published (Aero Teaches This)</option>
                    <option value="draft">Draft (Private to Admin)</option>
                  </select>
                </div>
              </div>

              {/* UPLOAD NOTE PHOTO SECTION */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200">
                      Upload Note Photo / Textbook Diagram
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Upload photos of notes or diagrams. Aero will display this image directly on the whiteboard during lessons.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Photo</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {notePhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-56 bg-slate-900 flex items-center justify-center">
                    <img
                      src={notePhotoUrl}
                      alt="Uploaded note"
                      className="max-h-56 w-auto object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setNotePhotoUrl('')}
                      className="absolute top-2 right-2 p-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded-md text-xs"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center cursor-pointer text-slate-500 hover:text-slate-400 space-y-1.5"
                  >
                    <ImageIcon className="w-6 h-6 mx-auto text-slate-600" />
                    <div className="text-xs font-medium">Click to upload chapter note photo</div>
                    <div className="text-[10px] text-slate-600">Supports PNG, JPG, WebP</div>
                  </div>
                )}
              </div>

              {/* What all is taught in this chapter */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  What All Is Taught (Learning Outcomes Aero Covers)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={whatIsTaughtInput}
                    onChange={(e) => setWhatIsTaughtInput(e.target.value)}
                    placeholder="e.g. Parabolic trajectory angle formulas"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (whatIsTaughtInput.trim()) {
                        setWhatIsTaughtList([...whatIsTaughtList, whatIsTaughtInput.trim()]);
                        setWhatIsTaughtInput('');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
                  >
                    Add
                  </button>
                </div>
                {whatIsTaughtList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {whatIsTaughtList.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-purple-950/60 border border-purple-800/50 rounded-lg text-purple-200 text-[11px] flex items-center gap-1.5"
                      >
                        <span>• {item}</span>
                        <button
                          type="button"
                          onClick={() => setWhatIsTaughtList(whatIsTaughtList.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chapter Summary */}
              <div>
                <label className="block text-slate-300 mb-1">Brief Summary</label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Concise overview of what this chapter explores"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                />
              </div>

              {/* Full Markdown Notes */}
              <div>
                <label className="block text-slate-300 mb-1">
                  Full Written Curriculum Notes & Definitions
                </label>
                <textarea
                  rows={6}
                  required
                  value={contentMarkdown}
                  onChange={(e) => setContentMarkdown(e.target.value)}
                  placeholder="Enter detailed lesson content, proofs, and definitions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                />
              </div>

              {/* Key Formulas */}
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
                        setKeyFormulas([...keyFormulas, formulaInput.trim()]);
                        setFormulaInput('');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
                  >
                    Add
                  </button>
                </div>
                {keyFormulas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keyFormulas.map((f, idx) => (
                      <span
                        key={idx}
                        className="p-1.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-cyan-300 flex items-center gap-1.5"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => setKeyFormulas(keyFormulas.filter((_, i) => i !== idx))}
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

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-950/50">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 rounded-xl cursor-pointer"
              >
                Save & Deploy for Aero
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
