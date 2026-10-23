import { Router, Response } from 'express';
import { askAITutor, generateSpeechAudio } from '../aiService.js';
import { requireAuth, AuthRequest } from '../auth.js';

export const tutorRouter = Router();

// Interact with the interactive Robot Tutor ("Aero")
tutorRouter.post('/chat', requireAuth, async (req: AuthRequest, res: Response) => {
  const { prompt, subject = 'physics', currentNoteId } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  try {
    const tutorResponse = await askAITutor(prompt.trim(), subject, currentNoteId);
    res.json(tutorResponse);
  } catch (err: any) {
    console.error('Error in tutor chat route:', err);
    res.status(500).json({ error: 'Failed to process AI tutoring query', details: err?.message });
  }
});

// Real-time Neural Speech generation endpoint
tutorRouter.post('/speech', requireAuth, async (req: AuthRequest, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text string is required for speech synthesis' });
    return;
  }

  try {
    const audioBase64 = await generateSpeechAudio(text);
    res.json({ audioBase64 });
  } catch (err: any) {
    console.error('Speech route error:', err);
    res.status(500).json({ error: 'Failed to synthesize speech', details: err?.message });
  }
});
