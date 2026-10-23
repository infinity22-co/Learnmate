import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole, AuthRequest, getUserIdFromToken } from '../auth.js';
import { CurriculumNote } from '../../src/types/index.js';

export const curriculumRouter = Router();

// Helper to determine requesting user role from optional token
function getOptionalRole(authHeader?: string): 'admin' | 'student' {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return 'student';
  const token = authHeader.substring(7);
  const userId = getUserIdFromToken(token);
  if (!userId) return 'student';
  const user = db.getUserById(userId);
  return user?.role === 'admin' ? 'admin' : 'student';
}

// List curriculum notes / chapters
curriculumRouter.get('/', (req, res: Response) => {
  const role = getOptionalRole(req.headers.authorization);
  const subject = req.query.subject as string | undefined;
  const classGrade = req.query.classGrade as string | undefined;

  let notes = db.getNotes(role, subject);
  if (classGrade && classGrade !== 'all' && role === 'student') {
    notes = notes.filter(n => n.gradeLevel === classGrade || n.gradeLevel === 'All Classes');
  }
  res.json({ notes });
});

// Get single note by id
curriculumRouter.get('/:id', (req, res: Response) => {
  const role = getOptionalRole(req.headers.authorization);
  const note = db.getNoteById(req.params.id, role);
  if (!note) {
    res.status(404).json({ error: 'Curriculum note not found or access restricted' });
    return;
  }
  res.json({ note });
});

// Create chapter note with photo upload (Admin only)
curriculumRouter.post('/', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const {
    title,
    subject,
    chapterNumber,
    gradeLevel,
    summary,
    contentMarkdown,
    notePhotoUrl,
    whatIsTaught,
    keyFormulas,
    visualKeywords,
    publishedStatus,
  } = req.body;

  if (!title || !subject || !contentMarkdown) {
    res.status(400).json({ error: 'Title, subject, and markdown content are required' });
    return;
  }

  const newNote: CurriculumNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    subject,
    chapterNumber: chapterNumber ? Number(chapterNumber) : 1,
    gradeLevel: gradeLevel || 'Grade 11',
    summary: summary || title.trim(),
    contentMarkdown,
    notePhotoUrl: notePhotoUrl || undefined,
    whatIsTaught: Array.isArray(whatIsTaught) ? whatIsTaught : [],
    keyFormulas: Array.isArray(keyFormulas) ? keyFormulas : [],
    visualKeywords: Array.isArray(visualKeywords) ? visualKeywords : [],
    publishedStatus: publishedStatus === 'published' ? 'published' : 'draft',
    authorName: req.user!.name,
    authorId: req.user!.id,
    updatedAt: new Date().toISOString(),
    readTimeMinutes: Math.max(2, Math.ceil(contentMarkdown.split(/\s+/).length / 180)),
  };

  const created = db.createNote(newNote);
  res.status(201).json({ note: created });
});

// Update chapter note & photo (Admin only)
curriculumRouter.put('/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const updated = db.updateNote(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json({ note: updated });
});

// Delete note (Admin only)
curriculumRouter.delete('/:id', requireAuth, requireRole('admin'), (req: AuthRequest, res: Response) => {
  const success = db.deleteNote(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json({ success: true, message: 'Curriculum note removed' });
});

// Toggle student bookmark
curriculumRouter.post('/:id/bookmark', requireAuth, (req: AuthRequest, res: Response) => {
  const isBookmarked = db.toggleBookmark(req.user!.id, req.params.id);
  res.json({ isBookmarked });
});

// Get current student's bookmarks
curriculumRouter.get('/bookmarks/my', requireAuth, (req: AuthRequest, res: Response) => {
  const bookmarkedIds = db.getStudentBookmarks(req.user!.id);
  res.json({ bookmarkedIds });
});
