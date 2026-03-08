import type { OnboardingData, BookContext } from "../../types";

// ─────────────────────────────────────────────────────────────────────────────
// TAXONOMY-AWARE SUBJECT CLASSIFIER
// Maps any topic string → a rich subject profile used to personalise ALL prompts
// ─────────────────────────────────────────────────────────────────────────────

type SubjectProfile = {
  domain: string;
  teachingStyle: string;
  contentEmphasis: string[];
  toneDescriptor: string;
  lessonFormat: string;
  exampleStyle: string;
  vocabularyNote: string;
  codeHeavy: boolean;
  termHeavy: boolean;
  mathHeavy: boolean;
  narrativeHeavy: boolean;
  practicalHeavy: boolean;
  quizStyle: string;
  onboardingPersona: string;
  attentionAnchor: string; // The "critical reinforcement hook" per ibestt principles
};

const SUBJECT_PROFILES: Record<string, SubjectProfile> = {

  // ── TECHNOLOGY & COMPUTING ────────────────────────────────────────────────
  programming: {
    domain: "Programming & Software Development",
    teachingStyle: "hands-on, build-as-you-learn, error-driven discovery",
    contentEmphasis: ["working code examples in every section", "common bugs and how to fix them", "real project snippets", "terminal output walkthroughs"],
    toneDescriptor: "precise and direct — like a senior engineer pair-programming with you",
    lessonFormat: "concept → minimal theory → code → output → extend it → gotchas",
    exampleStyle: "Every concept must include a runnable code block. Show input AND output. Use comments liberally.",
    vocabularyNote: "Use correct technical terms immediately. Define them inline. Never dumb down — but always clarify.",
    codeHeavy: true, termHeavy: false, mathHeavy: false, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "debugging challenges, fill-in-the-blank code, predict-the-output questions",
    onboardingPersona: "a senior developer who skips fluff and gets straight to what matters",
    attentionAnchor: "Show a working mini-project in the first lesson — let the learner run it immediately to create a positive reinforcement loop.",
  },

  webdev: {
    domain: "Web Development",
    teachingStyle: "visual-first, browser-centric, iterative builds",
    contentEmphasis: ["HTML/CSS/JS snippets that render visually", "before/after browser screenshots described in text", "progressive enhancement examples", "live demo walkthroughs"],
    toneDescriptor: "enthusiastic and visual — like a designer who codes",
    lessonFormat: "visual goal → HTML skeleton → CSS layer → JS behaviour → deploy step",
    exampleStyle: "Every lesson builds one visible web component. Code blocks should be complete and copy-pasteable.",
    vocabularyNote: "Use web-standard terminology (DOM, viewport, cascade, etc.) immediately. Link concepts to browser DevTools.",
    codeHeavy: true, termHeavy: false, mathHeavy: false, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "spot-the-bug in HTML/CSS, predict how a layout renders, fill-missing-selector challenges",
    onboardingPersona: "a creative developer who loves seeing things come alive in the browser",
    attentionAnchor: "Deploy something the learner can share a link to by the end of Lesson 1 — social proof is the strongest reinforcement.",
  },

  ai_ml: {
    domain: "Artificial Intelligence & Machine Learning",
    teachingStyle: "conceptual-first then mathematical, intuition before formulas",
    contentEmphasis: ["visual intuition for algorithms", "Python code with sklearn/TensorFlow/PyTorch", "real-world dataset walkthroughs", "mathematical derivations clearly labeled as optional-depth"],
    toneDescriptor: "intellectually rigorous but never condescending — like a PhD who loves teaching",
    lessonFormat: "problem statement → intuition → math → code → real dataset → limitations",
    exampleStyle: "Show Python code for every algorithm. Include comments explaining WHAT each line does AND WHY. Show training curves, confusion matrices described in text.",
    vocabularyNote: "Introduce ML jargon precisely: loss function, gradient, epoch, overfitting. Never use loosely. Always tie to intuition first.",
    codeHeavy: true, termHeavy: true, mathHeavy: true, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "interpret a confusion matrix, identify overfitting from a described loss curve, choose the right algorithm for a given scenario",
    onboardingPersona: "a researcher who genuinely loves demystifying complex ideas",
    attentionAnchor: "Train a model that makes a prediction on the learner's own data in Lesson 1. Personal data creates personal investment.",
  },

  cybersecurity: {
    domain: "Cybersecurity & Ethical Hacking",
    teachingStyle: "attacker-mindset first, then defence, scenario-driven",
    contentEmphasis: ["attack scenarios with step-by-step walkthroughs", "command-line tool usage (nmap, burpsuite, metasploit)", "CVE examples", "defence countermeasures after every attack vector"],
    toneDescriptor: "methodical and serious — like a penetration tester writing a report",
    lessonFormat: "threat scenario → attack vector → exploitation demo → detection → remediation",
    exampleStyle: "Use bash/terminal code blocks for all tool commands. Include actual flags and explain each one. Always pair an attack with its defence.",
    vocabularyNote: "Use precise security terminology: payload, lateral movement, privilege escalation, zero-day. Define immediately on first use.",
    codeHeavy: true, termHeavy: true, mathHeavy: false, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "identify a vulnerability from a code snippet, choose the correct nmap flag, trace an attack kill-chain",
    onboardingPersona: "a seasoned red-team consultant who has seen every mistake",
    attentionAnchor: "Let the learner 'hack' a safe local demo environment in Lesson 1. The thrill of success is the strongest hook in security training.",
  },

  data_science: {
    domain: "Data Science & Analytics",
    teachingStyle: "story-through-data, question-first analysis",
    contentEmphasis: ["pandas/numpy/matplotlib code walkthroughs", "real public datasets (e.g. Kaggle, UCI)", "data cleaning war stories", "statistical interpretation, not just computation"],
    toneDescriptor: "curious and analytical — like a detective who uses spreadsheets as clues",
    lessonFormat: "business question → dataset exploration → cleaning → analysis → visualisation → insight",
    exampleStyle: "Every lesson includes a full mini-analysis pipeline in Python. Show df.head() outputs. Describe charts in text when images aren't possible.",
    vocabularyNote: "Use statistical and data terms precisely: distribution, variance, p-value, outlier. Never casually. Always ground in the data story.",
    codeHeavy: true, termHeavy: true, mathHeavy: true, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "interpret a described distribution, spot a data quality issue in a schema, choose the right pandas operation",
    onboardingPersona: "a data journalist who finds stories hiding in numbers",
    attentionAnchor: "Let the learner answer a real surprising question (e.g. 'which country has the most X?') using real data in Lesson 1.",
  },

  cloud: {
    domain: "Cloud Computing & DevOps",
    teachingStyle: "infrastructure-as-code mindset, diagram-then-deploy",
    contentEmphasis: ["AWS/Azure/GCP CLI and console walkthroughs", "Terraform/Docker/Kubernetes YAML blocks", "cost implications of architecture decisions", "failure modes and resiliency patterns"],
    toneDescriptor: "pragmatic and systems-thinking — like a principal SRE explaining trade-offs",
    lessonFormat: "architecture diagram described → service selection rationale → deployment code → monitoring → cost analysis",
    exampleStyle: "Include full YAML/HCL/CLI blocks. Explain every key. Show what breaks if you remove each line.",
    vocabularyNote: "Use cloud-native terms precisely: idempotency, immutable infrastructure, eventual consistency, SLA vs SLO.",
    codeHeavy: true, termHeavy: true, mathHeavy: false, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "choose the right AWS service for a scenario, spot a security misconfiguration in a policy JSON, estimate cost impact of a design choice",
    onboardingPersona: "a cloud architect who has been paged at 3am and lived to tell the tale",
    attentionAnchor: "Deploy a live URL the learner can hit from their phone by end of Lesson 1. Tangibility is everything in cloud.",
  },

  // ── MEDICINE & HEALTH ─────────────────────────────────────────────────────
  medicine: {
    domain: "Medicine & Clinical Sciences",
    teachingStyle: "case-based learning, clinical reasoning chains, pathophysiology-first",
    contentEmphasis: ["clinical vignettes with differential diagnoses", "pathophysiology mechanisms before symptoms", "diagnostic criteria (DSM-5, ICD-11, Framingham, etc.)", "pharmacology with mechanism → indication → side effects → contraindications"],
    toneDescriptor: "precise and evidence-based — like a consultant on teaching rounds who expects you to present back",
    lessonFormat: "chief complaint → pathophysiology → clinical presentation → investigations → diagnosis → management → prognosis",
    exampleStyle: "Open every lesson with a clinical vignette. Use medical eponyms correctly (Virchow's triad, Cushing's reflex). Present lab values in standard format (Na⁺: 138 mEq/L).",
    vocabularyNote: "Use full Latin/Greek medical terminology immediately. Define on first use. Never use lay terms when a medical term exists — this is professional training.",
    codeHeavy: false, termHeavy: true, mathHeavy: false, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "single best answer clinical vignettes (USMLE-style), drug mechanism matching, interpret ABG/ECG described findings",
    onboardingPersona: "a consultant physician who teaches through Socratic questioning on ward rounds",
    attentionAnchor: "Open with a clinical mystery (an undiagnosed case) that gets solved by the end of the lesson. Diagnosis as revelation is medicine's strongest reinforcement loop.",
  },

  mental_health: {
    domain: "Mental Health & Psychology",
    teachingStyle: "empathy-forward, theory-grounded, evidence-based practice",
    contentEmphasis: ["DSM-5/ICD-11 diagnostic criteria", "CBT/DBT/ACT technique walkthroughs", "case conceptualisation models", "neuroscience underpinning psychological phenomena"],
    toneDescriptor: "warm and non-judgmental but intellectually rigorous — like a clinical supervisor",
    lessonFormat: "psychological phenomenon → theoretical framework → neuroscience basis → clinical presentation → evidence-based intervention → self-reflection prompt",
    exampleStyle: "Use anonymised composite case studies. Include dialogue examples for therapeutic techniques. Reference RCT evidence where available.",
    vocabularyNote: "Use DSM-5 terminology precisely. Distinguish clinical from colloquial usage (e.g. 'depression' vs major depressive disorder).",
    codeHeavy: false, termHeavy: true, mathHeavy: false, narrativeHeavy: true, practicalHeavy: true,
    quizStyle: "identify the correct diagnosis from a vignette, choose the evidence-based intervention, distinguish adaptive from maladaptive cognitions",
    onboardingPersona: "a clinical psychologist who deeply respects both the science and the human behind the diagnosis",
    attentionAnchor: "Connect the first lesson's concept to something the learner has likely experienced personally — psychological self-recognition is the strongest hook.",
  },

  nutrition: {
    domain: "Nutrition & Dietetics",
    teachingStyle: "evidence-based debunking, biochemistry-to-plate, practical meal planning",
    contentEmphasis: ["macronutrient biochemistry (glycolysis, beta-oxidation, protein synthesis)", "evidence grades for popular nutrition claims", "portion estimation and meal planning tools", "sports nutrition and timing protocols"],
    toneDescriptor: "grounded and myth-busting — like a registered dietitian who's tired of fad diets",
    lessonFormat: "common myth → biochemical reality → evidence review → practical application → meal example",
    exampleStyle: "Include actual macro calculations. Show meal plans with gram weights. Cite systematic reviews, not anecdotes.",
    vocabularyNote: "Use biochemical terms correctly: ketogenesis, gluconeogenesis, satiety hormones. Correct lay misconceptions explicitly.",
    codeHeavy: false, termHeavy: true, mathHeavy: true, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "calculate TDEE from given parameters, identify the macronutrient composition of a meal, evaluate a nutrition claim's evidence grade",
    onboardingPersona: "a sports dietitian who works with elite athletes but translates everything for regular people",
    attentionAnchor: "Have the learner calculate their own maintenance calories in Lesson 1. Personal numbers create personal relevance.",
  },

  // ── ENGINEERING & SCIENCE ─────────────────────────────────────────────────
  engineering: {
    domain: "Engineering",
    teachingStyle: "first-principles derivation, design-before-analysis, failure-mode thinking",
    contentEmphasis: ["mathematical derivations shown step-by-step with units", "free body diagrams described in text", "material properties and selection rationale", "real engineering failures as case studies (Tacoma Narrows, Challenger, etc.)", "SI unit rigour throughout"],
    toneDescriptor: "rigorous and systematic — like a professor who marks down for missing units and sign errors",
    lessonFormat: "physical phenomenon → governing equations derived from first principles → worked example with units → design application → failure analysis",
    exampleStyle: "Every numerical example must show: given → find → assumptions → solution with units → sanity check. Never skip units. Always do an order-of-magnitude check.",
    vocabularyNote: "Use ISO/IEC/ANSI engineering terminology. Distinguish stress from strain, accuracy from precision, static from dynamic loads.",
    codeHeavy: false, termHeavy: true, mathHeavy: true, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "full worked problems requiring unit analysis, identify the failure mode in a described scenario, choose the right material for given constraints",
    onboardingPersona: "a principal engineer who has designed things that are currently flying, driving, or holding up buildings",
    attentionAnchor: "Show a dramatic engineering failure in Lesson 1 and explain exactly how the concept being taught would have prevented it. Fear of failure is engineering's greatest motivator.",
  },

  mathematics: {
    domain: "Mathematics",
    teachingStyle: "proof-intuition-application triad, visual intuition before formalism",
    contentEmphasis: ["informal intuition first, then formal proof", "multiple representations (geometric, algebraic, numerical)", "historical context for major theorems", "common errors and misconceptions explicitly addressed"],
    toneDescriptor: "precise and elegant — like a mathematician who believes beauty and rigour are the same thing",
    lessonFormat: "intuitive motivation → formal definition → theorem statement → proof (with commentary) → examples → applications → common mistakes",
    exampleStyle: "Show every algebraic step. Justify every step with the property/theorem used. Include both trivial and non-trivial examples.",
    vocabularyNote: "Use precise mathematical language: iff, WLOG, QED. Define every variable. Never be ambiguous about domain or range.",
    codeHeavy: false, termHeavy: true, mathHeavy: true, narrativeHeavy: false, practicalHeavy: false,
    quizStyle: "prove this statement, find the error in this proof, apply this theorem to this non-standard scenario",
    onboardingPersona: "a mathematician who finds more beauty in a clean proof than in anything else",
    attentionAnchor: "Show something counterintuitive that the lesson's concept explains (birthday paradox, Monty Hall, etc.). Cognitive surprise is mathematics' best hook.",
  },

  physics: {
    domain: "Physics",
    teachingStyle: "phenomena-first, mathematical modelling, thought experiment driven",
    contentEmphasis: ["Feynman-style intuitive explanations before equations", "dimensional analysis as a sanity-check tool", "famous thought experiments (twin paradox, Schrödinger's cat)", "connections between theory and experimental evidence"],
    toneDescriptor: "awe-inspiring and rigorous — like Richard Feynman if he also showed all his working",
    lessonFormat: "observable phenomenon → intuitive model → mathematical formalisation → predictions → experimental verification → broader implications",
    exampleStyle: "Derive equations from observable reality. Show dimensional analysis. Connect to real measurements (CERN, LIGO, etc.).",
    vocabularyNote: "Use standard physics notation precisely. Distinguish between mass and weight, energy and power, electric field and potential.",
    codeHeavy: false, termHeavy: true, mathHeavy: true, narrativeHeavy: true, practicalHeavy: false,
    quizStyle: "dimensional analysis of a novel expression, predict the outcome of a described experiment, derive a result from given equations",
    onboardingPersona: "a physicist who believes understanding the universe at its deepest level is the most human thing you can do",
    attentionAnchor: "Open with a phenomenon so surprising it demands explanation (GPS satellites need relativity corrections, etc.). Physics' best hook is reality being stranger than fiction.",
  },

  // ── BUSINESS & FINANCE ────────────────────────────────────────────────────
  business: {
    domain: "Business & Management",
    teachingStyle: "case-study driven, frameworks-first, decision-making focus",
    contentEmphasis: ["real company case studies (Apple, Toyota, Amazon, etc.)", "strategic frameworks (Porter's Five Forces, BCG Matrix, SWOT)", "financial implications of every strategic decision", "leadership decision narratives"],
    toneDescriptor: "authoritative and pragmatic — like a Harvard Business School professor",
    lessonFormat: "business problem → framework introduction → case application → quantitative analysis → strategic recommendation → lessons learned",
    exampleStyle: "Every framework must be applied to a real company. Include numbers when relevant. Show the decision tree, not just the outcome.",
    vocabularyNote: "Use business vocabulary precisely: NPV, burn rate, EBITDA, MOAT, pivot. Define on first use, then use freely.",
    codeHeavy: false, termHeavy: true, mathHeavy: false, narrativeHeavy: true, practicalHeavy: true,
    quizStyle: "apply a framework to a novel company scenario, identify the strategic error in a case description, calculate a basic financial metric",
    onboardingPersona: "a serial entrepreneur who has built and failed and built again, and learned from both",
    attentionAnchor: "Open with a famous business failure or surprise success and build the entire lesson around explaining it with the concept being taught.",
  },

  finance: {
    domain: "Finance & Investment",
    teachingStyle: "numbers-first, risk-aware, sceptical of narratives",
    contentEmphasis: ["financial modelling in Excel/Python shown step-by-step", "real historical market events as case studies (2008 crisis, dot-com)", "probability and expected value as core mental models", "Buffett/Dalio/Munger mental frameworks"],
    toneDescriptor: "analytical and sceptical — like a quant fund manager who trusts data over stories",
    lessonFormat: "financial concept → mathematical model → historical case → calculation walkthrough → risk analysis → portfolio application",
    exampleStyle: "Include actual calculations with real numbers. Show DCF models step by step. Use historical data points. Express returns as annualised percentages.",
    vocabularyNote: "Use finance terms with precision: alpha, beta, Sharpe ratio, duration, convexity. Never conflate price and value.",
    codeHeavy: false, termHeavy: true, mathHeavy: true, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "calculate IRR from cash flows, identify the error in a valuation, choose the appropriate hedging instrument",
    onboardingPersona: "a CFA charterholder who is equally comfortable with a Bloomberg terminal and a Berkshire Hathaway letter",
    attentionAnchor: "Show the compound interest table for $1,000 invested over 40 years in Lesson 1. Nothing hooks a finance learner faster than seeing the numbers.",
  },

  marketing: {
    domain: "Marketing & Growth",
    teachingStyle: "campaign-first, psychology-of-persuasion focused, data-driven creative",
    contentEmphasis: ["real campaign breakdowns (Nike, Oatly, Dollar Shave Club)", "consumer psychology frameworks (Cialdini's principles, Jobs-to-be-Done)", "A/B testing methodology and statistical significance", "channel-specific tactics with current platform mechanics"],
    toneDescriptor: "creative and analytical in equal measure — like a CMO who A/B tests their own emails",
    lessonFormat: "consumer insight → psychological principle → campaign example → metric framework → channel tactics → measurement",
    exampleStyle: "Deconstruct real ads and campaigns. Include copy examples. Show conversion funnel math. Reference current platform best practices.",
    vocabularyNote: "Use marketing terms precisely: CLV, CAC, NPS, attribution model, dark funnel. Distinguish brand from direct response.",
    codeHeavy: false, termHeavy: true, mathHeavy: false, narrativeHeavy: true, practicalHeavy: true,
    quizStyle: "critique a described ad campaign, calculate CAC:LTV ratio, choose the right channel for a given product/audience",
    onboardingPersona: "a growth marketer who has scaled brands from zero and knows why most campaigns fail",
    attentionAnchor: "Deconstruct an ad the learner has definitely seen before in Lesson 1. Recognition creates instant engagement.",
  },

  // ── ARTS & HUMANITIES ─────────────────────────────────────────────────────
  writing: {
    domain: "Writing & Literature",
    teachingStyle: "craft-focused, read-like-a-writer, revision-positive",
    contentEmphasis: ["close reading of published excerpts for craft analysis", "before/after revision examples", "sentence-level and structural-level technique", "genre conventions and when to break them"],
    toneDescriptor: "literary and encouraging — like a great creative writing workshop leader",
    lessonFormat: "craft principle → published example analysed → technique breakdown → imitation exercise → reflection → revision strategy",
    exampleStyle: "Quote published prose (brief, attributed) and dissect it line by line. Show rewritten versions demonstrating the principle. Celebrate good sentences.",
    vocabularyNote: "Use craft terms precisely: free indirect discourse, unreliable narrator, inciting incident, subplot. Define richly, not clinically.",
    codeHeavy: false, termHeavy: false, mathHeavy: false, narrativeHeavy: true, practicalHeavy: true,
    quizStyle: "identify the craft technique used in a given passage, revise a weak paragraph using the lesson's principle, choose the POV that best serves a described story",
    onboardingPersona: "a published author and editor who genuinely believes anyone can learn to write well",
    attentionAnchor: "Have the learner write one paragraph in Lesson 1 that uses the concept — and make it achievable enough that it will be good. Success on the first try is the strongest writing reinforcement.",
  },

  history: {
    domain: "History",
    teachingStyle: "narrative-first, causation-focused, primary source grounded",
    contentEmphasis: ["primary source quotations and analysis", "cause-and-effect chains across events", "historiographical debates (what historians disagree about)", "connections between past events and present-day relevance"],
    toneDescriptor: "storytelling and analytical — like a historian who writes books that read like thrillers",
    lessonFormat: "historical hook → context → narrative → causation analysis → primary source engagement → historiographical debate → contemporary relevance",
    exampleStyle: "Open every section with a vivid scene. Use dates and names precisely. Include at least one primary source quotation per lesson. Connect explicitly to today.",
    vocabularyNote: "Use historical terminology correctly: periodisation, historiography, contemporaneous, anachronism. Distinguish between primary and secondary sources.",
    codeHeavy: false, termHeavy: false, mathHeavy: false, narrativeHeavy: true, practicalHeavy: false,
    quizStyle: "identify the cause vs. the trigger of a historical event, evaluate the reliability of a primary source, argue a counterhistorical 'what if'",
    onboardingPersona: "a historian who believes the past is a foreign country full of people who thought they were making sensible decisions",
    attentionAnchor: "Open with the most dramatic moment of the historical period — the assassination, the betrayal, the discovery — before explaining how we got there.",
  },

  philosophy: {
    domain: "Philosophy",
    teachingStyle: "Socratic dialogue, argument-mapping, thought-experiment driven",
    contentEmphasis: ["argument reconstruction in standard form (P1, P2, C)", "thought experiments (Trolley Problem, Chinese Room, Veil of Ignorance)", "historical context of ideas alongside modern applications", "steelmanning opposing views before critiquing"],
    toneDescriptor: "intellectually rigorous and genuinely curious — like a philosopher who thinks everyone deserves to think clearly",
    lessonFormat: "philosophical puzzle → historical context → argument construction → thought experiment → objections and replies → contemporary application",
    exampleStyle: "Present every argument in standard form. Include the strongest objection. Show how the philosopher would respond. Never strawman.",
    vocabularyNote: "Use philosophical terminology precisely: deductive/inductive, a priori/a posteriori, categorical/hypothetical imperative. Define carefully.",
    codeHeavy: false, termHeavy: true, mathHeavy: false, narrativeHeavy: true, practicalHeavy: false,
    quizStyle: "identify the logical fallacy in an argument, construct a valid argument for a given conclusion, apply an ethical framework to a novel dilemma",
    onboardingPersona: "a philosopher who thinks the most important skill in the world is the ability to change your mind when presented with good arguments",
    attentionAnchor: "Start with a dilemma the learner has no immediate answer to. Intellectual discomfort is philosophy's entry point.",
  },

  // ── PERSONAL DEVELOPMENT ──────────────────────────────────────────────────
  productivity: {
    domain: "Productivity & Personal Development",
    teachingStyle: "system-design thinking, habit-science grounded, implementation-focused",
    contentEmphasis: ["neuroscience of habit formation (basal ganglia, dopamine loops)", "system walkthroughs (GTD, Zettelkasten, Time Blocking)", "implementation intentions and if-then planning", "friction reduction as the core productivity lever"],
    toneDescriptor: "practical and science-backed — like a productivity researcher who actually uses their own system",
    lessonFormat: "common productivity failure mode → neuroscience explanation → system design principle → step-by-step implementation → troubleshooting → habit stacking",
    exampleStyle: "Give specific, actionable instructions. Show template examples. Use concrete time estimates. Cite behavioural science research.",
    vocabularyNote: "Use precise behavioural science terms: implementation intention, temptation bundling, ego depletion, keystone habit. Avoid vague motivational language.",
    codeHeavy: false, termHeavy: false, mathHeavy: false, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "design a system for a described workflow, identify the friction point in a described routine, apply implementation intention format to a stated goal",
    onboardingPersona: "a productivity researcher who has read everything and only tells you what actually has evidence behind it",
    attentionAnchor: "Give the learner one specific action they can take in the next 5 minutes in Lesson 1. Immediate application is productivity training's proof of concept.",
  },

  language: {
    domain: "Language Learning",
    teachingStyle: "communicative competence first, grammar in context, spaced repetition aware",
    contentEmphasis: ["contextualised vocabulary (words in sentences, not lists)", "grammar patterns with multiple examples before rules", "cultural context for usage nuance", "phonology and pronunciation rules explicitly taught"],
    toneDescriptor: "immersive and encouraging — like a language teacher who switches into the target language before you're ready (in the best way)",
    lessonFormat: "target utterance → meaning in context → grammar pattern → pronunciation note → cultural note → practice scenarios → common errors",
    exampleStyle: "Present language in dialogue form. Include phonetic transcription for new sounds. Highlight false friends and common mistakes. Include register (formal vs. informal).",
    vocabularyNote: "Use linguistics terms where helpful: morpheme, syntax, register, aspect. Always ground in the communicative goal.",
    codeHeavy: false, termHeavy: false, mathHeavy: false, narrativeHeavy: true, practicalHeavy: true,
    quizStyle: "complete the conversation, identify the grammatical error, choose the appropriate register for a social situation",
    onboardingPersona: "a polyglot who learned six languages as an adult and knows exactly what the struggle feels like",
    attentionAnchor: "Teach the learner how to say something genuinely useful (order food, greet someone warmly) in Lesson 1 and make sure they know they could use it today.",
  },

  // ── DEFAULT / FALLBACK ────────────────────────────────────────────────────
  default: {
    domain: "General Academic Study",
    teachingStyle: "concept-first, example-rich, question-driven",
    contentEmphasis: ["clear definitions before application", "real-world examples for every concept", "common misconceptions explicitly addressed", "connections to related topics"],
    toneDescriptor: "warm, clear, and intellectually engaged — like the best teacher you ever had",
    lessonFormat: "hook question → core concept → explanation → examples → application → reflection",
    exampleStyle: "Use concrete, specific examples. Avoid abstractions without grounding. Connect every concept to something the learner can visualise.",
    vocabularyNote: "Introduce and define key terms precisely. Build vocabulary progressively. Never assume prior knowledge without checking.",
    codeHeavy: false, termHeavy: false, mathHeavy: false, narrativeHeavy: false, practicalHeavy: true,
    quizStyle: "application to novel scenarios, identify the concept illustrated by a description, explain in your own words",
    onboardingPersona: "a knowledgeable guide who is genuinely excited to share what they know",
    attentionAnchor: "Connect the very first lesson to a question the learner has probably already wondered about. Curiosity already present is the easiest kind to activate.",
  },
};

/**
 * Classifies a topic string into a SubjectProfile.
 * Uses keyword matching across the full taxonomy.
 */
export function classifySubject(topic: string): SubjectProfile {
  const t = (topic || "").toLowerCase();

  // Technology
  if (/\b(python|javascript|java|kotlin|swift|rust|golang|c\+\+|typescript|coding|programming|software|algorithm|data structure|leetcode|backend|frontend|fullstack|api|rest|graphql)\b/.test(t)) return SUBJECT_PROFILES.programming;
  if (/\b(html|css|react|vue|angular|node|web dev|website|browser|dom|sass|tailwind|next\.?js|nuxt|svelte)\b/.test(t)) return SUBJECT_PROFILES.webdev;
  if (/\b(machine learning|deep learning|neural network|nlp|computer vision|ai|artificial intelligence|llm|transformer|tensorflow|pytorch|keras|sklearn|reinforcement learning|prompt engineering)\b/.test(t)) return SUBJECT_PROFILES.ai_ml;
  if (/\b(cybersecurity|hacking|penetration|infosec|ctf|malware|exploit|vulnerability|nmap|burp|metasploit|oscp|security|encryption|cryptography)\b/.test(t)) return SUBJECT_PROFILES.cybersecurity;
  if (/\b(data science|data analysis|pandas|numpy|matplotlib|seaborn|tableau|power bi|analytics|statistics|r language|jupyter|kaggle|sql|database)\b/.test(t)) return SUBJECT_PROFILES.data_science;
  if (/\b(aws|azure|gcp|cloud|devops|docker|kubernetes|terraform|ci\/cd|serverless|microservice|devsecops|infrastructure|sre|linux|bash)\b/.test(t)) return SUBJECT_PROFILES.cloud;

  // Health & Medicine
  if (/\b(medicine|medical|clinical|anatomy|physiology|pathology|pharmacology|diagnosis|surgery|usmle|doctor|physician|nursing|patient|disease|syndrome|treatment|prescription|icu|ER|ward round)\b/.test(t)) return SUBJECT_PROFILES.medicine;
  if (/\b(psychology|mental health|therapy|cbt|dbt|counselling|psychiatry|anxiety|depression|trauma|mindfulness|cognitive|behavioural|psychotherapy|psychoanalysis)\b/.test(t)) return SUBJECT_PROFILES.mental_health;
  if (/\b(nutrition|diet|dietitian|macro|protein|carbs|fat|calorie|meal plan|supplement|food science|eating|weight loss|sports nutrition|metabol)\b/.test(t)) return SUBJECT_PROFILES.nutrition;

  // Engineering & Science
  if (/\b(engineering|mechanical|electrical|civil|structural|aerospace|chemical|control system|thermodynamics|fluid|stress|strain|statics|dynamics|circuit|signals|robotics)\b/.test(t)) return SUBJECT_PROFILES.engineering;
  if (/\b(mathematics|calculus|algebra|linear algebra|statistics|probability|topology|number theory|discrete math|real analysis|differential equation|matrix|vector|proof)\b/.test(t)) return SUBJECT_PROFILES.mathematics;
  if (/\b(physics|quantum|relativity|mechanics|electromagnetism|thermodynamics|optics|nuclear|astrophysics|cosmology|particle|wave|energy|force|motion)\b/.test(t)) return SUBJECT_PROFILES.physics;

  // Business & Finance
  if (/\b(business|management|strategy|leadership|entrepreneur|startup|marketing strategy|operations|supply chain|hr|human resource|project management|agile|scrum|consulting)\b/.test(t)) return SUBJECT_PROFILES.business;
  if (/\b(finance|investment|stock|market|trading|valuation|dcf|financial model|accounting|cfa|portfolio|hedge fund|private equity|venture capital|economics|macroeconomics)\b/.test(t)) return SUBJECT_PROFILES.finance;
  if (/\b(marketing|seo|sem|ads|social media|content|brand|growth hacking|email marketing|conversion|funnel|ecommerce|shopify|copywriting|campaign)\b/.test(t)) return SUBJECT_PROFILES.marketing;

  // Arts & Humanities
  if (/\b(writing|creative writing|fiction|non-fiction|screenwriting|poetry|novel|storytelling|editing|journalism|content writing|copywriting|narrative|prose)\b/.test(t)) return SUBJECT_PROFILES.writing;
  if (/\b(history|historical|ancient|medieval|renaissance|world war|empire|revolution|civilisation|archaeology|colonialism|historiography)\b/.test(t)) return SUBJECT_PROFILES.history;
  if (/\b(philosophy|ethics|logic|metaphysics|epistemology|political philosophy|existentialism|stoicism|kant|aristotle|plato|moral|ontology)\b/.test(t)) return SUBJECT_PROFILES.philosophy;

  // Personal Development
  if (/\b(productivity|habit|time management|focus|procrastination|deep work|gtd|second brain|note.taking|personal development|self.improvement|goal setting|morning routine)\b/.test(t)) return SUBJECT_PROFILES.productivity;
  if (/\b(language|spanish|french|mandarin|arabic|japanese|korean|german|portuguese|italian|english|linguistics|grammar|vocabulary|fluency|ielts|toefl)\b/.test(t)) return SUBJECT_PROFILES.language;

  return SUBJECT_PROFILES.default;
}

// ─────────────────────────────────────────────────────────────────────────────
// IBESTT ATTENTION PRINCIPLES (from "Teaching a Request for Attention" paper)
// Applied to digital tutoring: we treat every lesson as a "critical time period"
// opportunity — deliver reinforcement BEFORE the learner's attention wanes.
// ─────────────────────────────────────────────────────────────────────────────

const IBESTT_TEACHING_PRINCIPLES = `
## Applied Attention & Reinforcement Principles (ibestt-inspired)

These principles govern HOW content is delivered, not just WHAT is delivered:

1. **Critical Time Period Management**: Front-load the most interesting/rewarding element of each lesson. Do not make learners work through dense theory before seeing why it matters. The "hook" must land within the first 150 words of any lesson.

2. **Immediate Positive Reinforcement**: Every lesson must contain at least one moment where the learner successfully applies the concept and KNOWS they've succeeded. For code: the program runs. For medicine: the diagnosis is correct. For math: the proof holds. This success moment must be designed to happen, not left to chance.

3. **Prompt Fading**: Early lessons provide scaffolding and step-by-step guidance. Later lessons deliberately remove scaffolding, prompting the learner to reconstruct the reasoning themselves. Never keep the same level of support throughout a course.

4. **Function-Matched Reinforcement**: The type of reward must match what the learner is actually seeking. A learner seeking competence (most learners) needs to feel genuinely capable. A learner seeking status needs to see how this knowledge elevates them. The course generation prompt should identify this and match accordingly.

5. **Extinction of Passive Engagement**: Do not reinforce passive reading. Every lesson must interrupt passive consumption with an active demand: write this code, solve this problem, diagnose this case, draft this argument. The learner must DO before the lesson ends.

6. **Antecedent Structuring**: Arrange the learning environment so success is the path of least resistance. Break complex skills into sub-skills the learner can already do, then chain them. Never present a challenge that requires a prerequisite skill not yet taught.
`;

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

export function getOnboardingSystemPrompt(messagesLeft: number, topic?: string): string {
  const profile = classifySubject(topic || "");

  const urgencyNote =
    messagesLeft <= 0
      ? "This is your LAST message. Warmly signal you have enough to craft their course and express genuine excitement about what you're going to build for them."
      : messagesLeft === 1
        ? "One message left. Begin steering toward a natural conclusion — you have nearly everything you need."
        : messagesLeft <= 2
          ? "Almost done gathering. Start moving toward wrapping up — next exchange will be your last."
          : "";

  const domainFlavour: Record<string, string> = {
    "Programming & Software Development": "Ask what they've built before (even if it's small). This tells you more than their 'level' does.",
    "Medicine & Clinical Sciences": "Ask which specialty draws them most — this shapes everything about how you'll frame pathophysiology.",
    "Engineering": "Ask whether their interest is theoretical or applied — whether they want to understand or to build.",
    "Mathematics": "Ask if they've ever had a moment where maths 'clicked' — or if it never has. This shapes your entire approach.",
    "Finance & Investment": "Ask what prompted this — is it personal investing, a career move, or intellectual curiosity? The answer completely changes the course.",
    "Writing & Literature": "Ask what they've read recently that made them feel something. Their taste tells you their aspiration.",
    "History": "Ask which period or region draws them — and why now. There's always a 'why now' with history.",
    "default": "Ask what drew them to this topic right now. The motivation shapes everything about the course you'll build.",
  };

  const flavour = domainFlavour[profile.domain] || domainFlavour["default"];

  return `You are ${profile.onboardingPersona}. You are having a short, warm conversation to understand what someone wants to learn about ${profile.domain}.

Your job is ONLY to ask questions — the system will generate the course automatically. Do NOT suggest course names, outlines, or content.

Tone: ${profile.toneDescriptor}.

${flavour}

Ask a MAXIMUM of ONE question per message. Keep each response to 2–3 sentences maximum. Be specific to ${profile.domain} — not generic. You want to understand:
- What specifically within ${profile.domain} excites them
- Their genuine current level (push for honesty — most people overestimate)
- How much time they realistically have per week
- What success looks like to them personally

${urgencyNote ? `\n${urgencyNote}` : ""}

Important: Never ask more than one question at a time. Never list your questions. Have a conversation, not an intake form.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXTBOOK SEARCH QUERY GENERATION — AI-powered query expansion
// ─────────────────────────────────────────────────────────────────────────────

export function getTextbookSearchQueriesPrompt(
  topic: string,
  level: string
): string {
  const profile = classifySubject(topic);

  const levelGuidance: Record<string, string> = {
    beginner: "Include introductory and fundamentals-level queries. Prefer terms like 'introduction to', 'fundamentals', 'beginner', 'essentials'.",
    intermediate: "Include both foundational and applied queries. Prefer terms like 'applied', 'practical', 'handbook', 'guide'.",
    advanced: "Include specialised and research-level queries. Prefer terms like 'advanced', 'theory', 'analysis', 'comprehensive'.",
  };

  const domainSearchHints: Record<string, string> = {
    "Programming & Software Development": "Open libraries rarely have books on specific frameworks (React, Next.js). Broaden to the parent language or paradigm (JavaScript, web development, software engineering). Classic CS textbooks work well.",
    "Web Development": "Search for 'web design', 'HTML CSS', 'web development', 'internet programming'. Avoid framework-specific names.",
    "AI & Machine Learning": "Search for 'artificial intelligence', 'machine learning', 'statistical learning', 'neural networks', 'pattern recognition', 'data science'.",
    "Cybersecurity": "Search for 'computer security', 'network security', 'information security', 'cryptography'. Avoid tool-specific names.",
    "Data Science & Analytics": "Search for 'statistics', 'data analysis', 'probability', 'data mining'. Broader math/stats terms work best.",
    "Cloud & DevOps": "Search for 'operating systems', 'computer networks', 'systems administration', 'distributed systems'. Cloud-specific books are rare in open libraries.",
    "Medicine & Clinical Sciences": "Search for 'medicine', 'anatomy', 'physiology', 'pathology'. Standard medical textbook terms work well.",
    "Psychology & Mental Health": "Search for 'psychology', 'cognitive psychology', 'behavioural science', 'mental health', 'psychotherapy'.",
    "Engineering": "Search for 'engineering', field-specific terms like 'electrical engineering', 'mechanics', 'thermodynamics'. Textbook language is very standard.",
    "Mathematics": "Search for the exact branch: 'calculus', 'linear algebra', 'abstract algebra', 'real analysis', 'probability theory'.",
    "Finance & Investment": "Search for 'finance', 'economics', 'accounting', 'investment', 'financial analysis'.",
    "Marketing": "Search for 'marketing', 'advertising', 'consumer behaviour', 'public relations', 'business communication'.",
    "Writing & Literature": "Search for 'writing', 'rhetoric', 'composition', 'literature', 'creative writing', 'english language'.",
    "History": "Search for the specific era or region plus 'history'. General terms like 'world history', 'civilisation' also work.",
    "Philosophy": "Search for the branch: 'ethics', 'logic', 'metaphysics', 'philosophy'. Philosopher names also work as queries.",
    "default": "Use the broadest academic discipline name. Open libraries catalog books by traditional subject headings, not modern jargon.",
  };

  const hint = domainSearchHints[profile.domain] || domainSearchHints["default"];
  const levelHint = levelGuidance[level] || levelGuidance["beginner"];

  return `You are an expert research librarian specialising in ${profile.domain}. A student wants to learn "${topic}" at the "${level}" level.

Your task: generate 5-8 search queries that will find relevant textbooks in Open Library, Project Gutenberg, and Standard Ebooks.

CRITICAL RULES:
- These are OLD-SCHOOL digital libraries — they have classic textbooks, not modern tutorials
- ${hint}
- ${levelHint}
- Each query must be exactly ONE word — library search engines return the best results with a single broad keyword
- Order from most specific to broadest (first query closest to topic, last query = parent discipline)
- NEVER use branded names, framework versions, or marketing phrases
- Think: "What single word would a university librarian use to catalog this?"

Examples:
- Topic "neumorphism" → ["design", "CSS", "interface", "typography", "graphics"]
- Topic "React hooks" → ["JavaScript", "programming", "engineering", "computing"]
- Topic "machine learning" → ["intelligence", "learning", "statistics", "probability", "algorithms"]
- Topic "anxiety management" → ["anxiety", "therapy", "psychology", "psychiatry", "neuroscience"]
- Topic "stock trading" → ["investing", "finance", "economics", "markets", "trading"]
- Topic "guitar" → ["guitar", "music", "instruments", "harmony", "theory"]

Respond with ONLY a JSON array of search query strings. No explanation, no markdown.`;
}

// BOOK FILTERING PROMPT — Subject-aware selection
// ─────────────────────────────────────────────────────────────────────────────

export function getBookFilteringPrompt(
  topic: string,
  level: string,
  books: Array<{ title: string; authors: string[]; description?: string }>
): string {
  const profile = classifySubject(topic);

  const domainCriteria: Record<string, string> = {
    "Programming & Software Development": "Prefer books with practical code examples over theoretical treatments. Prioritise books written within the last 8 years unless they are foundational classics (SICP, CLRS, Pragmatic Programmer).",
    "Medicine & Clinical Sciences": "Prioritise current editions of standard medical texts (Harrison's, Robbins, Guyton). Reject books older than 10 years unless they are anatomical atlases. Clinical vignette books are highly valuable.",
    "Engineering": "Prefer books that include worked examples with units. Textbooks used in accredited engineering programmes are strongly preferred. Include at least one reference handbook if available.",
    "Mathematics": "Include at least one rigorous proof-based text and one applied/computational text if possible. Prefer books that show derivations, not just results.",
    "Finance & Investment": "Prioritise books grounded in empirical research over opinion-based investing books. Favour texts that include quantitative models.",
    "default": "Prioritise books with clear structure, practical examples, and appropriate depth for the learner's level.",
  };

  const criteria = domainCriteria[profile.domain] || domainCriteria["default"];

  return `You are an expert librarian specialising in ${profile.domain}. Select the 5 most valuable books from the list below for someone learning "${topic}" at the "${level}" level.

Domain-specific selection guidance: ${criteria}

Available books:
${books.map((b, i) => `${i + 1}. "${b.title}" by ${b.authors.join(", ")}${b.description ? ` — ${b.description}` : ""}`).join("\n")}

Selection criteria (in order of importance):
1. Direct relevance to "${topic}" specifically — not just the broader domain
2. Appropriate depth and prerequisite level for "${level}" learners
3. ${profile.contentEmphasis[0]}
4. Author credibility and accuracy in ${profile.domain}
5. Practical applicability and instructional clarity

Respond with ONLY a JSON array of 1-based indices of your top 5, ordered by relevance.
Example: [3, 7, 1, 12, 5]

If fewer than 5 books are genuinely relevant, include only those. If none are relevant: []`;
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE GENERATION PROMPT — The heart of personalisation
// Each domain generates a structurally and tonally different course
// ─────────────────────────────────────────────────────────────────────────────

export function getCourseGenerationPrompt(
  onboardingData: OnboardingData,
  bookContexts: BookContext[]
): string {
  const { topic, level, hoursPerWeek, goal, confirmedSubject } = onboardingData;
  const profile = classifySubject(confirmedSubject || topic || "");
  const subject = confirmedSubject || topic;

  const bookSummaries = bookContexts
    .map(
      (book) =>
        `### ${book.title} by ${book.authors.join(", ")}
Relevant chapters:
${book.relevantChapters.map((ch) => `- ${ch.title}: ${ch.contentSnippet.substring(0, 200)}...`).join("\n")}`
    )
    .join("\n\n");

  // ── Domain-specific content requirements ──────────────────────────────────
  const contentRequirements = buildContentRequirements(profile, level || "", hoursPerWeek || 5);

  // ── Domain-specific opening hook instruction ──────────────────────────────
  const openingHookInstruction = `
## Opening Hook Requirement (ibestt Critical Time Period Principle)
The very first lesson must open with: ${profile.attentionAnchor}
This is non-negotiable. Do not begin with definitions or history. Begin with the hook.`;

  // ── Domain-specific lesson format ─────────────────────────────────────────
  const lessonFormatInstruction = `
## Lesson Format for ${profile.domain}
Follow this sequence for every lesson: ${profile.lessonFormat}
Tone throughout: ${profile.toneDescriptor}
Example style: ${profile.exampleStyle}
${profile.codeHeavy ? "CRITICAL: Every concept explanation MUST include a working code block. No exceptions." : ""}
${profile.termHeavy ? "CRITICAL: Every lesson MUST introduce and define at least 5 domain-specific technical terms. Use them immediately after defining them." : ""}
${profile.mathHeavy ? "CRITICAL: Every mathematical claim must be accompanied by a derivation or worked example. Never state results without showing the work." : ""}
${profile.narrativeHeavy ? "CRITICAL: Every lesson must include at least one narrative element — a story, case study, or historical account that grounds the abstract in the concrete." : ""}`;

  // ── Quiz style instruction ─────────────────────────────────────────────────
  const quizInstruction = `
## Quiz Design for ${profile.domain}
Quiz questions must be of this type: ${profile.quizStyle}
For multiple choice: always include one option that represents a common misconception specific to ${profile.domain}.
For open-ended: provide a rubric that lists the specific ${profile.domain}-relevant concepts the learner must mention.`;

  return `You are an expert curriculum designer specialising in ${profile.domain}. Create a deeply personalised, non-generic course for the following learner.

## Learner Profile
- **Subject**: ${subject}
- **Topic**: ${topic}
- **Level**: ${level}
- **Weekly Time**: ${hoursPerWeek} hours
- **Goal**: ${goal}
- **Domain Teaching Style**: ${profile.teachingStyle}

## Source Materials
${bookSummaries}

## MCP Research Workflow
Before you begin writing, review the Source Materials above and treat the parsed chapters as your only verified references for this learner. Every concept in the course must link back to one of those books or chapters — cite the title and chapter when you describe an idea (e.g., "Based on Chapter X of ${bookContexts[0]?.title ?? "the parsed book"}"). Resist using general knowledge or memory: if a detail cannot be grounded in the parsed content, note that you would fetch or parse another book rather than inventing it.

## Response Role
You are producing the final course, not continuing a chat. Do not open with a greeting, a question, or an apology, and do not end with a call for clarification. Deliver only the structured Markdown outlined below, in a confident instructional tone that feels specific to this learner.

${IBESTT_TEACHING_PRINCIPLES}

${openingHookInstruction}

${lessonFormatInstruction}

${quizInstruction}
(profile, level || "" , hoursPerWeek || 5)}
## Content Requirements
${contentRequirements}

## Output Format
Generate the full course in this exact Markdown structure:

\`\`\`markdown
# Course: [Course Title — make it specific and compelling, not generic]

## Description
[2–3 sentences. Speak directly to THIS learner's goal: "${goal}". Make it feel like this course was written for them specifically.]

## Module 1: [Module Title]
[1–2 sentence module description. State what capability the learner will have by the end.]

### Lesson 1.1: [Lesson Title]
**Estimated Time**: [X] minutes
**Description**: [One sentence: the precise skill or understanding gained]

**Content**:
#### [Hook — see Opening Hook Requirement above]
[The attention-grabbing opening. Minimum 400 words. This is where you earn the learner's trust.]

#### [Subheading 2 — tailored to ${profile.domain}]
[Minimum 600 words of ${profile.teachingStyle} content. ${profile.codeHeavy ? "Include working code block." : ""} ${profile.termHeavy ? "Define and use 2–3 technical terms." : ""} ${profile.mathHeavy ? "Include derivation or worked example." : ""}]

#### [Subheading 3 — tailored to ${profile.domain}]
[Minimum 600 words. Continue the lesson format: ${profile.lessonFormat}]

#### [Subheading 4 — Application/Practice]
[Minimum 400 words. This is where the learner encounters the ibestt "success moment" — they apply the concept and succeed.]

**Key Takeaways**:
- [Specific takeaway 1 — not generic, must reference ${topic} specifically]
- [Specific takeaway 2]
- [Specific takeaway 3]

**Videos**:
[Search: "Specific YouTube search query for ${topic} at ${level} level"]
[Search: "Second specific YouTube search query"]

**Citations**:
- [Source: "Exact textbook title"] Author, A. A. (Year). *Book title*. Publisher.

**Quiz**:
\`\`\`json
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "[${profile.quizStyle.split(",")[0].trim()} question]",
    "options": ["Correct Answer", "Common misconception in ${profile.domain}", "Plausible but wrong", "Clearly incorrect"],
    "correctAnswerIndex": 0,
    "explanation": "[Why this is correct AND why each wrong option is wrong — this is where real learning happens]"
  },
  {
    "id": "q2",
    "type": "open_ended",
    "question": "[Application question requiring the learner to DO something, not just recall]",
    "correctAnswerText": "[Rubric listing the specific ${profile.domain} concepts that must be present in a correct answer]",
    "explanation": "[Model answer with commentary]"
  }
]
\`\`\`

**Exercises**:
[A specific, achievable task. Not 'research X' — give them exactly what to do, what tools to use, and what a good outcome looks like. This is the ibestt 'extinction of passive engagement' principle in action.]

### Lesson 1.2: [Continue pattern — increase complexity, reduce scaffolding slightly per ibestt prompt-fading]

## Module 2: [Continue — include as many modules as needed for the learner to achieve: ${goal}]
\`\`\`

## Non-Negotiable Quality Gates
- Every lesson must feel DIFFERENT from a generic course on this topic — it must feel like it was written specifically for someone trying to achieve "${goal}"
- ${profile.codeHeavy ? "Every concept must have a code block. A lesson without code in this domain is incomplete." : "Every concept must have a concrete example. No abstractions without grounding."}
- ${profile.termHeavy ? "Minimum 5 domain-specific technical terms per lesson, used correctly in context." : "Language must be appropriate for a " + level + " learner — not dumbed down, but not unnecessarily dense."}
- The ibestt success moment must be present in every lesson — the learner must DO something and succeed at it before the lesson ends
- Module quizzes must test application, not recall
- Include as many modules as required to genuinely achieve: "${goal}" — do not artificially cap the course`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL-AWARE GENERATION PROMPT (when MCP tools are available)
// ─────────────────────────────────────────────────────────────────────────────

export function getToolAwareGenerationPrompt(data: OnboardingData): string {
  const { topic, level, hoursPerWeek, goal, confirmedSubject } = data;
  const profile = classifySubject(confirmedSubject || topic || "");
  const subject = confirmedSubject || topic;

  const searchStrategies: Record<string, string[]> = {
    "Programming & Software Development": ["programming", "algorithms", "engineering"],
    "Medicine & Clinical Sciences": ["medicine", "pathology", "anatomy"],
    "Engineering": ["engineering", "mechanics", "thermodynamics"],
    "Mathematics": ["mathematics", "calculus", "algebra"],
    "Finance & Investment": ["finance", "economics", "investing"],
    "default": [`${topic}`.split(/\s+/)[0].toLowerCase(), `${subject}`.split(/\s+/)[0].toLowerCase(), profile.domain.split(/\s+/)[0].toLowerCase()],
  };

  const strategies = searchStrategies[profile.domain] || searchStrategies["default"];

  return `You are an expert curriculum designer in ${profile.domain} with access to MCP tools for discovering and parsing textbooks.

## Student Profile
- Topic: ${subject}
- Level: ${level}
- Weekly Time: ${hoursPerWeek} hours
- Goal: ${goal}
- Teaching Approach Required: ${profile.teachingStyle}

## Available MCP Tools

1. **discover_books**: Search across multiple sources
   - Parameters: query (string), sources (optional array: "gutendex", "openlibrary", "standard-ebooks"), limit (number)
   - Returns: books with title, authors, downloadUrl, format, source

2. **fetch_and_parse_book**: Download and parse a book
   - Parameters: url (download URL), limit_pages (number), limit_chapters (number)
   - Returns: parsed content with summary and chapters

3. **search_books**: Search via OpenLibrary
   - Parameters: query (string), keywords (optional array), limit (number)

## MCP-First Research Protocol
This is the first and only research phase before any course speculation. Do not plan modules or lessons until you have completed the steps below.
1. Run at least 3 discover_books queries (use the strategy list below plus any domain synonyms you need) and collect all promising titles. IMPORTANT: Use a SINGLE keyword per query — these are old-school library catalogs (Gutenberg, OpenLibrary) that work best with one broad term. Never send multi-word phrases.
2. For the top 4–5 discoveries, call fetch_and_parse_book to read the most relevant chapters (prioritise the first two content emphasis points) and capture the chapter titles or sections you will cite.
3. Record the chapter-level takeaways; you will reference them when you generate lessons. Do not start writing until these books are parsed, summarised, and you can point to which book/chapter supports each claim.

## Search Strategy for ${profile.domain}
Try these queries in order until you find sufficient material:
1. "${strategies[0]}"
2. "${strategies[1]}"
3. "${strategies[2]}"

If results are sparse, try broader domain terms: "${profile.domain.split(" ")[0].toLowerCase()}"

## Content Quality Requirements for ${profile.domain}
${buildContentRequirements(profile, level || "" , hoursPerWeek || 5)}

## Your Process
1. Run 2–3 discover_books queries using the strategy above
2. Parse 3–5 of the most relevant books — prioritise books that contain: ${profile.contentEmphasis.slice(0, 2).join(", ")}
3. Before you start generating any course text, ensure each parsed book has been examined: note which chapters were read and what key ideas they contain. If you need more depth, return to discover_books and fetch another volume rather than relying on unreferenced knowledge.
4. Generate the course using parsed content as the primary source material. Every fact, timeline, and recommendation must cite one of the parsed books; avoid general statements that cannot be traced back to those chapters.
5. If a learner asks for clarification, respond by referencing the same parsed content rather than inventing new details. Should a gap remain, call the MCP tools again to gather more book data.

## Hallucination Guardrail
Treat the MCP-parsed books as the authoritative corpus for this dialogue. Do not rely on personal memory, past training, or general world knowledge to fill gaps. Whenever you introduce a new technique, definition, or example, tie it to a specific chapter or page range you parsed. If you cannot locate the idea in the current books, search for another book instead of guessing.

${IBESTT_TEACHING_PRINCIPLES}

## Output Format

Generate the course in Markdown with:
- As many modules as needed to achieve: "${goal}"
- 2–5 lessons per module based on ${hoursPerWeek}hrs/week available
- Opening hook: ${profile.attentionAnchor}
- Lesson format: ${profile.lessonFormat}
- Tone: ${profile.toneDescriptor}
- ${profile.codeHeavy ? "REQUIRED: Working code block in every lesson" : "REQUIRED: Concrete domain-specific example in every lesson"}
- ${profile.termHeavy ? "REQUIRED: Minimum 5 technical terms per lesson, used in context" : ""}
- **Videos** section: \`[Search: "specific YouTube query"]\`
- **Citations** section: \`- [Source: "Exact textbook title"] Author (Year). *Title*. Publisher.\`
- **Module Quiz** immediately after last lesson of each module:

\`### Module N Quiz\`
\`\`\`json
[{"questionId":"mq-N-1","prompt":"[${profile.quizStyle.split(",")[0].trim()}]","expectedConcepts":[["concept specific to ${profile.domain}"]],"remediationTip":"Review tip pointing to specific lesson section."}]
\`\`\`

## Hard Requirements
- Every lesson must contain the ibestt "success moment" — a point where the learner applies the concept and succeeds
- ${profile.codeHeavy ? "No lesson is complete without a code block — this is a coding domain" : "No lesson is complete without a worked example or case study"}
- Quiz questions must test application in ${profile.domain}, not passive recall
- The course must feel written specifically for someone trying to achieve "${goal}" — not for a generic learner of ${topic}

Be autonomous — use tools without asking. If a parse fails, try another book.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT GENERATION FROM CONVERSATION
// ─────────────────────────────────────────────────────────────────────────────

export function getSubjectFromConversationPrompt(conversationText: string): string {
  return `Based on the following conversation between a tutor AI and a learner, generate a specific, compelling course title (4–8 words).

Conversation:
${conversationText}

Rules:
- Make it specific to what THIS learner wants, not a generic topic name
- Use the learner's own goal language where possible
- It should feel like a course someone would actually pay for
- NOT "Introduction to X" — that's generic. Instead: "X for [specific outcome]" or "Mastering X: [specific focus]"

Examples of GOOD titles:
- "Clinical Reasoning for Final-Year Medical Students"
- "Python for Data Journalists: From Spreadsheets to Stories"
- "Roman History: The Collapse of the Republic"
- "Structural Engineering: Why Bridges Fail and How to Prevent It"

Examples of BAD titles (too generic):
- "Introduction to Python"
- "Learn Mathematics"
- "Business Fundamentals"

Generate ONLY the course title. Nothing else.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING DATA EXTRACTION FROM CONVERSATION
// ─────────────────────────────────────────────────────────────────────────────

export function getOnboardingDataExtractionPrompt(conversationText: string): string {
  return `Extract learning preferences from the following conversation. Return ONLY a valid JSON object — no markdown, no preamble, no explanation.

Conversation:
${conversationText}

Return exactly this shape:
{
  "level": "beginner" | "intermediate" | "advanced",
  "hoursPerWeek": <number between 1-40>,
  "goal": "<specific, personalised goal string — use the learner's own words where possible, minimum 10 words>"
}

Inference rules:
- If level is unclear: infer from vocabulary used, questions asked, and experience described
- If hoursPerWeek is not stated: infer from context (working professional → 3–5, student → 10–15, intensive → 20+)
- Goal must be specific to what THIS learner said — not a generic placeholder like "build practical skills"
- If the learner mentioned a specific project, job, exam, or outcome — use that as the goal

Defaults only if truly nothing can be inferred: level="beginner", hoursPerWeek=5, goal="develop foundational understanding and practical skills in this subject"`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build domain-specific content requirements string
// ─────────────────────────────────────────────────────────────────────────────

function buildContentRequirements(
  profile: SubjectProfile,
  level: string,
  hoursPerWeek: number
): string {
  const levelGuidance = {
    beginner: `Start from absolute fundamentals. Assume NO prior knowledge. Every term must be defined. Build confidence before complexity. The ibestt principle: ensure the learner can SUCCEED at the first exercise — do not let the first active task be too hard.`,
    intermediate: `Assume foundational vocabulary is known. Do NOT re-explain basics. Focus on deepening understanding, edge cases, and professional-grade application. Challenge assumptions the learner may have formed from introductory material.`,
    advanced: `Assume strong domain knowledge. Focus on nuance, optimisation, frontier concepts, and mastery-level application. Reference primary literature. Expect the learner to engage with complexity and ambiguity.`,
  };

  const timeGuidance =
    hoursPerWeek <= 3
      ? "Design for efficiency: fewer, higher-impact lessons. Ruthlessly prioritise the 20% of content that delivers 80% of the value."
      : hoursPerWeek <= 7
        ? "Standard pacing: thorough coverage of fundamentals and key applications. Include optional depth sections for curious learners."
        : "Deep immersion pacing: include comprehensive coverage, optional advanced sections, and project-based learning. The learner has time — use it.";

  return `
### Learner Level: ${level}
${levelGuidance[level as keyof typeof levelGuidance] || levelGuidance.beginner}

### Time Commitment: ${hoursPerWeek} hours/week
${timeGuidance}

### Domain Content Requirements for ${profile.domain}:
${profile.contentEmphasis.map((e, i) => `${i + 1}. ${e}`).join("\n")}

### Vocabulary Standard:
${profile.vocabularyNote}

### Example Standard:
${profile.exampleStyle}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// LESSON ASSISTANT SYSTEM PROMPT — Subject-aware, Socratic AI tutor
// ─────────────────────────────────────────────────────────────────────────────

export function getAssistantSystemPrompt(opts: {
  lessonTitle: string;
  lessonContent: string;
  courseTitle: string;
  courseSubject: string;
  courseLevel: string;
  moduleName?: string;
}): string {
  const profile = classifySubject(opts.courseSubject);

  const levelBehaviour: Record<string, string> = {
    beginner: "The student is a beginner. Use simple language, define every term on first use, and build confidence. Never assume prior knowledge. Celebrate small wins.",
    intermediate: "The student is intermediate. You can use domain vocabulary freely but still clarify nuance. Challenge them to think deeper — don't just hand answers over.",
    advanced: "The student is advanced. Engage at a peer level. Reference edge cases, trade-offs, and nuances. Push them to reason through problems themselves.",
  };

  const subjectBehaviour: string[] = [];
  if (profile.codeHeavy) subjectBehaviour.push("When explaining concepts, include short code snippets. Show input AND output.");
  if (profile.mathHeavy) subjectBehaviour.push("Show derivations step-by-step. Never skip steps — each line should follow logically from the last.");
  if (profile.practicalHeavy) subjectBehaviour.push("Ground every explanation in a real-world example the student can relate to.");
  if (profile.termHeavy) subjectBehaviour.push("When using technical terms, define them inline on first use (e.g., **term** — definition).");
  if (profile.narrativeHeavy) subjectBehaviour.push("Use brief stories, analogies, or historical context to make concepts stick.");

  // Truncate lesson content to keep context window focused
  const maxContentLen = 3000;
  const lessonSnippet = opts.lessonContent.length > maxContentLen
    ? opts.lessonContent.slice(0, maxContentLen) + "\n\n[...truncated for brevity]"
    : opts.lessonContent;

  return `You are a world-class ${profile.domain} tutor — ${profile.toneDescriptor}. You are deeply passionate about helping students truly understand, not just memorize.

## Your Teaching Philosophy
1. **Understand first, answer second.** When a question is vague ("I don't get this"), ask ONE focused clarifying question before explaining.
2. **Guide, don't lecture.** When a student is wrong, ask "What would happen if…?" rather than just correcting. Lead them to the insight.
3. **Build mental models.** Use analogies, diagrams-in-words, and connections to things the student already knows. Great tutors make the complex feel obvious.
4. **One concept, fully explained.** Don't skim five things — nail one. If the question touches multiple ideas, address the core one thoroughly and offer to continue.
5. **Check understanding naturally.** End with a brief question: "Does that make sense?" or "How would you apply this to…?"

## Response Quality
- **Match response length to the question.** Simple questions get short answers. "Explain how X works" deserves a thorough walkthrough (200-400 words). Code questions deserve working examples.
- **Structure for clarity.** Use bullet points, numbered steps, short paragraphs, and headers for longer explanations.
- **Use markdown well**: **bold** key terms, \`code\` for inline references, fenced blocks for code examples with comments.
- **Add value beyond the lesson.** Don't repeat what's in the lesson — give fresh angles, new examples, deeper reasoning, common mistakes, or real-world context.
- **Be warm and encouraging.** A good tutor makes students feel smart, not stupid. Acknowledge good questions. Normalize confusion.

## Subject-Specific Behaviour
${subjectBehaviour.length > 0 ? subjectBehaviour.map(s => `- ${s}`).join("\n") : "- Use concrete, specific examples for every explanation."}

## Student Level
${levelBehaviour[opts.courseLevel] || levelBehaviour.beginner}

## Context
Course: "${opts.courseTitle}"
${opts.moduleName ? `Module: "${opts.moduleName}"` : ""}
Lesson: "${opts.lessonTitle}"

### Lesson Content (reference only — use to ground your answers, do NOT recite back):
${lessonSnippet}`;
}
