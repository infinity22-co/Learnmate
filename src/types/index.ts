export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  classGrade?: string; // e.g. Grade 10, Grade 11, Grade 12
  stream?: string; // e.g. Science (PCM), Science (PCB), Commerce, Computer Science
  onboardingExamCompleted?: boolean;
  onboardingScore?: number;
  avatar?: string;
  createdAt: string;
}

export type SubjectType = 'physics' | 'mathematics' | 'biology' | 'chemistry' | 'computer_science';

export interface CurriculumNote {
  id: string;
  title: string;
  subject: SubjectType;
  chapterNumber?: number;
  gradeLevel: string; // target class e.g. Grade 11
  summary: string;
  contentMarkdown: string;
  notePhotoUrl?: string; // Photo of notes/diagrams uploaded by admin
  whatIsTaught?: string[]; // Core topics/skills taught in this chapter
  keyFormulas: string[];
  visualKeywords: string[];
  publishedStatus: 'published' | 'draft';
  authorName: string;
  authorId: string;
  updatedAt: string;
  readTimeMinutes: number;
}

export interface AdminCurriculumConfig {
  availableClasses: string[];
  availableSubjects: { id: SubjectType; name: string }[];
}

export type AssessmentCategory = 'spatial_matrix' | 'pattern_completion' | 'working_memory' | 'visual_logic';

export interface AssessmentStimulus {
  type: AssessmentCategory;
  gridSize?: number;
  matrixData?: string[][]; // shapes or colors
  sequence?: string[];
  balanceData?: {
    left: string[];
    right: string[];
    relation: '=' | '>' | '<';
  }[];
  promptInstruction: string;
  imageUrl?: string;
}

export interface AssessmentQuestion {
  id: string;
  questionText: string;
  options: {
    id: string;
    label: string;
    visualPattern?: string;
    shapeType?: string;
    color?: string;
  }[];
  correctOptionId: string;
  explanation: string;
  domain: 'spatial_reasoning' | 'working_memory' | 'pattern_analysis' | 'visual_deduction';
}

export interface VisualAssessment {
  id: string;
  title: string;
  category: AssessmentCategory;
  difficulty: 'foundation' | 'intermediate' | 'advanced';
  timeLimitObservationSec: number;
  timeLimitRecallSec: number;
  stimulus: AssessmentStimulus;
  questions: AssessmentQuestion[];
  published: boolean;
  totalPoints: number;
}

export interface AssessmentResult {
  id: string;
  studentId: string;
  studentName: string;
  assessmentId: string;
  assessmentTitle: string;
  category: AssessmentCategory;
  score: number;
  maxScore: number;
  accuracyPercent: number;
  observationTimeSpentSec: number;
  recallTimeSpentSec: number;
  answers: {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
  cognitiveBreakdown: {
    spatialReasoning: number;
    workingMemory: number;
    patternAnalysis: number;
  };
  feedback: string;
  completedAt: string;
}

export type RobotEmotion = 
  | 'idle' 
  | 'greeting' 
  | 'listening' 
  | 'thinking' 
  | 'speaking' 
  | 'explaining' 
  | 'celebrating' 
  | 'curious' 
  | 'encouraging';

export interface InteractiveActivity {
  id: string;
  type: 'verbal_prompt' | 'simulation_challenge' | 'concept_check';
  promptQuestion: string;
  hint?: string;
  options?: { id: string; label: string; isCorrect: boolean }[];
  simulationTarget?: {
    param: string;
    targetValue: number;
    unit: string;
    instruction: string;
  };
}

export type LearningMethod = 'auditory' | 'reading_notes' | 'diagrams' | 'questions';

export interface SelfCreatedQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WhiteboardData {
  title: string;
  diagramType: 'equation' | 'step_flow' | 'comparison' | 'interactive_model' | 'key_takeaways';
  notePhotoUrl?: string; // Display admin note photo on the board
  steps?: { stepNumber: number; title: string; description: string }[];
  formula?: {
    latex: string;
    variables: { symbol: string; label: string; value?: string }[];
    interactiveSlider?: {
      param: string;
      label: string;
      min: number;
      max: number;
      default: number;
      unit: string;
    };
  };
  comparisonData?: {
    headers: string[];
    rows: string[][];
  };
  keyTakeaways?: string[];
  activity?: InteractiveActivity;
  // AI Self-Created Content and Modality Fields
  selfCreatedNotesMarkdown?: string;
  selfCreatedDiagramSvg?: string;
  selfCreatedDiagramType?: string;
  practiceQuestions?: SelfCreatedQuestion[];
  audioNarrationScript?: string;
  activeMethod?: LearningMethod;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: RobotEmotion;
  whiteboard?: WhiteboardData;
  suggestedFollowUps?: string[];
  groundedNoteTitle?: string;
  timestamp: string;
}

export interface AttentionMetrics {
  status: 'attentive' | 'distracted' | 'idle' | 'no_face';
  score: number; // 0 to 100
  faceDetected: boolean;
  blinkRatePerMin?: number;
}
