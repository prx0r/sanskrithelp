"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MultipleChoiceQuiz, type MCQuestion } from "@/components/MultipleChoiceQuiz";
import { LessonPracticeSection } from "@/components/LessonPracticeSection";

const READING_QUIZ_QUESTIONS: MCQuestion[] = [
  {
    id: "1",
    question: "What is the first step when reading a Sanskrit sentence?",
    options: ["Identify compounds", "Parse case endings", "Resolve sandhi at word boundaries", "Find the verb"],
    correctIndex: 2,
    explanation: "First undo sandhi to split the continuous string into words. Then identify compounds, parse cases, conjugate the verb.",
  },
  {
    id: "2",
    question: "What does -aḥ + a- become in sandhi?",
    options: ["-aḥ a-", "-ā-", "-o ऽ- (avagraha)", "-r-"],
    correctIndex: 2,
    explanation: "नरः अपगच्छति → नरो ऽपगच्छति. The avagraha marks the elided initial a-.",
  },
  {
    id: "3",
    question: "In यः... सः yaḥ... saḥ, what is the structure?",
    options: ["Two independent sentences", "Relative-correlative clause", "Compound noun", "Quoted speech"],
    correctIndex: 1,
    explanation: "Relative (य-) introduces a clause; correlative (स-) continues the main clause. 'Who... he'.",
  },
  {
    id: "4",
    question: "Sanskrit word order is:",
    options: ["Strictly subject-verb-object", "Flexible — case endings define roles", "Always verb-first", "Random"],
    correctIndex: 1,
    explanation: "Word order is free. Case endings, not position, indicate syntactic role.",
  },
  {
    id: "5",
    question: "Where are compound verbs often listed in dictionaries?",
    options: ["Under the preverb", "Under the root of the simple verb", "In a separate section", "Alphabetically by first letter"],
    correctIndex: 1,
    explanation: "अवगच्छति → look under √गम्. Compound verbs are sub-entries under the root.",
  },
  {
    id: "6",
    question: "When parsing a sentence, the verb tells you:",
    options: ["Only tense", "What happens (action, tense, voice)", "Only the subject", "Nothing — skip it"],
    correctIndex: 1,
    explanation: "The verb is the core. It tells you the action, tense, voice, person, number.",
  },
  {
    id: "7",
    question: "The postposition च 'and' typically:",
    options: ["Stands at the start of the sentence", "Follows the word it modifies", "Is never used", "Replaces the verb"],
    correctIndex: 1,
    explanation: "Postposed = placed after. गच्छति भरति च = 'he goes and carries'.",
  },
  {
    id: "8",
    question: "Which texts are planned for the Reading section?",
    options: ["Only Rāmāyaṇa", "Bhagavad Gītā, Hitopadeśa, Rāmāyaṇa, Manusmṛti", "Only grammar texts", "None"],
    correctIndex: 1,
    explanation: "Planned: Bhagavad Gītā, Hitopadeśa, Rāmāyaṇa, Manusmṛti — with glosses and vocabulary.",
  },
];

const READING_LESSONS: Array<{
  title: string;
  body: string[];
  technicalNote?: string;
  nutshell?: string;
  reviewQuestions?: string[];
}> = [
  {
    title: "1) The Challenge of Reading Sanskrit",
    body: [
      "Sanskrit texts are written in continuous script. Words merge at their boundaries through sandhi. There are no spaces between words in traditional editions. A beginner seeing नरो ऽपगच्छति may not immediately recognise नरः अपगच्छति 'The man goes away' — the visarga has changed to -o, the initial a- is marked by avagraha ऽ.",
      "Furthermore, compounds can be very long. A single 'word' may contain four or five members. Verbs may be separated from their objects by intervening clauses. The solution: a systematic approach. Work through each challenge in order: script, sandhi, compounds, syntax.",
    ],
    nutshell: "No word spaces. Sandhi merges words. Long compounds. Systematic parsing is essential.",
    reviewQuestions: ["Why is Sanskrit hard to read for beginners?", "What merges at word boundaries?"],
  },
  {
    title: "2) Step One: Resolve Sandhi",
    body: [
      "Before you can identify words, you must undo sandhi. Where does one word end and the next begin? A final -ṃ before a consonant suggests the previous word ended in -m. A final -ḥ before a vowel may become -r or disappear (with vowel changes). A consonant cluster at a boundary may need to be split.",
      "Use the Sandhi section as reference. Common patterns: -aḥ + a- → -o ऽ-; -t + vowel → -d; -n + voiced consonant → various. Keep a sandhi table handy. With practice, you will recognise boundaries by the shapes of allowed word-final and word-initial sequences.",
    ],
    technicalNote: "Some editions mark sandhi boundaries with a dot (·) or space. Critical editions often normalise spelling. Manuscripts may differ. Learn the standard sandhi rules first.",
    nutshell: "First step: split the continuous string into words. Undo external sandhi at boundaries.",
    reviewQuestions: ["What does -aḥ + a- become?", "What is the first step in reading a Sanskrit sentence?"],
  },
  {
    title: "3) Step Two: Identify Compounds",
    body: [
      "Once you have candidate words, ask: is this one word or several stems in a compound? राजपुत्रः could be राज-पुत्रः 'prince' (one compound) or राजं पुत्रः 'the king, the son' (two words) — though the latter would usually show different sandhi. Length is a clue: very long 'words' are often compounds.",
      "Split the compound into its members. Identify the type (tatpuruṣa, bahuvrīhi, etc.). Find the head. If it is a bahuvrīhi, the head is external — the compound agrees with an explicit or implied noun.",
    ],
    nutshell: "Second step: identify compound structure. Split, type, find head.",
    reviewQuestions: ["What makes you suspect a long word is a compound?", "What is the head of a bahuvrīhi?"],
  },
  {
    title: "4) Step Three: Parse Case Endings",
    body: [
      "Each nominal form has a case ending. Map it to a kāraka: nominative → kartṛ (usually); accusative → karman; instrumental → karaṇa or passive agent; dative → sampradāna; ablative → apādāna; locative → adhikaraṇa. Genitive expresses possession or relation.",
      "Find the verb. Who does it? (kartṛ, nominative.) What is affected? (karman, accusative.) With what? (karaṇa, instrumental.) To whom? (sampradāna, dative.) From where? (apādāna, ablative.) Where? (adhikaraṇa, locative.)",
    ],
    nutshell: "Third step: match each noun to a kāraka. Case → semantic role.",
    reviewQuestions: ["What case typically marks the object?", "How do you find the agent?"],
  },
  {
    title: "5) Step Four: Conjugate the Verb",
    body: [
      "Identify the verb form: root, tense, voice, person, number. Is it finite or participle? If it is a participle, it may function as the main verb — 'having done X, he...' — or as an adjective. Absolutives (त्वा, य) typically express a prior action: कृत्वा 'having done'.",
      "The verb tells you what happens. The nominative (and any passive agent in instrumental) tells you who. The accusative tells you what. Fit the pieces together. Often the verb comes at the end of the clause or sentence; the subject may be at the beginning.",
    ],
    nutshell: "Fourth step: identify verb (root, tense, voice). Participles may be main verbs.",
    reviewQuestions: ["What can an absolutive express?", "Where does the verb often appear in a Sanskrit sentence?"],
  },
  {
    title: "6) Relative and Correlative Clauses",
    body: [
      "Sanskrit favours relative-correlative structures: यः... सः yaḥ... saḥ 'who... he', यत्... तत् yat... tat 'what... that'. The relative (य-) introduces a clause; the correlative (स-/तद्-) continues the main clause. यो रामं पश्यति सः सुखी 'Who sees Rāma, he is happy'.",
      "The relative clause often comes first. The correlative may be in the same case as the relative, or different, depending on its role in the main clause. Learn to spot य- and तद्-/स- pairs.",
    ],
    technicalNote: "Relative pronouns in Sanskrit: यद् (neut.), या (fem.), यः (masc.). Correlative: तद्, सा, सः. They can embed: 'who... who... he' for nested relatives.",
    nutshell: "यः... सः = who... he. Relative clause first, correlative in main clause.",
    reviewQuestions: ["What is a relative-correlative structure?", "Which usually comes first?"],
  },
  {
    title: "7) Word Order and Poetic License",
    body: [
      "Sanskrit word order is flexible. Subject, object, verb can appear in many arrangements. Poetry often inverts for metre or emphasis. Expect the unexpected. The case endings, not the position, tell you the syntactic role.",
      "Postpositions (च 'and', तु 'but', हि 'indeed', अपि 'also') typically follow the word they modify. इत्युवाच iti uvāca 'thus he said' — iti marks direct speech or quotation, and usually follows the quoted material.",
    ],
    nutshell: "Word order is free. Case endings define roles. Postpositions follow their word.",
    reviewQuestions: ["Why can't you rely on word order in Sanskrit?", "What does iti typically mark?"],
  },
  {
    title: "8) Vocabulary and Dictionaries",
    body: [
      "Build vocabulary systematically. When you meet a new word, note its root (if verbal), its stem type (a-, ā-, consonant), and its meaning. Many nouns are derived from roots — knowing the root helps. Use a learner's dictionary (e.g. Macdonell, Apte) or online resources.",
      "Compound verbs (preverb + root) are listed under the root in many dictionaries. अव-√गम् 'to understand' → look under √गम्. Some forms are irregular; a good dictionary will list them.",
    ],
    nutshell: "Learn roots and stems. Dictionaries list compounds under the root. Note irregulars.",
    reviewQuestions: ["Where do you look up अवगच्छति in a typical dictionary?", "What should you note when learning a new word?"],
  },
  {
    title: "9) Reading Passages — What to Expect",
    body: [
      "Early readings should be short and heavily annotated. Each verse or sentence may have several compounds, several case forms, and perhaps a relative-correlative. Work through word by word. Split compounds. Resolve sandhi. Identify each form.",
      "As you progress, try less annotated texts. Use a commentary if available — traditional commentators (ācāryas) unpack compounds and explain syntax. Editions with word-by-word analysis (e.g. the Rāmāyaṇa or Mahābhārata with Sanskrit commentary) are valuable.",
    ],
    nutshell: "Start annotated. Progress to commentaries. Work word by word.",
    reviewQuestions: ["What should early readings include?", "What do traditional commentators provide?"],
  },
  {
    title: "10) Planned Readings & Next Steps",
    body: [
      "This app plans reading sections for: Bhagavad Gītā (key verses, dharma and philosophy), Hitopadeśa (prose fables, compound-heavy), Rāmāyaṇa selections (narrative verse), Manusmṛti (dharma text). Each will offer glossed verses with sandhi splits and vocabulary.",
      "Until then, use external resources: GRETIL, SARIT, or printed editions with commentaries. The skills you have built — pratyāhāras, phonetics, sandhi, gradation, suffixes, kārakas, verbs, compounds — all come together in reading. Practice daily. सा विद्या या विमुक्तये — that knowledge is true which liberates.",
    ],
    nutshell: "Apply all skills to real texts. Bhagavad Gītā, Hitopadeśa, Rāmāyaṇa — coming soon.",
    reviewQuestions: ["What texts are planned for the Reading section?", "What resources can you use in the meantime?"],
  },
];

export default function ReadingPage() {
  const [lessonStep, setLessonStep] = useState(0);
  const [showTechnical, setShowTechnical] = useState<Record<number, boolean>>({});

  const lesson = READING_LESSONS[lessonStep];
  const canNext = lessonStep < READING_LESSONS.length - 1;
  const canPrev = lessonStep > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reading Real Texts</h1>
          <p className="text-muted-foreground">
            From sandhi to syntax. Ten lessons on how to read Sanskrit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/learn/compounds/" className="text-sm text-primary hover:underline">← Compounds</Link>
          <span className="text-muted-foreground">|</span>
          <Link href="/learn/" className="text-sm text-primary hover:underline">Learn index</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {READING_LESSONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setLessonStep(i)}
            className={cn(
              "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
              lessonStep === i ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          <div className="space-y-4">
            {lesson.body.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
            ))}
          </div>
          {lesson.technicalNote && (
            <div className="border-t border-border pt-4">
              <button
                onClick={() => setShowTechnical((s) => ({ ...s, [lessonStep]: !s[lessonStep] }))}
                className="text-sm font-medium text-primary hover:underline"
              >
                {showTechnical[lessonStep] ? "Hide" : "Show"} technical note
              </button>
              {showTechnical[lessonStep] && (
                <p className="mt-2 text-sm text-muted-foreground italic">{lesson.technicalNote}</p>
              )}
            </div>
          )}
          {lesson.nutshell && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">The nutshell</p>
              <p className="text-sm font-medium text-foreground">{lesson.nutshell}</p>
            </div>
          )}
          {lesson.reviewQuestions && (
            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Review questions</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {lesson.reviewQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      <LessonPracticeSection
        title="Practice"
        description="Multiple choice quiz on reading strategies, sandhi, and parsing."
      >
        <MultipleChoiceQuiz
          questions={READING_QUIZ_QUESTIONS}
          title="Reading Quiz"
          shuffleQuestions
          shuffleOptions
          showProgress
        />
      </LessonPracticeSection>

      <div className="flex justify-between">
        <button
          onClick={() => setLessonStep((s) => Math.max(0, s - 1))}
          disabled={!canPrev}
          className={cn("text-primary hover:underline", !canPrev && "opacity-50 cursor-not-allowed")}
        >
          ← Previous lesson
        </button>
        <button
          onClick={() => setLessonStep((s) => Math.min(READING_LESSONS.length - 1, s + 1))}
          disabled={!canNext}
          className={cn("text-primary hover:underline", !canNext && "opacity-50 cursor-not-allowed")}
        >
          Next lesson →
        </button>
      </div>
    </div>
  );
}
