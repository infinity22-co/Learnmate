import React, { useState, useEffect, useRef } from 'react';
import { RobotCharacter } from './RobotCharacter.js';
import { InteractiveWhiteboard } from './InteractiveWhiteboard.js';
import { AttentionMonitor } from '../camera/AttentionMonitor.js';
import { RobotEmotion, WhiteboardData, SubjectType, CurriculumNote, AttentionMetrics } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { soundEffects } from '../../utils/audioEffects.js';
import {
  Mic,
  MicOff,
  Send,
  RefreshCw,
} from 'lucide-react';

import { generateSelfCreatedContent } from '../../utils/contentGenerator.js';

interface RobotTutorViewProps {
  initialSubject?: SubjectType;
  initialNoteId?: string;
  onOpenNoteDetails?: (noteId: string) => void;
}

export const RobotTutorView: React.FC<RobotTutorViewProps> = ({
  initialSubject = 'physics',
  initialNoteId,
  onOpenNoteDetails,
}) => {
  const { token, user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>(initialSubject);
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>(initialNoteId);
  const [adminNotes, setAdminNotes] = useState<CurriculumNote[]>([]);
  const [activeAdminNote, setActiveAdminNote] = useState<CurriculumNote | null>(null);

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [robotEmotion, setRobotEmotion] = useState<RobotEmotion>('greeting');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStudentMicUnmuted, setIsStudentMicUnmuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Spoken text state
  const [spokenExplanation, setSpokenExplanation] = useState<string>(
    "Hello! I am Aero. I self-create notes, interactive vector diagrams, audio narration, and practice questions for whatever question or chapter you ask for! Unmute your microphone or press 'M' anytime."
  );

  // Interactive activity state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [activityStatus, setActivityStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  // Initial self-created content for projectile motion
  const initialContent = generateSelfCreatedContent('2D Projectile Motion & Kinematics', 'physics');

  const [whiteboardData, setWhiteboardData] = useState<WhiteboardData>({
    title: '2D Projectile Trajectory Dynamics',
    diagramType: 'equation',
    selfCreatedNotesMarkdown: initialContent.notesMarkdown,
    selfCreatedDiagramSvg: initialContent.diagramSvg,
    selfCreatedDiagramType: initialContent.diagramType,
    practiceQuestions: initialContent.practiceQuestions,
    audioNarrationScript: initialContent.audioNarrationScript,
    formula: {
      latex: 'R = \\frac{v_0^2 \\sin(2\\theta)}{g}',
      variables: [
        { symbol: 'v_0', label: 'Initial Launch Velocity', value: '25 m/s' },
        { symbol: '\\theta', label: 'Launch Angle', value: '45°' },
        { symbol: 'g', label: 'Gravitational Constant', value: '9.81 m/s²' },
        { symbol: 'R', label: 'Horizontal Range', value: '63.7 m' },
      ],
      interactiveSlider: {
        param: '\\theta',
        label: 'Launch Angle (\\theta)',
        min: 15,
        max: 75,
        default: 45,
        unit: '°',
      },
    },
    steps: [
      { stepNumber: 1, title: 'Velocity Decomposition', description: 'Split vector: v_x = v_0 * cos(θ), v_y = v_0 * sin(θ)' },
      { stepNumber: 2, title: 'Apex Peak Time', description: 'Vertical velocity reaches 0 at t_peak = (v_0 * sin(θ)) / g' },
      { stepNumber: 3, title: 'Total Horizontal Range', description: 'Multiply horizontal speed by total time: R = v_x * (2 * t_peak)' },
    ],
    keyTakeaways: [
      'Horizontal velocity remains invariant throughout flight in a vacuum.',
      'The maximum ground range is achieved at an angle of exactly 45°.',
      'Flight duration depends strictly on vertical launch velocity component.',
    ],
    activity: {
      id: 'act_init_1',
      type: 'concept_check',
      promptQuestion: 'Aero asks: At what launch angle is the horizontal ground range strictly maximized for a projectile on flat terrain?',
      hint: 'Think about when sin(2θ) reaches its maximum value of 1.0! For what angle θ is sin(2θ) = 1?',
      options: [
        { id: 'opt_1', label: '30° — Flatter trajectory preserves forward velocity longer', isCorrect: false },
        { id: 'opt_2', label: '45° — Perfectly balances vertical hang time and horizontal speed', isCorrect: true },
        { id: 'opt_3', label: '60° — High angle provides superior hang time in the air', isCorrect: false },
        { id: 'opt_4', label: '90° — Launching straight up gives maximum height', isCorrect: false },
      ],
    },
  });

  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Keyboard shortcut listener: Press "M" to toggle student mic accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleStudentMic();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudentMicUnmuted]);

  // Fetch admin notes for selected subject & class
  useEffect(() => {
    fetchAdminNotes();
  }, [selectedSubject, token]);

  const fetchAdminNotes = async () => {
    try {
      const url = `/api/curriculum?subject=${selectedSubject}${
        user?.classGrade ? `&classGrade=${encodeURIComponent(user.classGrade)}` : ''
      }`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      const notes: CurriculumNote[] = data.notes || [];
      setAdminNotes(notes);

      if (notes.length > 0) {
        const note = currentNoteId ? notes.find((n) => n.id === currentNoteId) || notes[0] : notes[0];
        setActiveAdminNote(note);
        setCurrentNoteId(note.id);
        if (note.notePhotoUrl) {
          setWhiteboardData((prev) => ({ ...prev, notePhotoUrl: note.notePhotoUrl }));
        }
      } else {
        setActiveAdminNote(null);
      }
    } catch (err) {
      console.error('Failed to load admin notes:', err);
    }
  };

  const ensureAudioUnlocked = () => {
    soundEffects.unlockAudio();
    setHasInteracted(true);
  };

  // Speak text using Web Speech API or Server Audio
  const speakText = async (text: string) => {
    ensureAudioUnlocked();
    if (!audioEnabled) {
      setIsSpeaking(false);
      return;
    }

    stopSpeaking();

    if (token) {
      try {
        const res = await fetch('/api/tutor/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const audioBlob = new Blob(
              [Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0))],
              { type: 'audio/wav' }
            );
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            activeAudioElementRef.current = audio;

            audio.onplay = () => {
              setIsSpeaking(true);
              soundEffects.playWakePing();
            };
            audio.onended = () => {
              setIsSpeaking(false);
              setRobotEmotion('idle');
            };
            audio.onerror = () => {
              fallbackBrowserTTS(text);
            };

            await audio.play();
            return;
          }
        }
      } catch {
        // Fallback to browser
      }
    }

    fallbackBrowserTTS(text);
  };

  const fallbackBrowserTTS = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[$*#_`]/g, ' ').slice(0, 320);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          v.name.includes('Google') ||
          v.name.includes('Natural') ||
          (v.lang.startsWith('en') && !v.name.includes('Zira'))
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        soundEffects.playWakePing();
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setRobotEmotion('idle');
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Student Mic Mute / Unmute handler
  const toggleStudentMic = () => {
    ensureAudioUnlocked();

    if (isStudentMicUnmuted) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {}
      }
      setIsStudentMicUnmuted(false);
      setRobotEmotion('idle');
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        soundEffects.playThinkingTone();
        setIsStudentMicUnmuted(true);
        setRobotEmotion('listening');
      };

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          setLiveTranscript(transcript);
          setPrompt(transcript);

          // Check if the student's verbal response answers the active interactive activity
          const curActivity = whiteboardData.activity;
          if (curActivity?.options && curActivity.options.length > 0) {
            const lower = transcript.toLowerCase();
            const matchedOption = curActivity.options.find((opt, idx) => {
              const letter = String.fromCharCode(65 + idx).toLowerCase();
              const coreWords = opt.label.toLowerCase().split(/[—\-:]/)[0].trim();
              return (
                lower === letter ||
                lower.includes(`option ${letter}`) ||
                lower.includes(`choice ${letter}`) ||
                (coreWords.length > 2 && lower.includes(coreWords)) ||
                (opt.label.includes('45') && (lower.includes('45') || lower.includes('forty-five') || lower.includes('forty five'))) ||
                (opt.label.includes('independent') && lower.includes('independent')) ||
                (opt.label.includes('double root') && (lower.includes('double root') || lower.includes('one real')))
              );
            });

            if (matchedOption) {
              setSelectedOptionId(matchedOption.id);
              setActivityStatus(matchedOption.isCorrect ? 'correct' : 'incorrect');
              if (matchedOption.isCorrect) {
                setRobotEmotion('celebrating');
                soundEffects.playCelebration();
                const praise = `Brilliant! You spoke your answer: "${transcript}". That is 100% correct! Excellent scientific reasoning.`;
                setSpokenExplanation(praise);
                speakText(praise);
              } else {
                setRobotEmotion('encouraging');
                const retry = `Good effort answering verbally: "${transcript}", but that's not quite right. Take a look at the hint or formula and try again!`;
                setSpokenExplanation(retry);
                speakText(retry);
              }
              return;
            }
          }

          // Otherwise, it's a student inquiry or question for Aero
          submitQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsStudentMicUnmuted(false);
        setRobotEmotion('idle');
      };

      recognition.onend = () => {
        if (isStudentMicUnmuted) {
          try {
            recognition.start();
          } catch {}
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsStudentMicUnmuted(false);
    }
  };

  const handleWhiteboardAnswerSelected = (optionId: string, isCorrect: boolean, label: string) => {
    setSelectedOptionId(optionId);
    setActivityStatus(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      setRobotEmotion('celebrating');
      soundEffects.playCelebration();
      const praise = `Spot on! "${label}" is the correct answer. Aero verified your deduction!`;
      setSpokenExplanation(praise);
      speakText(praise);
    } else {
      setRobotEmotion('encouraging');
      const retry = `Good attempt! "${label}" is not quite right. Check Aero's hint on the board and try another choice!`;
      setSpokenExplanation(retry);
      speakText(retry);
    }
  };

  // Submit query grounded in current active admin note
  const submitQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || isLoading) return;

    ensureAudioUnlocked();
    stopSpeaking();
    setIsLoading(true);
    setRobotEmotion('thinking');
    soundEffects.playThinkingTone();

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          prompt: q,
          subject: selectedSubject,
          currentNoteId: activeAdminNote?.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to get answer from tutor service');

      const data = await res.json();
      setSpokenExplanation(data.robotResponseText);
      setRobotEmotion(data.robotEmotion || 'explaining');
      if (data.whiteboard) {
        // If active admin note has a photo, ensure it's rendered on board
        if (activeAdminNote?.notePhotoUrl) {
          data.whiteboard.notePhotoUrl = activeAdminNote.notePhotoUrl;
        }
        setWhiteboardData(data.whiteboard);
        setSelectedOptionId(null);
        setActivityStatus('unanswered');
        setLiveTranscript('');
      }

      setPrompt('');
      if (audioEnabled) {
        speakText(data.robotResponseText);
      }
    } catch (err: any) {
      console.error('Tutor query error:', err);
      setRobotEmotion('idle');
      setSpokenExplanation(
        "I am ready! Feel free to ask any question or answer based on the admin's chapter note displayed on your right."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistractionDetected = () => {
    if (!isSpeaking) {
      setRobotEmotion('curious');
      const reminder = "I notice you might be looking away. Let's refocus our attention on this chapter note!";
      setSpokenExplanation(reminder);
      if (audioEnabled) speakText(reminder);
    }
  };

  const subjects: { id: SubjectType; label: string }[] = [
    { id: 'physics', label: 'Physics' },
    { id: 'mathematics', label: 'Mathematics' },
    { id: 'biology', label: 'Biology' },
    { id: 'chemistry', label: 'Chemistry' },
    { id: 'computer_science', label: 'Computer Science' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-2">
      {/* CHAPTER SELECTOR BAR (Option to select among available chapters provided by Admin) */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
              Select Available Chapter ({selectedSubject.toUpperCase()}):
            </span>
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl overflow-x-auto">
            {subjects.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubject(sub.id);
                  setCurrentNoteId(undefined);
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  selectedSubject === sub.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chapters list buttons */}
        {adminNotes.length === 0 ? (
          <div className="py-2 text-center text-xs text-slate-500">
            No published chapters provided by admin for this subject yet.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {adminNotes.map((note) => {
              const isSelected = activeAdminNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  onClick={() => {
                    setActiveAdminNote(note);
                    setCurrentNoteId(note.id);
                    setSelectedOptionId(null);
                    setActivityStatus('unanswered');
                    setLiveTranscript('');
                    if (note.notePhotoUrl) {
                      setWhiteboardData((prev) => ({ ...prev, notePhotoUrl: note.notePhotoUrl }));
                    }
                    submitQuery(`Teach me about ${note.title}`);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>Ch {note.chapterNumber || 1}:</span>
                  <span className="truncate max-w-[220px] font-sans font-medium">{note.title}</span>
                  {note.notePhotoUrl && <span className="text-[10px] text-slate-400">(diagram)</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* AI SELF-CREATE ANY TOPIC OR QUESTION QUICK-CHIPS */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono text-[11px] text-cyan-400 font-bold shrink-0">
            AI Self-Create ANY Topic:
          </span>
          {[
            { label: 'Projectile Motion', query: '2D Projectile Motion & Kinematics' },
            { label: 'Quadratic Functions', query: 'Quadratic Functions & Discriminants' },
            { label: 'Cellular Respiration', query: 'Cellular Respiration & ATP Synthesis' },
            { label: 'Quantum Tunneling', query: 'Quantum Tunneling & Wavefunctions' },
            { label: 'Chemical Equilibrium', query: 'Chemical Equilibrium & Le Chatelier' },
            { label: 'Newton\'s Laws', query: 'Newton\'s Laws & Momentum Conservation' },
            { label: 'Special Relativity', query: 'Special Relativity & Time Dilation' },
          ].map((topic, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveAdminNote(null);
                setCurrentNoteId(undefined);
                setSelectedOptionId(null);
                setActivityStatus('unanswered');
                setLiveTranscript('');
                submitQuery(topic.query);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer font-sans text-[11px]"
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Student Portal Split Stage: JUST Robot & Cam + Teaching Whiteboard & Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (4 cols): JUST Robot (Eye + Mouth) + Student Camera + Accessible Mic */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              AERO VISOR
            </span>
            <span className="text-xs font-mono text-slate-400 capitalize">
              {isSpeaking ? 'Talking...' : isStudentMicUnmuted ? 'Listening to You...' : 'Active'}
            </span>
          </div>

          {/* Minimal Robot: JUST Eye & Mouth Screen with Mic Symbol directly below face */}
          <div className="flex flex-col items-center justify-center py-2">
            <RobotCharacter
              emotion={robotEmotion}
              isSpeaking={isSpeaking}
              isListening={isStudentMicUnmuted}
              size="lg"
              showMicButton={true}
              isMicUnmuted={isStudentMicUnmuted}
              onToggleMic={toggleStudentMic}
              onTap={() => {
                setRobotEmotion('celebrating');
                soundEffects.playCelebration();
                speakText("I'm listening! Click the mic symbol right below my face or press M to speak.");
              }}
            />
            <div className="text-center text-[10px] text-slate-500 font-mono mt-1">
              Keyboard shortcut: Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">M</kbd> to toggle mic
            </div>
          </div>

          {/* Spoken Dialogue Text Bubble */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl relative">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-300 mb-1">
              <span>Aero Explains:</span>
              <button
                onClick={() => speakText(spokenExplanation)}
                className="text-[10px] text-slate-400 hover:text-cyan-300"
              >
                Replay Audio
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed max-h-32 overflow-y-auto">
              {spokenExplanation}
            </p>
          </div>

          {/* Real Camera Attendance & Engagement Monitor */}
          <AttentionMonitor onDistractionDetected={handleDistractionDetected} />
        </div>

        {/* Center/Right Column (8 cols): Interactive Whiteboard & Admin Materials */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Active Admin Chapter Material Banner */}
          {activeAdminNote && (
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold">
                  Admin Curriculum Chapter {activeAdminNote.chapterNumber || 1}
                </span>
                <h3 className="text-base font-bold text-slate-100">{activeAdminNote.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{activeAdminNote.summary}</p>
              </div>

              {activeAdminNote.whatIsTaught && activeAdminNote.whatIsTaught.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-md">
                  {activeAdminNote.whatIsTaught.map((item, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-purple-950/50 border border-purple-800/50 rounded-md text-[10px] font-mono text-purple-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Interactive Whiteboard (Displays interactive activities with mute/unmute, equations, dynamic sliders, and Admin's note photo!) */}
          <div className="flex-1 min-h-[500px]">
            <InteractiveWhiteboard
              data={whiteboardData}
              groundedNoteTitle={activeAdminNote?.title}
              onOpenGroundedNote={() => {
                if (onOpenNoteDetails && activeAdminNote) {
                  onOpenNoteDetails(activeAdminNote.id);
                }
              }}
              isStudentMicUnmuted={isStudentMicUnmuted}
              onToggleStudentMic={toggleStudentMic}
              onAnswerSelected={handleWhiteboardAnswerSelected}
              selectedOptionId={selectedOptionId}
              activityStatus={activityStatus}
              liveTranscript={liveTranscript}
              onSpeakNarration={speakText}
            />
          </div>
        </div>
      </div>

      {/* Accessible Input Deck (Type or Voice) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery(prompt);
        }}
        className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"
      >
        <button
          type="button"
          onClick={toggleStudentMic}
          className={`p-3 rounded-xl transition-all cursor-pointer ${
            isStudentMicUnmuted
              ? 'bg-emerald-400 text-slate-950 animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={isStudentMicUnmuted ? 'Mute Mic' : 'Unmute Mic'}
        >
          {isStudentMicUnmuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            isStudentMicUnmuted
              ? 'Mic is unmuted! Speak now to ask or answer Aero...'
              : `Type a question or unmute mic to answer Aero on ${activeAdminNote?.title || selectedSubject}...`
          }
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-cyan-950"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Send Answer / Question</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
