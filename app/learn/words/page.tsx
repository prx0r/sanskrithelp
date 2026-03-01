"use client";

import { useState } from "react";
import Link from "next/link";
import dhatusData from "@/data/dhatus.json";
import wordsData from "@/data/words.json";
import { cn } from "@/lib/utils";
import { ZoneGate } from "@/components/ZoneGate";
import { MultipleChoiceQuiz, type MCQuestion } from "@/components/MultipleChoiceQuiz";
import { LessonPracticeSection } from "@/components/LessonPracticeSection";

type DerivedForm = { form: string; devanagari: string; suffix: string; meaning: string; category: string };
type Dhatu = { id: string; devanagari: string; iast: string; meaning: string; derivedForms: DerivedForm[] };
type StandaloneWord = { iast: string; devanagari: string; meaning: string; root?: string | null };
const dhatus = dhatusData as Dhatu[];
const standaloneWords = wordsData as StandaloneWord[];

const WORDS_LESSONS: Array<{
  title: string;
  body: string[];
  technicalNote?: string;
  nutshell?: string;
  reviewQuestions?: string[];
}> = [
  {
    title: "1) Roots → Words",
    body: [
      "You've seen roots (Dhātus): √भू 'to be', √कृ 'to do', √गम् 'to go'. Roots never appear alone in a sentence. Words do. A word is a root plus morphology — suffix, guṇa, sandhi — in a form you actually encounter in texts.",
      "This section bridges roots and grammar. One root yields many words: √गम् → गच्छति 'he goes', गम 'going', गम्य 'attainable', आगत 'come'. Learning words means learning these families. When you see गच्छति in a verse, you recognise it as 'go' and trace it back to √गम्.",
    ],
    nutshell: "Root = seed. Word = root + morphology. One root → many words.",
    reviewQuestions: ["Why don't roots appear in sentences?", "What is the relationship between a root and its words?"],
  },
  {
    title: "2) Word Families",
    body: [
      "Each root has a word family — the set of forms derived from it. √कृ gives करोति (verb), कृत (participle), कर्तृ (agent), कार्य (gerundive), क्रिया (abstract noun). √भू gives भवति, भूत, भव, भवन्.",
      "Memorising word families helps you parse. If you know कर्तृ = doer, you'll spot it in compounds. If you know कृत = done, you'll recognise it as a past participle. The table below groups our vocabulary by root.",
    ],
    nutshell: "One root → verb, participle, agent noun, abstract noun, gerundive. Learn families.",
    reviewQuestions: ["Name four words from √कृ.", "Why is it useful to learn word families?"],
  },
  {
    title: "3) Verbs, Nouns, Participles",
    body: [
      "Verbs: finite forms with person and tense. भवति 'he is', करोति 'he does', गच्छति 'he goes'. These are the main predicates of sentences. Nouns and adjectives: abstract nouns (भव, क्रिया), agent nouns (कर्तृ, नेतृ), participles (भूत, कृत), gerundives (गम्य, कार्य).",
      "When reading, identify the verb first — it tells you what happens. Then fit the nominals (nouns, participles) into the sentence. Participles often function as adjectives or substitute for finite verbs.",
    ],
    nutshell: "Verb = predicate. Nouns/participles = arguments or modifiers. Identify the verb first.",
    reviewQuestions: ["What type of word is भवति?", "What type of word is कृत?"],
  },
  {
    title: "4) High-Frequency Words",
    body: [
      "Some words appear constantly: कर्तृ (doer), कर्म (action), भवति (is), गच्छति (goes), पश्यति (sees), जानाति (knows). Learn these early. Standalone nouns like नर (man), वन (forest), गज (elephant), गृह (house) also recur.",
      "We combine root-derived vocabulary (from our Dhātus) with a small set of common standalone nouns. Together they form the core vocabulary for early reading.",
    ],
    nutshell: "Focus on high-frequency verbs and common nouns. They unlock most sentences.",
    reviewQuestions: ["Name three high-frequency verbs.", "What does गज mean?"],
  },
  {
    title: "5) Using Words in Context",
    body: [
      "Words gain meaning in context. कृत can mean 'done' as a participle or 'deed' as a noun. भूत can mean 'been' or 'ghost'. ज्ञान is 'knowledge'. The same root produces different nuances; the sentence tells you which.",
      "When you meet a new word, note: (1) the form (Devanagari, IAST), (2) the meaning in context, (3) the root if you can spot it. Linking words to roots strengthens memory.",
    ],
    nutshell: "Context disambiguates. Note form, meaning, root when learning.",
    reviewQuestions: ["What two meanings can भूत have?", "What should you note when learning a new word?"],
  },
  {
    title: "6) The Nutshell",
    body: [
      "Words = roots in real form. Learn word families (root → verb, participle, agent, abstract, gerundive). Identify the verb first when reading. Build a core vocabulary from our roots plus common nouns. Proceed to Suffixes to see how roots become words through kṛt and taddhita suffixes.",
    ],
    nutshell: "Words bridge roots and grammar. Learn families; build vocabulary. Next: Suffixes.",
    reviewQuestions: ["What comes after Words in the learning path?", "How do words relate to suffixes?"],
  },
];

const WORD_QUIZ_QUESTIONS: MCQuestion[] = [
  { id: "1", question: "भवति bhavati means:", options: ["he goes", "he is", "he does", "he speaks"], correctIndex: 1, explanation: "भवति from √भू 'to be' — 3rd sg present." },
  { id: "2", question: "गच्छति gacchati means:", options: ["he stands", "he goes", "he sees", "he hears"], correctIndex: 1, explanation: "गच्छति from √गम् 'to go'." },
  { id: "3", question: "कर्तृ kartṛ means:", options: ["action", "done", "doer", "to be done"], correctIndex: 2, explanation: "कर्तृ = agent noun from √कृ. The doer." },
  { id: "4", question: "Which root gives गच्छति?", options: ["√भू", "√गम्", "√कृ", "√वच्"], correctIndex: 1, explanation: "√गम् 'to go' → गच्छति." },
  { id: "5", question: "कृत kṛta means:", options: ["doer", "action", "done, made", "to be done"], correctIndex: 2, explanation: "कृत = past participle from √कृ. 'Having been done'." },
  { id: "6", question: "What does गज gaja mean?", options: ["house", "forest", "elephant", "book"], correctIndex: 2, explanation: "गज = elephant. Common standalone noun." },
  { id: "7", question: "पश्यति paśyati means:", options: ["he hears", "he sees", "he knows", "he stands"], correctIndex: 1, explanation: "पश्यति from √दृश् 'to see'." },
  { id: "8", question: "ज्ञान jñāna means:", options: ["known", "to know", "knowledge", "he knows"], correctIndex: 2, explanation: "ज्ञान from √ज्ञा 'to know' — abstract noun." },
];

const WORD_RECOGNITION_QUESTIONS: MCQuestion[] = [
  { id: "r1", question: "What does भवति (bhavati) mean?", options: ["he goes", "he is", "he does", "he speaks"], correctIndex: 1, explanation: "From √भू. 3rd sg present." },
  { id: "r2", question: "What does गच्छति (gacchati) mean?", options: ["he stands", "he goes", "he sees", "he hears"], correctIndex: 1, explanation: "From √गम्." },
  { id: "r3", question: "What does करोति (karoti) mean?", options: ["he is", "he goes", "he does", "he knows"], correctIndex: 2, explanation: "From √कृ." },
  { id: "r4", question: "What does पश्यति (paśyati) mean?", options: ["he hears", "he sees", "he leads", "he obtains"], correctIndex: 1, explanation: "From √दृश्." },
  { id: "r5", question: "What does शृणोति (śṛṇoti) mean?", options: ["he speaks", "he stands", "he hears", "he knows"], correctIndex: 2, explanation: "From √श्रु." },
  { id: "r6", question: "What does जानाति (jānāti) mean?", options: ["he leads", "he obtains", "he knows", "he sees"], correctIndex: 2, explanation: "From √ज्ञा." },
  { id: "r7", question: "What does तिष्ठति (tiṣṭhati) mean?", options: ["he goes", "he stands", "he does", "he hears"], correctIndex: 1, explanation: "From √स्था." },
  { id: "r8", question: "What does नयति (nayati) mean?", options: ["he obtains", "he leads", "he sees", "he is"], correctIndex: 1, explanation: "From √नी." },
];

export default function WordsPage() {
  const [lessonStep, setLessonStep] = useState(0);
  const [showTechnical, setShowTechnical] = useState<Record<number, boolean>>({});

  const lesson = WORDS_LESSONS[lessonStep];
  const canNext = lessonStep < WORDS_LESSONS.length - 1;
  const canPrev = lessonStep > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Words — Root to Vocabulary</h1>
          <p className="text-muted-foreground">
            Roots in real form. Word families from our Dhātus plus common nouns. Bridge to reading.
          </p>
          <div className="mt-3">
            <ZoneGate zoneId="words" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/learn/roots/" className="text-sm text-primary hover:underline">← Dhātus</Link>
          <span className="text-muted-foreground">|</span>
          <Link href="/learn/suffixes/" className="text-sm text-primary hover:underline">Suffixes →</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {WORDS_LESSONS.map((_, i) => (
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

          {/* Word families table */}
          <div className="overflow-x-auto border-t border-border pt-4">
            <h3 className="font-medium mb-3">Word families from our roots</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium">Root</th>
                  <th className="text-left py-2 font-medium">Word</th>
                  <th className="text-left py-2 font-muted-foreground">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {dhatus.flatMap((d) =>
                  d.derivedForms.slice(0, 3).map((f) => (
                    <tr key={`${d.id}-${f.form}`} className="border-b border-border/50">
                      <td className="py-2">
                        <span className="font-mono">√{d.iast}</span>
                        <span className="ml-1" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{d.devanagari}</span>
                      </td>
                      <td className="py-2">
                        <span className="font-mono">{f.form}</span>
                        <span className="ml-1 text-lg" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{f.devanagari}</span>
                      </td>
                      <td className="py-2 text-muted-foreground">{f.meaning}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Standalone nouns */}
          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-3">Common standalone nouns</h3>
            <div className="flex flex-wrap gap-3">
              {standaloneWords.map((w) => (
                <div key={w.iast} className="px-4 py-2 rounded-lg border border-border bg-muted/30">
                  <span className="font-mono">{w.iast}</span>
                  <span className="ml-2 text-lg" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{w.devanagari}</span>
                  <span className="ml-2 text-muted-foreground">— {w.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LessonPracticeSection
        title="Practice"
        description="Quiz on word meanings and root identification. Word recognition drill."
      >
        <div className="space-y-6">
          <MultipleChoiceQuiz
            questions={WORD_QUIZ_QUESTIONS}
            title="Word Quiz"
            shuffleQuestions
            shuffleOptions
            showProgress
          />
          <MultipleChoiceQuiz
            questions={WORD_RECOGNITION_QUESTIONS}
            title="Word recognition"
            shuffleQuestions
            shuffleOptions
            showProgress
          />
        </div>
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
          onClick={() => setLessonStep((s) => Math.min(WORDS_LESSONS.length - 1, s + 1))}
          disabled={!canNext}
          className={cn("text-primary hover:underline", !canNext && "opacity-50 cursor-not-allowed")}
        >
          Next lesson →
        </button>
      </div>

    </div>
  );
}
