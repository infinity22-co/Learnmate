import { Router, Response } from 'express';
import { db } from '../db.js';
import { createSessionToken, verifyPassword, hashPassword, requireAuth, AuthRequest } from '../auth.js';

export const authRouter = Router();

// Login (handles both username "admin" and email addresses)
authRouter.post('/login', (req, res: Response) => {
  const { email, username, password } = req.body;
  const identifier = (email || username || '').trim();

  if (!identifier || !password) {
    res.status(400).json({ error: 'Username/Email and password are required' });
    return;
  }

  const userWithPassword = db.getUserByEmailWithPassword(identifier);
  if (!userWithPassword) {
    res.status(401).json({ error: 'Invalid username/email or password' });
    return;
  }

  const isValid = verifyPassword(password, userWithPassword.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid username/email or password' });
    return;
  }

  const token = createSessionToken(userWithPassword.id);
  const { passwordHash: _, ...safeUser } = userWithPassword;

  res.json({
    token,
    user: safeUser,
  });
});

// Student Registration with Name, Class, Stream
authRouter.post('/register', (req, res: Response) => {
  const { name, email, password, classGrade, stream } = req.body;
  if (!name || !email || !password || !classGrade || !stream) {
    res.status(400).json({ error: 'Name, Class, Stream, Email, and Password are all required' });
    return;
  }

  if (password.length < 4) {
    res.status(400).json({ error: 'Password must be at least 4 characters' });
    return;
  }

  const existing = db.getUserByEmailWithPassword(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists' });
    return;
  }

  const newUser = {
    id: `usr_student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'student' as const,
    classGrade: classGrade.trim(),
    stream: stream.trim(),
    onboardingExamCompleted: false, // Must take visual analysis exam before onboarding
    onboardingScore: 0,
    createdAt: new Date().toISOString(),
  };

  const passwordHash = hashPassword(password);
  db.createUser(newUser as any, passwordHash);

  const token = createSessionToken(newUser.id);
  res.status(201).json({
    token,
    user: newUser,
  });
});

// Complete onboarding exam
authRouter.post('/complete-onboarding', requireAuth, (req: AuthRequest, res: Response) => {
  const { score = 100 } = req.body;
  db.completeOnboardingExam(req.user!.id, Number(score));
  const updatedUser = db.getUserById(req.user!.id);
  res.json({ success: true, user: updatedUser });
});

// Demo switch
authRouter.post('/switch-demo', (req, res: Response) => {
  const { targetRole } = req.body;
  const targetIdentifier = targetRole === 'admin' ? 'admin' : 'alex@student.edu';
  
  const user = db.getUserByEmailWithPassword(targetIdentifier);
  if (!user) {
    res.status(404).json({ error: 'Demo account not found' });
    return;
  }

  const token = createSessionToken(user.id);
  const { passwordHash: _, ...safeUser } = user;

  res.json({
    token,
    user: safeUser,
  });
});

// Current user profile
authRouter.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});
