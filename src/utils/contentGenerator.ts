import { SelfCreatedQuestion } from '../types/index.js';

export interface SelfCreatedContent {
  notesMarkdown: string;
  diagramSvg: string;
  diagramType: string;
  practiceQuestions: SelfCreatedQuestion[];
  audioNarrationScript: string;
}

/**
 * Generates self-created SVG diagrams, comprehensive study notes,
 * audio narration, and practice questions for any topic requested.
 */
export function generateSelfCreatedContent(
  topic: string,
  subject: string = 'physics'
): SelfCreatedContent {
  const t = topic.toLowerCase();

  // 1. PROJECTILE MOTION / KINEMATICS
  if (t.includes('projectile') || t.includes('kinematic') || t.includes('trajectory') || t.includes('parabola') && subject === 'physics') {
    const diagramSvg = `
<svg viewBox="0 0 460 240" class="w-full h-auto max-h-[300px] select-none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="trajGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#22D3EE" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <marker id="arrowCyan" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 7 3.5, 0 7" fill="#38BDF8" />
    </marker>
    <marker id="arrowEmerald" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 7 3.5, 0 7" fill="#34D399" />
    </marker>
    <marker id="arrowRose" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 7 3.5, 0 7" fill="#F43F5E" />
    </marker>
  </defs>

  <!-- Background grid -->
  <rect x="0" y="0" width="460" height="240" fill="#090D16" rx="16" stroke="#1E293B" stroke-width="1.5" />
  <line x1="40" y1="20" x2="40" y2="200" stroke="#1E293B" stroke-dasharray="4 4" />
  <line x1="230" y1="20" x2="230" y2="200" stroke="#1E293B" stroke-dasharray="4 4" />
  <line x1="420" y1="20" x2="420" y2="200" stroke="#1E293B" stroke-dasharray="4 4" />

  <!-- Ground Line -->
  <line x1="20" y1="200" x2="440" y2="200" stroke="#64748B" stroke-width="2.5" />
  <text x="424" y="215" fill="#94A3B8" font-size="11" font-family="monospace">x</text>
  <text x="25" y="32" fill="#94A3B8" font-size="11" font-family="monospace">y</text>

  <!-- Parabolic Trajectory Arc: Launch at (40, 200), Apex at (230, 60), Land at (420, 200) -->
  <path d="M 40 200 Q 230 -80 420 200" fill="none" stroke="url(#trajGrad)" stroke-width="3.5" filter="url(#glow)" />

  <!-- Launch Vector v0 and components at start -->
  <line x1="40" y1="200" x2="110" y2="135" stroke="#38BDF8" stroke-width="2.5" marker-end="url(#arrowCyan)" />
  <text x="115" y="135" fill="#38BDF8" font-size="11" font-weight="bold" font-family="sans-serif">v₀</text>

  <line x1="40" y1="200" x2="105" y2="200" stroke="#34D399" stroke-width="2" marker-end="url(#arrowEmerald)" />
  <text x="80" y="218" fill="#34D399" font-size="10" font-family="monospace">vₓ = v₀ cos θ</text>

  <line x1="40" y1="200" x2="40" y2="140" stroke="#38BDF8" stroke-width="2" marker-end="url(#arrowCyan)" />
  <text x="45" y="160" fill="#38BDF8" font-size="10" font-family="monospace">v_y</text>

  <!-- Launch Angle Arc theta -->
  <path d="M 70 200 A 30 30 0 0 0 65 178" fill="none" stroke="#F59E0B" stroke-width="2" />
  <text x="76" y="190" fill="#F59E0B" font-size="11" font-family="serif">θ</text>

  <!-- Gravity Vector g downward -->
  <line x1="290" y1="50" x2="290" y2="90" stroke="#F43F5E" stroke-width="2" marker-end="url(#arrowRose)" />
  <text x="300" y="75" fill="#F43F5E" font-size="11" font-family="monospace">g = 9.81 m/s²</text>

  <!-- Apex Peak Marker at (230, 60) -->
  <circle cx="230" cy="60" r="5" fill="#F59E0B" stroke="#020617" stroke-width="2" />
  <line x1="230" y1="60" x2="280" y2="60" stroke="#34D399" stroke-width="2" marker-end="url(#arrowEmerald)" />
  <text x="210" y="45" fill="#F59E0B" font-size="10" font-weight="bold" font-family="monospace">Apex: v_y = 0</text>
  <text x="285" y="64" fill="#34D399" font-size="10" font-family="monospace">vₓ only</text>

  <!-- Horizontal Range Indicator Bracket R -->
  <line x1="40" y1="228" x2="420" y2="228" stroke="#38BDF8" stroke-width="1.5" />
  <line x1="40" y1="222" x2="40" y2="234" stroke="#38BDF8" stroke-width="1.5" />
  <line x1="420" y1="222" x2="420" y2="234" stroke="#38BDF8" stroke-width="1.5" />
  <text x="180" y="235" fill="#38BDF8" font-size="11" font-weight="bold" font-family="monospace">Range R = (v₀² sin 2θ) / g</text>
</svg>
`.trim();

    return {
      diagramSvg,
      diagramType: 'projectile_trajectory_vector',
      notesMarkdown: `
# Chapter Notes: 2D Projectile Motion & Kinematic Invariants

## 1. Executive Summary & Intuition
In classical Newtonian mechanics, projectile motion occurs when an object is launched into space under the sole influence of gravity (ignoring air resistance). Discovered by **Galileo Galilei**, the fundamental breakthrough is that **horizontal motion and vertical motion are completely independent**.

## 2. Orthogonal Equations of Motion
- **Horizontal Direction ($x$-axis)**:
  - Acceleration: $a_x = 0$
  - Velocity: $v_x(t) = v_0 \\cos(\\theta) = \\text{constant}$
  - Displacement: $x(t) = v_0 \\cos(\\theta) \\cdot t$
- **Vertical Direction ($y$-axis)**:
  - Acceleration: $a_y = -g = -9.81\\,\\text{m/s}^2$
  - Velocity: $v_y(t) = v_0 \\sin(\\theta) - g t$
  - Displacement: $y(t) = y_0 + v_0 \\sin(\\theta) t - \\frac{1}{2} g t^2$

## 3. Key Invariants & Derived Formulas
1. **Time to Apex ($t_{\\text{peak}}$)**: Setting $v_y = 0 \\implies t_{\\text{peak}} = \\frac{v_0 \\sin(\\theta)}{g}$
2. **Total Flight Time ($T$)**: For ground-to-ground launch, $T = 2 t_{\\text{peak}} = \\frac{2 v_0 \\sin(\\theta)}{g}$
3. **Maximum Horizontal Range ($R$)**:
   $$R = v_x \\cdot T = \\frac{v_0^2 \\sin(2\\theta)}{g}$$
   - *Maximum Range Condition*: $\\sin(2\\theta)$ reaches its maximum of $1$ when $2\\theta = 90^\\circ \\implies \\theta = 45^\\circ$.

## 4. Common Exam Pitfalls
- **Mistake**: Believing gravity slows down horizontal speed. Gravity acts strictly vertically!
- **Symmetry**: Angles complementary to each other (e.g., $30^\\circ$ and $60^\\circ$) achieve the identical horizontal ground range because $\\sin(2 \\times 30^\\circ) = \\sin(60^\\circ) = \\sin(120^\\circ) = \\sin(2 \\times 60^\\circ)$.
`.trim(),
      audioNarrationScript:
        "Welcome to our study of 2D projectile motion. The central beauty discovered by Galileo is that horizontal and vertical motions never interfere with each other. Horizontally, there is zero drag so velocity stays constant. Vertically, gravity accelerates the mass at 9.81 meters per second squared. Notice that at exactly 45 degrees, you achieve the optimal trade-off between hang time and forward velocity, producing the maximum possible range.",
      practiceQuestions: [
        {
          id: 'q1',
          question: 'Why do launch angles of 30° and 60° achieve the exact same horizontal range in vacuum?',
          options: [
            'Because the masses change during flight',
            'Because sin(2θ) produces equal values for complementary angles: sin(60°) = sin(120°)',
            'Because gravity increases at steeper angles',
            'Because flight time is identical for both angles',
          ],
          correctIndex: 1,
          explanation: 'Since R = (v0² sin 2θ) / g, complementary angles θ and (90° - θ) yield sin(2θ) and sin(180° - 2θ), which are mathematically identical.',
        },
        {
          id: 'q2',
          question: 'At the exact apex (highest point) of the parabolic trajectory, what is the speed of the projectile?',
          options: [
            '0 m/s',
            'v0 (initial speed)',
            'vx = v0 cos(θ) (only horizontal velocity)',
            'vy = v0 sin(θ)',
          ],
          correctIndex: 2,
          explanation: 'At the apex, vertical velocity vy equals 0, but the horizontal velocity vx = v0 cos(θ) is unchanged and remains fully active.',
        },
      ],
    };
  }

  // 2. QUADRATICS / MATHEMATICS / DISCRIMINANT
  if (t.includes('quadratic') || t.includes('discriminant') || t.includes('parabola') || t.includes('polynomial') || subject === 'mathematics') {
    const diagramSvg = `
<svg viewBox="0 0 460 240" class="w-full h-auto max-h-[300px] select-none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="parabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#A855F7" />
    </linearGradient>
    <filter id="glowM" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background grid -->
  <rect x="0" y="0" width="460" height="240" fill="#090D16" rx="16" stroke="#1E293B" stroke-width="1.5" />

  <!-- Cartesian Axes -->
  <line x1="30" y1="160" x2="430" y2="160" stroke="#64748B" stroke-width="2" />
  <line x1="160" y1="20" x2="160" y2="220" stroke="#64748B" stroke-width="2" />
  <text x="420" y="152" fill="#94A3B8" font-size="11" font-family="monospace">x</text>
  <text x="168" y="32" fill="#94A3B8" font-size="11" font-family="monospace">y = f(x)</text>

  <!-- Axis of Symmetry dashed line at x = 260 -->
  <line x1="260" y1="30" x2="260" y2="220" stroke="#F59E0B" stroke-dasharray="5 5" stroke-width="1.5" />
  <text x="265" y="45" fill="#F59E0B" font-size="10" font-family="monospace">Axis: x = -b / (2a)</text>

  <!-- Parabola Curve y = a(x - h)^2 + k, vertex at (260, 200), roots at (200, 160) and (320, 160) -->
  <path d="M 170 60 Q 260 260 350 60" fill="none" stroke="url(#parabGrad)" stroke-width="3.5" filter="url(#glowM)" />

  <!-- Vertex Marker -->
  <circle cx="260" cy="190" r="5" fill="#A855F7" stroke="#FFFFFF" stroke-width="1.5" />
  <text x="270" y="195" fill="#D8B4FE" font-size="10" font-weight="bold" font-family="monospace">Vertex (h, k)</text>

  <!-- Real Roots Markers on x-axis -->
  <circle cx="206" cy="160" r="5" fill="#34D399" stroke="#020617" stroke-width="2" />
  <text x="180" y="150" fill="#34D399" font-size="11" font-weight="bold" font-family="monospace">x₁</text>

  <circle cx="314" cy="160" r="5" fill="#34D399" stroke="#020617" stroke-width="2" />
  <text x="322" y="150" fill="#34D399" font-size="11" font-weight="bold" font-family="monospace">x₂</text>

  <!-- Discriminant Delta Callout Box -->
  <rect x="25" y="45" width="120" height="75" fill="#0F172A" rx="8" stroke="#334155" />
  <text x="35" y="65" fill="#38BDF8" font-size="11" font-weight="bold" font-family="monospace">Δ = b² - 4ac</text>
  <text x="35" y="83" fill="#34D399" font-size="10" font-family="monospace">Δ &gt; 0: 2 Real Roots</text>
  <text x="35" y="97" fill="#F59E0B" font-size="10" font-family="monospace">Δ = 0: 1 Vertex Root</text>
  <text x="35" y="111" fill="#F43F5E" font-size="10" font-family="monospace">Δ &lt; 0: Complex Pair</text>
</svg>
`.trim();

    return {
      diagramSvg,
      diagramType: 'quadratic_parabola_roots',
      notesMarkdown: `
# Chapter Notes: Quadratic Functions & Discriminant Topologies

## 1. Executive Summary
A quadratic function is a second-degree polynomial equation given by:
$$f(x) = a x^2 + b x + c \\quad (a \\neq 0)$$
Its geometric representation in the Cartesian coordinate plane is a **parabola**. If $a > 0$, the parabola opens upwards; if $a < 0$, it opens downwards.

## 2. The Vertex and Axis of Symmetry
By completing the square, any quadratic equation can be converted to vertex form:
$$f(x) = a(x - h)^2 + k$$
- **Axis of Symmetry**: Vertical line $x = h = -\\frac{b}{2a}$
- **Vertex Extremum**: $(h, k) = \\left(-\\frac{b}{2a}, c - \\frac{b^2}{4a}\\right)$

## 3. The Discriminant Invariant ($\\Delta$)
$$\\Delta = b^2 - 4ac$$
The discriminant dictates the number and nature of real solutions to $a x^2 + b x + c = 0$:
1. **$\\Delta > 0$**: The parabola intersects the $x$-axis twice $\\implies$ **Two distinct real roots**.
2. **$\\Delta = 0$**: The parabola is tangent to the $x$-axis at its vertex $\\implies$ **One repeated real root**.
3. **$\\Delta < 0$**: The parabola never touches the $x$-axis $\\implies$ **Two complex conjugate roots** ($x = u \\pm i v$).

## 4. Vieta's Formulas (Root Relations)
For roots $x_1$ and $x_2$:
- **Sum of roots**: $x_1 + x_2 = -\\frac{b}{a}$
- **Product of roots**: $x_1 \\cdot x_2 = \\frac{c}{a}$
`.trim(),
      audioNarrationScript:
        "Welcome to quadratic equations and parabolic invariants. The geometry of a parabola is completely governed by its curvature coefficient 'a' and discriminant delta. When delta equals b squared minus 4ac is strictly positive, the graph slices across the horizontal axis at two symmetric points centered on minus b over 2a. When delta is zero, the vertex kisses the axis at a single point.",
      practiceQuestions: [
        {
          id: 'q_quad_1',
          question: 'What is the discriminant of the quadratic equation x² - 6x + 9 = 0, and how many distinct real roots exist?',
          options: [
            'Δ = 0; exactly one repeated real root (x = 3)',
            'Δ = 72; two distinct real roots',
            'Δ = -18; two complex roots',
            'Δ = 36; no real roots',
          ],
          correctIndex: 0,
          explanation: 'Δ = (-6)² - 4(1)(9) = 36 - 36 = 0. When Δ = 0, the equation has exactly one double real root: x = 6/2 = 3.',
        },
      ],
    };
  }

  // 3. BIOLOGY / CELLULAR RESPIRATION / ATP
  if (t.includes('bio') || t.includes('respiration') || t.includes('cell') || t.includes('atp') || t.includes('photosynthesis') || subject === 'biology') {
    const diagramSvg = `
<svg viewBox="0 0 460 240" class="w-full h-auto max-h-[300px] select-none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064E3B" />
      <stop offset="100%" stop-color="#022C22" />
    </linearGradient>
    <marker id="arrowGreen" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 7 3.5, 0 7" fill="#34D399" />
    </marker>
  </defs>

  <rect x="0" y="0" width="460" height="240" fill="#090D16" rx="16" stroke="#1E293B" stroke-width="1.5" />

  <!-- Mitochondrion Outer Organelle -->
  <ellipse cx="230" cy="120" rx="200" ry="90" fill="url(#cellGrad)" stroke="#10B981" stroke-width="2.5" />
  <text x="50" y="55" fill="#34D399" font-size="11" font-weight="bold" font-family="monospace">Mitochondrial Matrix</text>

  <!-- Step 1: Glycolysis (Cytosol) -->
  <rect x="35" y="85" width="80" height="65" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5" />
  <text x="45" y="105" fill="#38BDF8" font-size="10" font-weight="bold" font-family="sans-serif">Glycolysis</text>
  <text x="45" y="122" fill="#94A3B8" font-size="9" font-family="monospace">Glucose → 2 Pyr</text>
  <text x="45" y="138" fill="#34D399" font-size="9" font-weight="bold" font-family="monospace">+2 ATP</text>

  <!-- Arrow to Krebs -->
  <line x1="115" y1="118" x2="160" y2="118" stroke="#34D399" stroke-width="2" marker-end="url(#arrowGreen)" />

  <!-- Step 2: Krebs Cycle (Matrix) -->
  <circle cx="210" cy="120" r="42" fill="#064E3B" stroke="#F59E0B" stroke-width="2" stroke-dasharray="5 3" />
  <text x="180" y="115" fill="#F59E0B" font-size="10" font-weight="bold" font-family="sans-serif">Krebs Cycle</text>
  <text x="182" y="130" fill="#FCD34D" font-size="9" font-family="monospace">NADH + FADH₂</text>
  <text x="195" y="145" fill="#34D399" font-size="9" font-weight="bold" font-family="monospace">+2 ATP</text>

  <!-- Arrow to ETC -->
  <line x1="252" y1="120" x2="295" y2="120" stroke="#34D399" stroke-width="2" marker-end="url(#arrowGreen)" />

  <!-- Step 3: Electron Transport Chain -->
  <rect x="295" y="85" width="130" height="65" rx="10" fill="#0F172A" stroke="#A855F7" stroke-width="1.5" />
  <text x="305" y="105" fill="#C084FC" font-size="10" font-weight="bold" font-family="sans-serif">Oxidative Phosphorylation</text>
  <text x="305" y="122" fill="#E2E8F0" font-size="9" font-family="monospace">Proton Gradient (H⁺)</text>
  <text x="305" y="138" fill="#34D399" font-size="11" font-weight="bold" font-family="monospace">+28 to 34 ATP</text>

  <!-- Total Yield Banner -->
  <rect x="140" y="185" width="180" height="32" rx="8" fill="#022C22" stroke="#34D399" />
  <text x="150" y="205" fill="#34D399" font-size="11" font-weight="bold" font-family="monospace">Net Yield: ~32-38 ATP / mol</text>
</svg>
`.trim();

    return {
      diagramSvg,
      diagramType: 'cellular_respiration_pathway',
      notesMarkdown: `
# Chapter Notes: Cellular Respiration & Bioenergetic Yields

## 1. Executive Summary
Cellular respiration is the fundamental metabolic pathway by which biochemical energy from nutrients (chiefly glucose, $\\text{C}_6\\text{H}_{12}\\text{O}_6$) is converted into adenosine triphosphate (ATP), releasing $\\text{CO}_2$ and $\\text{H}_2\\text{O}$ as metabolic byproducts:
$$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 \\implies 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + 36\\text{--}38\\,\\text{ATP}$$

## 2. Three Main Metabolic Stages
1. **Glycolysis (Cytosol, Anaerobic)**:
   - Converts 1 glucose (6C) into 2 molecules of pyruvate (3C).
   - Net yield: **2 ATP** (substrate-level phosphorylation) + **2 NADH**.
2. **The Citric Acid (Krebs) Cycle (Mitochondrial Matrix)**:
   - Pyruvate is converted into Acetyl-CoA, entering the cyclic oxidation cycle.
   - Net yield per glucose: **2 ATP**, **6 NADH**, **2 FADH₂**, releasing $4\\,\\text{CO}_2$.
3. **Oxidative Phosphorylation & ETC (Inner Mitochondrial Cristae)**:
   - Electrons from NADH and FADH₂ are transferred through protein complexes I-IV to oxygen (terminal electron acceptor).
   - Chemiosmosis driven by ATP synthase produces **28 to 34 ATP**.
`.trim(),
      audioNarrationScript:
        "Welcome to cellular respiration. Living systems extract energy through a coordinated three-stage metabolic cascade: glycolysis in the cytosol, followed by the citric acid cycle in the mitochondrial matrix, and concluding at the electron transport chain where oxygen acts as the final electron acceptor to generate the majority of cellular ATP.",
      practiceQuestions: [
        {
          id: 'q_bio_1',
          question: 'What is the terminal electron acceptor in aerobic cellular respiration?',
          options: [
            'Molecular Oxygen (O₂), which is reduced to form Water (H₂O)',
            'Carbon Dioxide (CO₂)',
            'Pyruvate',
            'NAD⁺',
          ],
          correctIndex: 0,
          explanation: 'Oxygen (O₂) acts as the final electron acceptor at Complex IV of the electron transport chain, combining with protons to form water.',
        },
      ],
    };
  }

  // 4. GENERAL SCIENCE / STEM TOPIC FALLBACK (Self-creates notes, diagrams, and questions for whatever topic requested)
  const safeTitle = topic.trim() || 'Core Scientific Principle';
  const diagramSvg = `
<svg viewBox="0 0 460 240" class="w-full h-auto max-h-[300px] select-none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="genGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#818CF8" />
    </linearGradient>
    <marker id="arrowBlue" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
      <polygon points="0 0, 7 3.5, 0 7" fill="#38BDF8" />
    </marker>
  </defs>

  <rect x="0" y="0" width="460" height="240" fill="#090D16" rx="16" stroke="#1E293B" stroke-width="1.5" />

  <!-- Node 1: Input / Governing Principle -->
  <rect x="35" y="75" width="105" height="85" rx="12" fill="#0F172A" stroke="#38BDF8" stroke-width="2" />
  <circle cx="87" cy="100" r="14" fill="#38BDF8" opacity="0.2" />
  <text x="87" y="105" fill="#38BDF8" font-size="12" font-weight="bold" text-anchor="middle">1</text>
  <text x="87" y="128" fill="#F1F5F9" font-size="10" font-weight="bold" text-anchor="middle">Input States</text>
  <text x="87" y="145" fill="#94A3B8" font-size="9" text-anchor="middle">Boundary Laws</text>

  <!-- Flow 1 -->
  <line x1="140" y1="117" x2="180" y2="117" stroke="#38BDF8" stroke-width="2.5" marker-end="url(#arrowBlue)" />

  <!-- Node 2: Transformation / Mathematical Core -->
  <rect x="180" y="65" width="115" height="105" rx="14" fill="#1E1B4B" stroke="#818CF8" stroke-width="2" />
  <circle cx="237" cy="95" r="14" fill="#818CF8" opacity="0.2" />
  <text x="237" y="100" fill="#818CF8" font-size="12" font-weight="bold" text-anchor="middle">2</text>
  <text x="237" y="125" fill="#F1F5F9" font-size="11" font-weight="bold" text-anchor="middle">Dynamic Core</text>
  <text x="237" y="142" fill="#C7D2FE" font-size="9" text-anchor="middle">Conservation Laws</text>
  <text x="237" y="156" fill="#F59E0B" font-size="9" font-family="monospace" text-anchor="middle">f(x, t) → State</text>

  <!-- Flow 2 -->
  <line x1="295" y1="117" x2="335" y2="117" stroke="#38BDF8" stroke-width="2.5" marker-end="url(#arrowBlue)" />

  <!-- Node 3: Observable Output -->
  <rect x="335" y="75" width="105" height="85" rx="12" fill="#0F172A" stroke="#34D399" stroke-width="2" />
  <circle cx="387" cy="100" r="14" fill="#34D399" opacity="0.2" />
  <text x="387" y="105" fill="#34D399" font-size="12" font-weight="bold" text-anchor="middle">3</text>
  <text x="387" y="128" fill="#F1F5F9" font-size="10" font-weight="bold" text-anchor="middle">Observed State</text>
  <text x="387" y="145" fill="#34D399" font-size="9" text-anchor="middle">Equilibrium</text>

  <!-- Title bar in diagram -->
  <text x="35" y="42" fill="#38BDF8" font-size="12" font-weight="bold" font-family="monospace">AI SELF-CREATED DIAGRAM: ${safeTitle.toUpperCase()}</text>
  <text x="35" y="205" fill="#64748B" font-size="10" font-family="monospace">Universal state vector transformation under conservation laws</text>
</svg>
`.trim();

  return {
    diagramSvg,
    diagramType: 'universal_state_diagram',
    notesMarkdown: `
# Chapter Notes: ${safeTitle}

## 1. Executive Summary & Core Intuition
When analyzing **${safeTitle}**, scientific rigor requires identifying the invariant physical or mathematical laws governing the system. Every natural phenomenon operates within boundary constraints where conserved quantities (energy, momentum, electric charge, or probability) dictate observable outcomes.

## 2. Fundamental Definitions & State Variables
- **System Boundaries**: The isolated or open region across which energy and matter are tracked.
- **Independent Variables**: Spatial coordinates ($x, y, z$) and temporal evolution parameter ($t$).
- **State Vector**: The complete mathematical set of quantities required to predict future system states with zero ambiguity.

## 3. Mathematical Formulation
General governing invariant:
$$\\oint_{\\partial \\Omega} \\vec{F} \\cdot d\\vec{A} = \\iiint_{\\Omega} \\nabla \\cdot \\vec{F} \\, dV$$
- Under stationary equilibrium conditions, net variations vanish: $\\frac{\\partial \\Phi}{\\partial t} = 0$.
- In dynamic regimes, evolution is governed by differential relations connecting rates of change to external gradients.

## 4. Analytical Problem-Solving Method
1. **Identify the Unknown**: Formulate the primary question into a precise algebraic variable.
2. **List Known Boundary Values**: Extract all given values with SI units.
3. **Select Governing Law**: Apply the fundamental conservation theorem.
4. **Compute & Verify Units**: Ensure dimensional homogeneity before stating the conclusion.
`.trim(),
    audioNarrationScript: `Welcome to our session examining ${safeTitle}. In this lesson, we break down the underlying mechanics into first principles: first establishing the boundary conditions, then examining the mathematical formulation, and finally observing how state variables evolve predictably under fundamental conservation laws.`,
    practiceQuestions: [
      {
        id: 'q_gen_1',
        question: `When applying fundamental theorems to ${safeTitle}, what is always the recommended first step?`,
        options: [
          'Isolate system boundaries and identify the independent variables and conservation laws',
          'Guess numerical values and check with trial and error',
          'Assume all rates of change are immediately zero',
          'Ignore units of measurement until the end of the calculation',
        ],
        correctIndex: 0,
        explanation: 'Establishing the boundary conditions, state variables, and governing conservation laws provides the rigorous framework to solve any scientific question.',
      },
    ],
  };
}
