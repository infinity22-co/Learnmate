import fs from 'fs';
import path from 'path';
import { User, CurriculumNote, VisualAssessment, AssessmentResult, TutorMessage } from '../src/types/index.js';
import { hashPassword } from './auth.js';

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  curriculumNotes: CurriculumNote[];
  assessments: VisualAssessment[];
  assessmentResults: AssessmentResult[];
  tutorSessions: {
    id: string;
    studentId: string;
    subject: string;
    noteId?: string;
    messages: TutorMessage[];
    updatedAt: string;
  }[];
  bookmarks: {
    studentId: string;
    noteId: string;
    savedAt: string;
  }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'learnmate_db.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.initializeDatabase();
  }

  private initializeDatabase(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      } catch (err) {
        console.error('Failed reading existing db file, generating seed data:', err);
      }
    }

    // Seed database
    const seeded = this.generateSeedData();
    this.persistSync(seeded);
    return seeded;
  }

  private persistSync(dataToSave: DatabaseSchema): void {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  public persist(): void {
    this.persistSync(this.data);
  }

  private generateSeedData(): DatabaseSchema {
    // Admin credentials: username "admin", password "admin" as explicitly requested
    const adminPasswordHash = hashPassword('admin');
    const studentPasswordHash = hashPassword('student123');

    const users: (User & { passwordHash: string })[] = [
      {
        id: 'usr_admin',
        name: 'System Admin',
        email: 'admin',
        passwordHash: adminPasswordHash,
        role: 'admin',
        createdAt: '2026-09-01T08:00:00Z',
      },
      {
        id: 'usr_student_01',
        name: 'Alex Chen',
        email: 'alex@student.edu',
        passwordHash: studentPasswordHash,
        role: 'student',
        classGrade: 'Grade 11',
        stream: 'Science (PCM)',
        onboardingExamCompleted: true,
        onboardingScore: 95,
        createdAt: '2026-09-15T10:00:00Z',
      },
    ];

    // Admin chapter notes
    const curriculumNotes: CurriculumNote[] = [
      {
        id: 'note_phys_ch1',
        title: 'Chapter 1: 2D Projectile Motion & Vector Invariants',
        subject: 'physics',
        chapterNumber: 1,
        gradeLevel: 'Grade 11',
        summary: 'Master horizontal velocity independence, gravitational acceleration, and parabolic launch equations.',
        contentMarkdown: `### Chapter 1: 2D Projectile Motion & Kinematics
In classical Newtonian mechanics, projectile motion occurs when an object is launched into a gravitational field under the sole influence of gravity (ignoring air resistance). 

The foundational insight discovered by Galileo Galilei is that the **horizontal motion and vertical motion are completely independent**:

1. **Horizontal Motion ($x$-axis)**: 
   There is zero acceleration in the horizontal direction ($a_x = 0$). The object travels at constant horizontal velocity:
   $$v_x = v_0 \\cos(\\theta)$$
   $$x(t) = v_0 \\cos(\\theta) \\cdot t$$

2. **Vertical Motion ($y$-axis)**: 
   The object experiences constant downward gravitational acceleration ($a_y = -g$, where $g \\approx 9.81\\,\\text{m/s}^2$):
   $$v_y(t) = v_0 \\sin(\\theta) - g t$$
   $$y(t) = y_0 + v_0 \\sin(\\theta) \\cdot t - \\frac{1}{2} g t^2$$

### 2. Maximum Flight Height & Ground Range
- **Time to Peak**: Setting $v_y = 0 \\implies t_{\\text{peak}} = \\frac{v_0 \\sin(\\theta)}{g}$
- **Total Flight Time (flat ground)**: $T = 2 t_{\\text{peak}} = \\frac{2 v_0 \\sin(\\theta)}{g}$
- **Maximum Range ($R$)**:
  $$R = v_x \\cdot T = \\frac{v_0^2 \\sin(2\\theta)}{g}$$
  Notice that $\\sin(2\\theta)$ achieves its maximum value of $1$ when $2\\theta = 90^\\circ \\implies \\theta = 45^\\circ$.`,
        keyFormulas: [
          'v_x = v_0 \\cos(\\theta)',
          'y(t) = v_0 \\sin(\\theta) t - \\frac{1}{2} g t^2',
          'R = \\frac{v_0^2 \\sin(2\\theta)}{g}',
        ],
        visualKeywords: ['parabola', 'velocity vector', 'gravitational field', 'apex trajectory'],
        publishedStatus: 'published',
        authorName: 'System Admin',
        authorId: 'usr_admin',
        updatedAt: '2026-10-18T14:00:00Z',
        readTimeMinutes: 5,
      },
      {
        id: 'note_phys_ch2',
        title: 'Chapter 2: Newton\'s Laws & Momentum Conservation',
        subject: 'physics',
        chapterNumber: 2,
        gradeLevel: 'Grade 11',
        summary: 'Explore force vectors, inertial frames of reference, and elastic collision dynamics.',
        contentMarkdown: `### Chapter 2: Dynamics & Conservation Laws
Newtonian dynamics formalize how forces govern acceleration.

1. **First Law (Inertia)**: An object remains at rest or in uniform straight motion unless acted upon by a net external force.
2. **Second Law (Force & Momentum)**: 
   $$\\vec{F}_{\\text{net}} = m \\vec{a} = \\frac{d\\vec{p}}{dt}$$
3. **Third Law (Action-Reaction)**: For every action, there is an equal and opposite reaction: $\\vec{F}_{AB} = -\\vec{F}_{BA}$.

### Momentum Invariance
In any closed isolated system with no external impulse:
$$\\sum \\vec{p}_{\\text{initial}} = \\sum \\vec{p}_{\\text{final}}$$`,
        keyFormulas: ['F = m \\cdot a', 'p = m \\cdot v', '\\Delta p = F \\cdot \\Delta t'],
        visualKeywords: ['force vector', 'friction', 'momentum conservation'],
        publishedStatus: 'published',
        authorName: 'System Admin',
        authorId: 'usr_admin',
        updatedAt: '2026-10-19T11:00:00Z',
        readTimeMinutes: 4,
      },
      {
        id: 'note_math_ch1',
        title: 'Chapter 1: Quadratic Functions & Parabolic Invariants',
        subject: 'mathematics',
        chapterNumber: 1,
        gradeLevel: 'Grade 10-11',
        summary: 'Polynomials of degree 2, vertex form, discriminant geometry, and roots.',
        contentMarkdown: `### Chapter 1: Quadratic Polynomials & Roots
Standard algebraic representation:
$$f(x) = a x^2 + b x + c \\quad (a \\neq 0)$$

Completing the square yields the **vertex form**:
$$f(x) = a\\left(x + \\frac{b}{2a}\\right)^2 + \\left(c - \\frac{b^2}{4a}\\right)$$

### The Discriminant Invariant ($\\Delta$)
$$\\Delta = b^2 - 4ac$$
- **$\\Delta > 0$**: Exactly two distinct real roots $x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$.
- **$\\Delta = 0$**: Exactly one real root tangent to $x$-axis.
- **$\\Delta < 0$**: Two complex conjugate roots.`,
        keyFormulas: [
          'f(x) = a(x - h)^2 + k',
          '\\Delta = b^2 - 4ac',
          'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        ],
        visualKeywords: ['vertex', 'axis of symmetry', 'discriminant plane', 'parabola'],
        publishedStatus: 'published',
        authorName: 'System Admin',
        authorId: 'usr_admin',
        updatedAt: '2026-10-15T09:30:00Z',
        readTimeMinutes: 5,
      },
      {
        id: 'note_bio_ch1',
        title: 'Chapter 1: Cellular Respiration & ATP Yield',
        subject: 'biology',
        chapterNumber: 1,
        gradeLevel: 'Grade 11-12',
        summary: 'Glycolysis, Krebs cycle, and chemiosmotic oxidative phosphorylation.',
        contentMarkdown: `### Chapter 1: Bioenergetics & Cellular Respiration
Cellular respiration oxidizes biochemical nutrients into adenosine triphosphate (ATP):
$$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\longrightarrow 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + 30\\text{--}32\\,\\text{ATP}$$

### Key Stages:
1. **Glycolysis (Cytoplasm)**: Glucose (6C) $\\to$ 2 Pyruvate (3C) $+ 2\\,\\text{ATP} + 2\\,\\text{NADH}$.
2. **Krebs Cycle (Mitochondrial Matrix)**: Acetyl-CoA generates $\\text{NADH}, \\text{FADH}_2, \\text{GTP}$.
3. **Oxidative Phosphorylation (Inner Membrane)**: Chemiosmotic proton gradient drives rotary ATP Synthase.`,
        keyFormulas: ['\\Delta G^\\circ = -2870\\,\\text{kJ/mol}', 'ATP \\rightleftharpoons ADP + P_i'],
        visualKeywords: ['mitochondria', 'chemiosmosis', 'ATP synthase rotor'],
        publishedStatus: 'published',
        authorName: 'System Admin',
        authorId: 'usr_admin',
        updatedAt: '2026-10-12T11:00:00Z',
        readTimeMinutes: 5,
      },
    ];

    // Mandatory Onboarding Visual Analysis Exam & standard assessments
    const assessments: VisualAssessment[] = [
      {
        id: 'asm_onboarding_01',
        title: 'Mandatory Student Onboarding Exam: Visual Analysis',
        category: 'spatial_matrix',
        difficulty: 'foundation',
        timeLimitObservationSec: 10,
        timeLimitRecallSec: 30,
        totalPoints: 100,
        published: true,
        stimulus: {
          type: 'spatial_matrix',
          gridSize: 3,
          promptInstruction: 'Carefully observe this 3x3 visual pattern matrix. Identify how the shape polygon vertices increase across rows while their color shifts across columns.',
          matrixData: [
            ['Triangle (Cyan)', 'Triangle (Amber)', 'Triangle (Purple)'],
            ['Square (Cyan)', 'Square (Amber)', 'Square (Purple)'],
            ['Pentagon (Cyan)', 'Pentagon (Amber)', '? (Target Slot)'],
          ],
        },
        questions: [
          {
            id: 'q_onb_1',
            questionText: 'Which geometric shape and color accurately completes the bottom-right matrix slot?',
            options: [
              { id: 'opt_onb_a', label: 'Pentagon with Purple fill', color: '#A855F7' },
              { id: 'opt_onb_b', label: 'Hexagon with Cyan fill', color: '#06B6D4' },
              { id: 'opt_onb_c', label: 'Triangle with Amber fill', color: '#F59E0B' },
              { id: 'opt_onb_d', label: 'Square with Green fill', color: '#10B981' },
            ],
            correctOptionId: 'opt_onb_a',
            explanation: 'Row 3 maintains the Pentagon polygon (5 vertices), and Column 3 corresponds to the Purple chromatic phase. Therefore, the missing cell is Pentagon with Purple fill.',
            domain: 'spatial_reasoning',
          },
          {
            id: 'q_onb_2',
            questionText: 'What is the primary visual rule that governs the shape transitions across each row?',
            options: [
              { id: 'opt_onb_2a', label: 'Shapes remain identical along a row while color shifts across columns' },
              { id: 'opt_onb_2b', label: 'Shapes rotate randomly by 45 degrees' },
              { id: 'opt_onb_2c', label: 'Color alternates based on vertex parity' },
            ],
            correctOptionId: 'opt_onb_2a',
            explanation: 'The matrix uses an orthogonal row-column rule: row specifies geometry (Triangle -> Square -> Pentagon), and column specifies color phase (Cyan -> Amber -> Purple).',
            domain: 'pattern_analysis',
          },
        ],
      },
      {
        id: 'asm_spatial_01',
        title: 'Spatial Matrix: Rotational Invariant Analysis',
        category: 'spatial_matrix',
        difficulty: 'intermediate',
        timeLimitObservationSec: 8,
        timeLimitRecallSec: 25,
        totalPoints: 100,
        published: true,
        stimulus: {
          type: 'spatial_matrix',
          gridSize: 3,
          promptInstruction: 'Observe the 3x3 geometric matrix. Note how shapes rotate clockwise along rows.',
          matrixData: [
            ['Triangle 0°', 'Triangle 90°', 'Triangle 180°'],
            ['Square 0°', 'Square 45°', 'Square 90°'],
            ['Hexagon 0°', 'Hexagon 60°', '? (Target)'],
          ],
        },
        questions: [
          {
            id: 'q_sp_1',
            questionText: 'What element completes the bottom-right target cell?',
            options: [
              { id: 'opt_a', label: 'Hexagon rotated 120° with Purple fill' },
              { id: 'opt_b', label: 'Hexagon rotated 60° with Cyan fill' },
              { id: 'opt_c', label: 'Octagon rotated 90° with Amber fill' },
            ],
            correctOptionId: 'opt_a',
            explanation: 'Hexagon symmetry step is 60°: 0° -> 60° -> 120°.',
            domain: 'spatial_reasoning',
          },
        ],
      },
    ];

    return {
      users,
      curriculumNotes,
      assessments,
      assessmentResults: [],
      tutorSessions: [],
      bookmarks: [],
    };
  }

  // User operations
  public getUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  public getUserByEmailWithPassword(emailOrUsername: string): (User & { passwordHash: string }) | undefined {
    const target = emailOrUsername.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === target || (u.role === 'admin' && target === 'admin'));
  }

  public createUser(user: User, passwordHash: string): User {
    this.data.users.push({ ...user, passwordHash });
    this.persist();
    return user;
  }

  public completeOnboardingExam(userId: string, score: number): void {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.onboardingExamCompleted = true;
      user.onboardingScore = score;
      this.persist();
    }
  }

  // Curriculum operations - Only what admin provides is taught
  public getNotes(role: 'admin' | 'student', subject?: string): CurriculumNote[] {
    let list = this.data.curriculumNotes;
    if (role === 'student') {
      list = list.filter(n => n.publishedStatus === 'published');
    }
    if (subject && subject !== 'all') {
      list = list.filter(n => n.subject === subject);
    }
    return list;
  }

  public getNoteById(id: string, role: 'admin' | 'student'): CurriculumNote | undefined {
    const note = this.data.curriculumNotes.find(n => n.id === id);
    if (!note) return undefined;
    if (role === 'student' && note.publishedStatus !== 'published') {
      return undefined;
    }
    return note;
  }

  public createNote(note: CurriculumNote): CurriculumNote {
    this.data.curriculumNotes.unshift(note);
    this.persist();
    return note;
  }

  public updateNote(id: string, updates: Partial<CurriculumNote>): CurriculumNote | undefined {
    const index = this.data.curriculumNotes.findIndex(n => n.id === id);
    if (index === -1) return undefined;
    this.data.curriculumNotes[index] = {
      ...this.data.curriculumNotes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.curriculumNotes[index];
  }

  public deleteNote(id: string): boolean {
    const initialLen = this.data.curriculumNotes.length;
    this.data.curriculumNotes = this.data.curriculumNotes.filter(n => n.id !== id);
    if (this.data.curriculumNotes.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Assessment operations
  public getAssessments(): VisualAssessment[] {
    return this.data.assessments.filter(a => a.published);
  }

  public getAssessmentById(id: string): VisualAssessment | undefined {
    return this.data.assessments.find(a => a.id === id);
  }

  public getOnboardingAssessment(): VisualAssessment | undefined {
    return this.data.assessments.find(a => a.id === 'asm_onboarding_01') || this.data.assessments[0];
  }

  public saveAssessmentResult(result: AssessmentResult): void {
    this.data.assessmentResults.unshift(result);
    this.persist();
  }

  public getStudentResults(studentId: string): AssessmentResult[] {
    return this.data.assessmentResults.filter(r => r.studentId === studentId);
  }

  public getAllResultsForAdmin(): AssessmentResult[] {
    return this.data.assessmentResults;
  }

  // Bookmarks
  public toggleBookmark(studentId: string, noteId: string): boolean {
    const existingIndex = this.data.bookmarks.findIndex(
      b => b.studentId === studentId && b.noteId === noteId
    );
    if (existingIndex > -1) {
      this.data.bookmarks.splice(existingIndex, 1);
      this.persist();
      return false;
    } else {
      this.data.bookmarks.push({
        studentId,
        noteId,
        savedAt: new Date().toISOString(),
      });
      this.persist();
      return true;
    }
  }

  public getStudentBookmarks(studentId: string): string[] {
    return this.data.bookmarks.filter(b => b.studentId === studentId).map(b => b.noteId);
  }

  // Search grounded notes for AI Tutor strictly from admin provided materials
  public searchGroundedNotes(query: string, subject?: string): CurriculumNote[] {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const published = this.data.curriculumNotes.filter(n => n.publishedStatus === 'published');
    
    if (terms.length === 0) {
      return subject ? published.filter(n => n.subject === subject) : published.slice(0, 3);
    }

    const scored = published.map(note => {
      let score = 0;
      const titleLower = note.title.toLowerCase();
      const summaryLower = note.summary.toLowerCase();
      const contentLower = note.contentMarkdown.toLowerCase();

      if (subject && note.subject === subject) score += 5;

      for (const term of terms) {
        if (titleLower.includes(term)) score += 10;
        if (note.visualKeywords?.some(k => k.toLowerCase().includes(term))) score += 8;
        if (summaryLower.includes(term)) score += 4;
        if (contentLower.includes(term)) score += 2;
      }
      return { note, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.note)
      .slice(0, 2);
  }
}

export const db = new Database();
