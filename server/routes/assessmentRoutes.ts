import { Router, Response } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole, AuthRequest } from '../auth.js';
import { AssessmentResult } from '../../src/types/index.js';

export const assessmentRouter = Router();

// List assessments
assessmentRouter.get('/', (_req, res: Response) => {
  const list = db.getAssessments().map(a => ({
    id: a.id,
    title: a.title,
    category: a.category,
    difficulty: a.difficulty,
    timeLimitObservationSec: a.timeLimitObservationSec,
    timeLimitRecallSec: a.timeLimitRecallSec,
    totalPoints: a.totalPoints,
    questionCount: a.questions.length,
    stimulusPrompt: a.stimulus.promptInstruction,
  }));
  res.json({ assessments: list });
});

// Get full assessment data for testing session
assessmentRouter.get('/:id', (req, res: Response) => {
  const assessment = db.getAssessmentById(req.params.id);
  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found' });
    return;
  }

  // Sanitize: hide correctOptionId and explanation before student solves it
  const sanitizedQuestions = assessment.questions.map(q => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    domain: q.domain,
  }));

  res.json({
    assessment: {
      ...assessment,
      questions: sanitizedQuestions,
    },
  });
});

// Submit answers for deterministic server-side evaluation & recording
assessmentRouter.post('/:id/submit', requireAuth, (req: AuthRequest, res: Response) => {
  const assessment = db.getAssessmentById(req.params.id);
  if (!assessment) {
    res.status(404).json({ error: 'Assessment not found' });
    return;
  }

  const { answers, observationTimeSpentSec = 0, recallTimeSpentSec = 0 } = req.body;
  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: 'Answers array is required' });
    return;
  }

  let correctCount = 0;
  const verifiedAnswers = assessment.questions.map(q => {
    const studentAnswer = answers.find((a: any) => a.questionId === q.id);
    const selectedOptionId = studentAnswer?.selectedOptionId || '';
    const isCorrect = selectedOptionId === q.correctOptionId;
    if (isCorrect) correctCount++;

    return {
      questionId: q.id,
      selectedOptionId,
      correctOptionId: q.correctOptionId,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const totalQuestions = assessment.questions.length;
  const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);
  const score = Math.round((correctCount / totalQuestions) * assessment.totalPoints);

  // Compute cognitive domain ratings
  const cognitiveBreakdown = {
    spatialReasoning: Math.min(100, Math.round(accuracyPercent * 0.95 + (observationTimeSpentSec < assessment.timeLimitObservationSec ? 5 : 0))),
    workingMemory: Math.min(100, Math.round(accuracyPercent * 0.9 + (recallTimeSpentSec < 15 ? 10 : 0))),
    patternAnalysis: Math.min(100, Math.round(accuracyPercent * 0.92 + 8)),
  };

  const feedback =
    accuracyPercent === 100
      ? 'Perfect score! Exceptional perceptual accuracy and rapid pattern decoding under timed conditions.'
      : accuracyPercent >= 70
      ? 'Strong visual cognitive performance. Review the solution breakdowns below to sharpen rotational deduction.'
      : 'Good baseline effort. Focus on systematic grid scanning before the timer elapses.';

  const resultRecord: AssessmentResult = {
    id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    studentId: req.user!.id,
    studentName: req.user!.name,
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    category: assessment.category,
    score,
    maxScore: assessment.totalPoints,
    accuracyPercent,
    observationTimeSpentSec: Number(observationTimeSpentSec),
    recallTimeSpentSec: Number(recallTimeSpentSec),
    answers: verifiedAnswers.map(v => ({
      questionId: v.questionId,
      selectedOptionId: v.selectedOptionId,
      isCorrect: v.isCorrect,
    })),
    cognitiveBreakdown,
    feedback,
    completedAt: new Date().toISOString(),
  };

  db.saveAssessmentResult(resultRecord);

  res.json({
    result: resultRecord,
    verifiedBreakdown: verifiedAnswers,
  });
});

// Student's personal history & analytics
assessmentRouter.get('/analytics/my', requireAuth, (req: AuthRequest, res: Response) => {
  const history = db.getStudentResults(req.user!.id);
  const totalCompleted = history.length;
  const avgScore = totalCompleted > 0
    ? Math.round(history.reduce((acc, r) => acc + r.accuracyPercent, 0) / totalCompleted)
    : 0;

  res.json({
    history,
    summary: {
      totalCompleted,
      avgScore,
      bestScore: history.reduce((max, r) => Math.max(max, r.accuracyPercent), 0),
      avgRecallTime: totalCompleted > 0
        ? Number((history.reduce((acc, r) => acc + r.recallTimeSpentSec, 0) / totalCompleted).toFixed(1))
        : 0,
    },
  });
});

// Admin overview of all class completions
assessmentRouter.get('/analytics/admin', requireAuth, requireRole('admin'), (_req: AuthRequest, res: Response) => {
  const allResults = db.getAllResultsForAdmin();
  res.json({ results: allResults });
});
