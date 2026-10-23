import { GoogleGenAI, Type } from '@google/genai';
import { db } from './db.js';
import { RobotEmotion, WhiteboardData } from '../src/types/index.js';
import { generateSelfCreatedContent } from '../src/utils/contentGenerator.js';

// Server-side initialization per @google/genai guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export interface TutorResponsePayload {
  robotResponseText: string;
  robotEmotion: RobotEmotion;
  whiteboard: WhiteboardData;
  suggestedFollowUps: string[];
  groundedNoteTitle?: string;
  audioBase64?: string;
}

export async function askAITutor(
  prompt: string,
  subject: string,
  currentNoteId?: string
): Promise<TutorResponsePayload> {
  // 1. Retrieve grounded educational material from the database
  let groundedNote = currentNoteId ? db.getNoteById(currentNoteId, 'student') : undefined;
  if (!groundedNote) {
    const searchResults = db.searchGroundedNotes(prompt, subject);
    if (searchResults.length > 0) {
      groundedNote = searchResults[0];
    }
  }

  const groundedContext = groundedNote
    ? `AUTHORITATIVE CURRICULUM NOTE TITLE: "${groundedNote.title}"
SUBJECT: ${groundedNote.subject}
SUMMARY: ${groundedNote.summary}
KEY FORMULAS: ${groundedNote.keyFormulas.join(', ')}
DETAILED CONTENT:
${groundedNote.contentMarkdown}`
    : `SUBJECT: ${subject || 'general STEM'}`;

  // If Gemini API is available, generate structured response
  if (ai && apiKey) {
    try {
      const systemInstruction = `You are "Aero", the signature interactive robot tutor for LearnMate AI.
You are warm, brilliant, encouraging, and visually minded.
You guide high school and collegiate students with step-by-step clarity.

ALWAYS base your teaching on the grounded educational material provided below whenever relevant.

GROUNDED MATERIAL:
${groundedContext}

You MUST return a JSON response matching the required schema with:
1. robotResponseText: 2-4 friendly, concise, highly pedagogical paragraphs. Use natural phrasing suitable for text-to-speech.
2. robotEmotion: one of ["greeting", "thinking", "speaking", "explaining", "celebrating", "curious", "encouraging"].
3. whiteboard: visual board demonstration with title, diagramType ("equation" | "step_flow" | "comparison" | "interactive_model" | "key_takeaways"), formula (latex + variables with definitions, and optional interactive slider param), step-by-step breakdown items, or key takeaways.
4. suggestedFollowUps: exactly 3 sharp, provocative follow-up questions for the student to continue mastering the topic.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              robotResponseText: {
                type: Type.STRING,
                description: 'The verbal explanation provided by the robot tutor.',
              },
              robotEmotion: {
                type: Type.STRING,
                description: 'The facial and body emotion of the robot.',
              },
              whiteboard: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  diagramType: { type: Type.STRING },
                  steps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepNumber: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                      },
                    },
                  },
                  formula: {
                    type: Type.OBJECT,
                    properties: {
                      latex: { type: Type.STRING },
                      variables: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            symbol: { type: Type.STRING },
                            label: { type: Type.STRING },
                            value: { type: Type.STRING },
                          },
                        },
                      },
                      interactiveSlider: {
                        type: Type.OBJECT,
                        properties: {
                          param: { type: Type.STRING },
                          label: { type: Type.STRING },
                          min: { type: Type.NUMBER },
                          max: { type: Type.NUMBER },
                          default: { type: Type.NUMBER },
                          unit: { type: Type.STRING },
                        },
                      },
                    },
                  },
                  comparisonData: {
                    type: Type.OBJECT,
                    properties: {
                      headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                      rows: {
                        type: Type.ARRAY,
                        items: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                    },
                  },
                  keyTakeaways: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  activity: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: { type: Type.STRING, description: 'One of verbal_prompt, simulation_challenge, concept_check' },
                      promptQuestion: { type: Type.STRING, description: 'Direct question or challenge posed by Aero for the student' },
                      hint: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            isCorrect: { type: Type.BOOLEAN },
                          },
                        },
                      },
                    },
                  },
                },
                required: ['title', 'diagramType'],
              },
              suggestedFollowUps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['robotResponseText', 'robotEmotion', 'whiteboard', 'suggestedFollowUps'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const robotText = parsed.robotResponseText || 'Here is the breakdown of this concept.';

      const wb = parsed.whiteboard || {
        title: 'Concept Breakdown',
        diagramType: 'key_takeaways',
        keyTakeaways: ['Review core principles', 'Identify key parameters'],
      };
      // Self-create notes, diagram SVG, and practice questions for whatever is asked
      const generated = generateSelfCreatedContent(groundedNote?.title || prompt, subject);
      wb.selfCreatedNotesMarkdown = wb.selfCreatedNotesMarkdown || generated.notesMarkdown;
      wb.selfCreatedDiagramSvg = wb.selfCreatedDiagramSvg || generated.diagramSvg;
      wb.selfCreatedDiagramType = wb.selfCreatedDiagramType || generated.diagramType;
      wb.practiceQuestions = wb.practiceQuestions || generated.practiceQuestions;
      wb.audioNarrationScript = wb.audioNarrationScript || generated.audioNarrationScript;

      // Ensure an interactive activity exists
      if (!wb.activity) {
        wb.activity = {
          id: 'act_gen_' + Date.now(),
          type: 'concept_check',
          promptQuestion: `Aero asks: Based on what we discussed in ${groundedNote?.title || prompt}, what is the most critical takeaway?`,
          hint: 'Think about the core governing law or formula we just broke down.',
          options: [
            { id: 'opt_1', label: 'The fundamental variables remain mathematically consistent under boundary conditions', isCorrect: true },
            { id: 'opt_2', label: 'Only experimental guess-and-check works here', isCorrect: false },
            { id: 'opt_3', label: 'The principle only holds at zero temperature', isCorrect: false },
          ],
        };
      }

      return {
        robotResponseText: robotText,
        robotEmotion: (parsed.robotEmotion as RobotEmotion) || 'explaining',
        whiteboard: wb,
        suggestedFollowUps: parsed.suggestedFollowUps || [
          'Can we try a practice example?',
          'How does this apply in real life?',
          'What happens if we change the initial variables?',
        ],
        groundedNoteTitle: groundedNote?.title,
      };
    } catch (err) {
      console.error('Gemini API call failed, falling back to deterministic teaching model:', err);
    }
  }

  // Deterministic pedagogical fallback grounded in our curriculum database
  return generateDeterministicTutorResponse(prompt, subject, groundedNote);
}

// Generate high quality spoken audio via gemini-3.8-flash-lite-tts
export async function generateSpeechAudio(text: string): Promise<string | null> {
  if (!ai || !apiKey) return null;
  try {
    const cleanText = text.replace(/[$*#_`]/g, ' ').slice(0, 300);
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Friendly, encouraging, clear robotic AI mentor',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64 || null;
  } catch (err) {
    console.warn('Gemini TTS endpoint non-blocking error:', err);
    return null;
  }
}

function generateDeterministicTutorResponse(
  prompt: string,
  subject: string,
  note?: ReturnType<typeof db.getNoteById>
): TutorResponsePayload {
  const p = prompt.toLowerCase();
  const generated = generateSelfCreatedContent(note?.title || prompt, subject);

  if (p.includes('projectile') || p.includes('kinematics') || p.includes('parabola') || subject === 'physics') {
    return {
      robotResponseText:
        "Let's break down 2D projectile motion! The core principle discovered by Galileo is that horizontal and vertical motions are completely independent. Horizontally, there is zero acceleration so velocity remains constant. Vertically, Earth's gravity accelerates the object downwards at 9.81 m/s². I have self-created complete notes, a vector diagram, auditory narration, and practice questions for you on your board!",
      robotEmotion: 'explaining',
      whiteboard: {
        title: '2D Projectile Trajectory Dynamics',
        diagramType: 'equation',
        selfCreatedNotesMarkdown: generated.notesMarkdown,
        selfCreatedDiagramSvg: generated.diagramSvg,
        selfCreatedDiagramType: generated.diagramType,
        practiceQuestions: generated.practiceQuestions,
        audioNarrationScript: generated.audioNarrationScript,
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
          'Horizontal velocity remains invariant throughout flight.',
          'The maximum ground range is achieved at an angle of exactly 45° in vacuum.',
          'Flight duration depends strictly on vertical launch velocity component.',
        ],
        activity: {
          id: 'act_proj_1',
          type: 'concept_check',
          promptQuestion: 'Aero asks: At what launch angle is the horizontal ground range strictly maximized for a projectile launched on flat terrain?',
          hint: 'Think about when sin(2θ) reaches its maximum mathematical value of 1.0! At what 2θ is sin(2θ) = 1?',
          options: [
            { id: 'opt_1', label: '30° — Flatter trajectory preserves forward velocity longer', isCorrect: false },
            { id: 'opt_2', label: '45° — Perfectly balances vertical hang time and horizontal speed', isCorrect: true },
            { id: 'opt_3', label: '60° — High angle provides superior hang time in the air', isCorrect: false },
            { id: 'opt_4', label: '90° — Launching straight up gives maximum height', isCorrect: false },
          ],
        },
      },
      suggestedFollowUps: [
        'How does air resistance deform the trajectory shape?',
        'Why does a 30° launch achieve the exact same range as a 60° launch?',
        'What happens if the projectile lands higher than launch height?',
      ],
      groundedNoteTitle: note?.title || 'Kinematics: 2D Projectile Motion & Vector Decomposition',
    };
  }

  if (p.includes('quadratic') || p.includes('discriminant') || subject === 'mathematics') {
    return {
      robotResponseText:
        "Let's explore quadratic functions! The discriminant Δ = b² - 4ac tells us everything about the roots before we even solve the equation. When Δ is positive, the parabola slices through the x-axis at two distinct points. When Δ is zero, it kisses the axis at a single vertex. I have self-created reading notes, a parabola diagram, auditory audio, and practice questions below!",
      robotEmotion: 'thinking',
      whiteboard: {
        title: 'Quadratic Discriminant Invariants',
        diagramType: 'equation',
        selfCreatedNotesMarkdown: generated.notesMarkdown,
        selfCreatedDiagramSvg: generated.diagramSvg,
        selfCreatedDiagramType: generated.diagramType,
        practiceQuestions: generated.practiceQuestions,
        audioNarrationScript: generated.audioNarrationScript,
        formula: {
          latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
          variables: [
            { symbol: 'a', label: 'Quadratic Curvature Coefficient', value: '1' },
            { symbol: 'b', label: 'Linear Slope Coefficient', value: '-4' },
            { symbol: 'c', label: 'Constant Y-Intercept', value: '3' },
            { symbol: '\\Delta', label: 'Discriminant (b² - 4ac)', value: '4' },
          ],
          interactiveSlider: {
            param: 'c',
            label: 'Vertical Shift (c)',
            min: -5,
            max: 10,
            default: 3,
            unit: '',
          },
        },
        steps: [
          { stepNumber: 1, title: 'Calculate Discriminant', description: 'Evaluate Δ = b² - 4ac to check root topology' },
          { stepNumber: 2, title: 'Locate Axis of Symmetry', description: 'The vertex x-coordinate is always x = -b / (2a)' },
          { stepNumber: 3, title: 'Compute Symmetrical Roots', description: 'Add and subtract √(Δ) / (2a) from the central axis' },
        ],
        keyTakeaways: [
          'Δ > 0: Two real distinct roots',
          'Δ = 0: Single double root at vertex',
          'Δ < 0: Complex conjugate root pair',
        ],
        activity: {
          id: 'act_quad_1',
          type: 'concept_check',
          promptQuestion: 'Aero asks: If the discriminant Δ = b² - 4ac is exactly equal to 0, what does this tell us about the roots?',
          hint: 'Remember the quadratic formula has ±√(Δ). If Δ is 0, adding or subtracting 0 yields the same value!',
          options: [
            { id: 'opt_1', label: 'Two distinct real roots crossing the x-axis', isCorrect: false },
            { id: 'opt_2', label: 'Exactly one real double root; the parabola touches the x-axis at its vertex', isCorrect: true },
            { id: 'opt_3', label: 'Two complex conjugate roots with non-zero imaginary parts', isCorrect: false },
            { id: 'opt_4', label: 'No solutions can exist mathematically', isCorrect: false },
          ],
        },
      },
      suggestedFollowUps: [
        'How does completing the square geometrically prove this formula?',
        'What are Vieta’s formulas for root sums and products?',
        'How does the vertex form f(x) = a(x - h)² + k relate to standard form?',
      ],
      groundedNoteTitle: note?.title || 'Quadratic Functions: Discriminants & Parabolic Invariants',
    };
  }

  // General STEM pedagogical response for WHATEVER question or chapter is asked
  return {
    robotResponseText: `I have analyzed "${note ? note.title : prompt}" and self-created custom reading notes, a visual diagram, auditory narration, and practice questions for you! Switch between the learning methods above to study the way you learn best.`,
    robotEmotion: 'greeting',
    whiteboard: {
      title: note ? note.title : prompt.slice(0, 50),
      diagramType: 'step_flow',
      selfCreatedNotesMarkdown: generated.notesMarkdown,
      selfCreatedDiagramSvg: generated.diagramSvg,
      selfCreatedDiagramType: generated.diagramType,
      practiceQuestions: generated.practiceQuestions,
      audioNarrationScript: generated.audioNarrationScript,
      steps: [
        { stepNumber: 1, title: 'System Definition', description: 'Isolate the boundary conditions and identify key variables.' },
        { stepNumber: 2, title: 'Conservation Laws', description: 'Apply governing conservation laws (energy, mass, or information invariants).' },
        { stepNumber: 3, title: 'Analytical Solution', description: 'Synthesize formulas to predict system behavior under changes.' },
      ],
      keyTakeaways: [
        note ? note.summary : `Master fundamental axioms of ${prompt.slice(0, 30)}.`,
        'Draw visual diagrams to verify your algebraic intuition.',
      ],
      activity: {
        id: 'act_stem_gen',
        type: 'concept_check',
        promptQuestion: `Aero asks: When analyzing ${note ? note.title : prompt}, why do we separate independent variables first?`,
        hint: 'Independent variables allow us to analyze orthogonal components without cross-interference.',
        options: [
          { id: 'opt_1', label: 'It simplifies equations and lets us solve each dimension independently', isCorrect: true },
          { id: 'opt_2', label: 'It eliminates the need for mathematical units', isCorrect: false },
          { id: 'opt_3', label: 'It forces all equations to be linear', isCorrect: false },
        ],
      },
    },
    suggestedFollowUps: [
      'Can you show me a step-by-step example problem?',
      'What are common misconceptions students have here?',
      'How do we test this experimentally in the laboratory?',
    ],
    groundedNoteTitle: note?.title || prompt,
  };
}
