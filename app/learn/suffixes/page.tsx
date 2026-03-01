"use client";

import { useState } from "react";
import Link from "next/link";
import dhatusData from "@/data/dhatus.json";
import { cn } from "@/lib/utils";
import { ZoneGate } from "@/components/ZoneGate";
import { MultipleChoiceQuiz, type MCQuestion } from "@/components/MultipleChoiceQuiz";
import { LessonPracticeSection } from "@/components/LessonPracticeSection";

const SUFFIX_QUIZ_QUESTIONS: MCQuestion[] = [
  {
    id: "1",
    question: "What does the -ta suffix create?",
    options: ["Abstract noun", "Past participle", "Agent noun", "Gerundive"],
    correctIndex: 1,
    explanation: "-ta (kta) creates the past passive participle: 'having been X-ed'. E.g. √कृ + -ta → कृत.",
  },
  {
    id: "2",
    question: "Which suffix forms the agent noun ('doer')?",
    options: ["-a", "-ta", "-tṛ", "-ya"],
    correctIndex: 2,
    explanation: "-tṛ forms agent nouns: √कृ + -tṛ → कर्तृ 'doer'. The feminine is -trī.",
  },
  {
    id: "3",
    question: "√भू bhū 'to be' + -a produces:",
    options: ["भूत bhūta", "भव bhava", "भवति bhavati", "कर्तृ kartṛ"],
    correctIndex: 1,
    explanation: "Root + guṇa + -a → abstract noun. भू → भव 'being, becoming'.",
  },
  {
    id: "4",
    question: "Taddhita suffixes attach to:",
    options: ["Verbal roots only", "Nouns (and sometimes adjectives)", "Both roots and nouns", "Nothing — they are standalone"],
    correctIndex: 1,
    explanation: "Taddhita = secondary. They attach to nominal bases, e.g. राजन् + -īya → राज्ञी.",
  },
  {
    id: "5",
    question: "कर्तृ kartṛ is formed with which suffix?",
    options: ["-a (guṇa)", "-ta (kta)", "-tṛ (agent)", "-ana"],
    correctIndex: 2,
    explanation: "कर्तृ = doer. From √कृ 'to do' + -tṛ.",
  },
  {
    id: "6",
    question: "What does the -ya suffix typically express?",
    options: ["Past action", "The doer", "Necessity or 'to be done'", "Coordination"],
    correctIndex: 2,
    explanation: "-ya creates the gerundive: कार्य 'to be done', गम्य 'attainable'.",
  },
  {
    id: "7",
    question: "Which creates an action noun (e.g. 'hearing', 'seeing')?",
    options: ["-a", "-ta", "-tṛ", "-ana"],
    correctIndex: 3,
    explanation: "-ana: श्रवण 'hearing', दर्शन 'seeing, vision'. Often extends to instrument (ear) or result.",
  },
  {
    id: "8",
    question: "Kṛt suffixes attach to:",
    options: ["Nouns only", "Verbal roots", "Adjectives only", "Any word"],
    correctIndex: 1,
    explanation: "Kṛt = primary suffix on roots. Result is usually noun or adjective.",
  },
];

type DerivedForm = { form: string; devanagari: string; suffix: string; meaning: string; category: string };
type Dhatu = { id: string; devanagari: string; iast: string; meaning: string; derivedForms: DerivedForm[] };
const dhatus = dhatusData as Dhatu[];

const SUFFIX_LESSONS: Array<{
  title: string;
  body: string[];
  technicalNote?: string;
  nutshell?: string;
  reviewQuestions?: string[];
}> = [
  {
    title: "1) The Problem: From Root to Word",
    body: [
      "A verbal root (dhātu) such as √भू bhū 'to be' or √कृ kṛ 'to do' is abstract: it never appears on its own in a sentence. To make actual words, Sanskrit adds suffixes (pratyaya). Add -a to भू and you get भव bhav-a 'being, becoming'. Add -ta and you get भूत bhū-ta 'been, become; ghost'. Add -tṛ and you get कर्तृ kartṛ 'doer'. Without suffixes, roots are inert.",
      "Pāṇini's grammar is largely about which suffix attaches to which base, under what conditions. The Aṣṭādhyāyī has thousands of rules governing suffixation. This section introduces the main families of suffixes that turn roots into nouns and adjectives — the kṛt (primary) and taddhita (secondary) suffixes.",
    ],
    nutshell: "Roots need suffixes to become words. Kṛt suffixes attach to roots; taddhita suffixes attach to nouns.",
    reviewQuestions: ["Why don't roots appear on their own?", "What two main families of suffixes does Pāṇini distinguish?"],
  },
  {
    title: "2) Kṛt Suffixes: Root → Word",
    body: [
      "Kṛt (कृत्) suffixes are 'primary' — they attach directly to verbal roots. The result is usually a noun or adjective derived from the verb's meaning. For example, √गम् gam 'to go' + -a gives गम gama 'going, motion' (abstract noun). √कृ kṛ 'to do' + -tṛ gives कर्तृ kartṛ 'doer' (agent noun).",
      "Kṛt suffixes are numerous. Pāṇini groups them by the semantic role they create: agent (who does), patient (what is done), instrument, locus, time, etc. The most frequent in reading are: -a (abstract noun), -ta (past participle), -tṛ (agent), -ya (gerundive), -ana (action noun), and the verbal suffixes -ti etc. that create finite verb forms.",
    ],
    technicalNote: "The term kṛt comes from √कृ 'to do' — these suffixes 'do' something to the root, i.e. derive a new word. In Western terminology, kṛt derivatives are often called 'deverbative' or 'primary derivatives'.",
    nutshell: "Kṛt = primary suffix on root → noun/adjective. Common: -a, -ta, -tṛ, -ya, -ana.",
    reviewQuestions: ["What does 'kṛt' mean literally?", "Name three kṛt suffixes and what they typically produce."],
  },
  {
    title: "3) The Suffix -a (Guṇa): Abstract Nouns",
    body: [
      "One of the simplest kṛt suffixes is -a. When attached to a root, it often strengthens the root vowel to guṇa (a→a, i/u→e/o, ṛ→ar) and produces an abstract noun. √भू bhū 'to be' + -a → भव bhava 'being, becoming, state'. √गम् gam 'to go' + -a → गम gama 'going, motion'. √वच् vac 'to speak' + -a → वच vaca 'speech, word'.",
      "These abstract nouns name the action or state denoted by the root. They decline as regular a-stems (masculine or neuter, depending on the word). Many common Sanskrit words are formed this way: कर्म karma 'action' from √कृ, यज्ञ yajña 'sacrifice' from √यज्, मनस् manas 'mind' has related formations.",
    ],
    technicalNote: "The -a suffix is sometimes called the 'a-stem abstract' or 'root-a'. Not every -a after a root is this suffix; some roots historically ended in -a. The guṇa strengthening is regular for roots in i, u, ṛ.",
    nutshell: "Root + guṇa + -a → abstract noun (being, going, speaking).",
    reviewQuestions: ["What vowel change happens when -a is added to √भू?", "Give two examples of abstract nouns formed with -a."],
  },
  {
    title: "4) The Suffix -ta (kta): Past Participle",
    body: [
      "The suffix -ta (with variants -ita, -na in certain contexts) creates the past passive participle — 'the done-ness', the state of having been acted upon. √कृ kṛ + -ta → कृत kṛta 'done, made'. √भू bhū + -ta → भूत bhūta 'been, become'. √वच् vac + -ta → उक्त ukta 'said' (note: vac loses its vowel, zero grade).",
      "These participles are adjectives: they agree with a noun in case, number, and gender. कृतं कर्म kṛtaṃ karma 'the done deed' = 'the deed that was done'. They can also be used substantively: भूतानि bhūtāni 'those who have come into being' = 'spirits, ghosts'. The -ta participle is extremely common in Sanskrit — learn to recognise it.",
    ],
    technicalNote: "Roots ending in vowels often show -ita rather than -ta (seṭ/aniṭ distinction). Before -ta, voiced sounds may change (e.g. √वच् → ukta with guṇa of final element). Dental -t assimilates to following consonants (e.g. kṛt + bhū → kṛtbhū).",
    nutshell: "Root + -ta/-ita → past participle 'having been X-ed'. Declines like adjective.",
    reviewQuestions: ["What case does the subject of a passive -ta participle take when expressed?", "Why might √वच् + ta give उक्त instead of वक्त?"],
  },
  {
    title: "5) The Suffix -tṛ: Agent Noun",
    body: [
      "The suffix -tṛ (with feminine -trī, -tā) forms the agent noun — 'the one who does'. √कृ kṛ + -tṛ → कर्तृ kartṛ 'doer, agent'. √श्रु śru + -tṛ → श्रोतृ śrotṛ 'hearer, listener'. √दा dā + -tṛ → दातृ dātṛ 'giver'.",
      "In Pāṇini's kāraka system, कर्तृ kartṛ is also the name for the agent kāraka — the doer of the action. So the word कर्तृ means both 'doer' in general and the grammatical role 'agent'. Agent nouns in -tṛ decline as ṛ-stems (see Ruppel Ch. 29) and are common in philosophical and grammatical texts.",
    ],
    technicalNote: "The -tṛ suffix often induces guṇa in the root (kṛ → kar-). The feminine is usually -trī (कर्त्री) or in some words -tā. A related suffix -ant (शतृ) forms present active participles (भवन् bhavant 'one who is').",
    nutshell: "Root + -tṛ → agent noun 'doer'. कर्तृ = doer, agent. Feminines in -trī.",
    reviewQuestions: ["What is the feminine of कर्तृ?", "How does -tṛ relate to the kāraka system?"],
  },
  {
    title: "6) The Suffix -ya: Gerundive",
    body: [
      "The suffix -ya creates the gerundive — expressing necessity or obligation in passive sense: 'to be done', 'fit to be done', 'must be done'. √कृ kṛ + -ya → कार्य kārya 'to be done, duty'. √गम् gam + -ya → गम्य gamya 'to be gone to, attainable'. √दृश् dṛś + -ya → दृश्य dṛśya 'visible'.",
      "Gerundives are adjectives and agree with nouns. कार्यं कर्म kāryaṃ karma 'the deed to be done, duty'. They often appear in expressions like 'X is to be done by Y' with the agent in the instrumental. The gerundive is closely related to the future passive participle.",
    ],
    technicalNote: "Before -ya, roots often appear in zero grade or with specific vowel changes. √दृश् gives दृश्य (dṛś-ya) 'visible'. The -ya gerundive is one of several suffixes that express 'must/should be done'; others include -tavya, -anīya.",
    nutshell: "Root + -ya → gerundive 'to be X-ed', 'fit to be X-ed'.",
    reviewQuestions: ["What is the difference between कार्य and कृत?", "How is the agent expressed with a gerundive?"],
  },
  {
    title: "7) The Suffix -ana: Action Noun",
    body: [
      "The suffix -ana forms action nouns — the name of the act itself. √श्रु śru + -ana → श्रवण śravaṇa 'hearing; the ear'. √वच् vac + -ana → वचन vacana 'speech, utterance'. √दृश् dṛś + -ana → दर्शन darśana 'seeing, vision; philosophy'.",
      "These nouns can denote the action (करण karaṇa 'doing'), the result, or even the instrument/locus of the action (श्रवण = ear, as the organ of hearing). दर्शन darśana came to mean 'philosophical view, system' — what one 'sees' or understands.",
    ],
    technicalNote: "The -ana suffix usually requires guṇa of the root vowel. It creates neuter a-stems. Related suffixes -ana and -man also form action nouns with slightly different distributions.",
    nutshell: "Root + -ana → action noun (hearing, saying, seeing). Often extends to mean result or instrument.",
    reviewQuestions: ["What does दर्शन mean both literally and in philosophy?", "How does श्रवण relate to 'hearing'?"],
  },
  {
    title: "8) Verbal Suffixes: -ti and Personal Endings",
    body: [
      "Kṛt suffixes also create finite verb forms. The present tense adds a stem-forming affix (depending on verb class) plus the personal ending -ti (3rd sg), -si (2nd sg), -mi (1st sg), etc. √भू + present stem भव- + ति -ti → भवति bhavati 'he/she is'. √कृ in class 8: करोति karoti 'he does'.",
      "These 'tiṅ' (तिङ्) endings mark person (1st, 2nd, 3rd) and number (singular, dual, plural). The combination of root + stem-forming element + ending is the core of Sanskrit verb conjugation. See the Verbs section for full paradigms.",
    ],
    nutshell: "Root + stem suffix + tiṅ ending → finite verb. -ti = 3rd sg, -si = 2nd sg, -mi = 1st sg.",
    reviewQuestions: ["What does tiṅ mean?", "What is the 3rd person singular ending?"],
  },
  {
    title: "9) Taddhita Suffixes: Noun → Derived Noun",
    body: [
      "Taddhita (तद्धित) suffixes are 'secondary' — they attach to nouns (or sometimes adjectives), not directly to roots. The base may be a nominal stem. For example, राजन् rājan 'king' + -īya (via -a) → राज्ञी rājñī 'queen'. मनुष्य manuṣya 'man' + -tva → मानुष्यत्व manuṣyatva 'humanness'.",
      "Common taddhita suffixes: -ika/-aka (belonging to, relating to), -in (possessing, having), -tva/-tā (abstract quality), -īya (relating to), -īya (comparative in certain forms). These create adjectives, abstract nouns, and relational forms.",
    ],
    technicalNote: "The term taddhita literally means 'from that' — the suffix is added 'from' (i.e. after) a nominal base. Pāṇini devotes a large section of the Aṣṭādhyāyī to taddhita rules.",
    nutshell: "Taddhita = secondary suffix on noun → derived adjective or abstract noun. -ika, -in, -tva, -tā.",
    reviewQuestions: ["What is the difference between kṛt and taddhita?", "Give one example of a taddhita derivative."],
  },
  {
    title: "10) Suffix Order and Combinations",
    body: [
      "Suffixes can sometimes be stacked. A root + kṛt suffix may then receive a taddhita suffix. For example, कर्तृ kartṛ 'doer' + -tva → कर्तृत्व kartṛtva 'the state of being a doer, agency'. भूत bhūta 'been' + -tva → भूतत्व bhūtatva 'the state of having been, existence'.",
      "Pāṇini's rules govern which combinations are allowed. Not every suffix can attach to every base. Semantic and phonological constraints apply. When reading, try to parse complex words by working from the inside out: identify the root, then the first suffix, then any further suffixes.",
    ],
    nutshell: "Suffixes can combine: root + kṛt + taddhita. Parse from inside out.",
    reviewQuestions: ["What does कर्तृत्व mean?", "In what order should you parse a suffixed word?"],
  },
  {
    title: "11) Examples from Our Roots",
    body: [
      "The table below shows how the roots in our database take different suffixes. Study the patterns: some roots prefer certain suffixes, others show irregular formations. कृ has करोति (verb), कृत (participle), कर्तृ (agent), कार्य (gerundive), क्रिया (abstract). भू has भवति, भूत, भव (abstract). गम् has गच्छति, गम, गम्य, आगत.",
      "When you encounter a new word, try to identify: (1) the root, (2) the suffix, (3) the resulting meaning. A dictionary will list most derivatives; but recognising the structure speeds up learning.",
    ],
    reviewQuestions: ["From √कृ, list four different suffixed forms.", "What is the gerundive of √गम्?"],
  },
  {
    title: "12) The Nutshell & Next Steps",
    body: [
      "Kṛt suffixes attach to roots and produce nouns, adjectives, and verb forms. The most important: -a (abstract), -ta (past participle), -tṛ (agent), -ya (gerundive), -ana (action noun), -ti (verb ending). Taddhita suffixes attach to nouns and produce derived adjectives and abstract nouns: -ika, -in, -tva, -tā.",
      "Mastery comes from practice. When reading, pause at each nominal form and ask: could this be root + suffix? Identifying कर्तृ, कृत, कार्य, भव, भूत in context will soon become automatic. Proceed to Kārakas to see how these words function in sentences.",
    ],
    nutshell: "Kṛt: root → word. Taddhita: noun → derived word. Memorise the frequent kṛt suffixes; parse when reading.",
    reviewQuestions: ["List the six most frequent kṛt suffixes.", "What should you do when you encounter an unfamiliar nominal in a text?"],
  },
];

export default function SuffixesPage() {
  const [lessonStep, setLessonStep] = useState(0);
  const [showTechnical, setShowTechnical] = useState<Record<number, boolean>>({});

  const lesson = SUFFIX_LESSONS[lessonStep];
  const canNext = lessonStep < SUFFIX_LESSONS.length - 1;
  const canPrev = lessonStep > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Suffixes as Operators</h1>
          <p className="text-muted-foreground">
            Kṛt and taddhita suffixes turn roots and nouns into new words. Twelve lessons from first principles.
          </p>
          <div className="mt-3">
            <ZoneGate zoneId="suffixes" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/learn/words/" className="text-sm text-primary hover:underline">← Words</Link>
          <span className="text-muted-foreground">|</span>
          <Link href="/learn/karakas/" className="text-sm text-primary hover:underline">Kārakas →</Link>
        </div>
      </div>

      {/* Lesson index */}
      <div className="flex flex-wrap gap-2">
        {SUFFIX_LESSONS.map((_, i) => (
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

      {/* Current lesson */}
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

          {/* Examples table for lesson 11 */}
          {lessonStep === 10 && (
            <div className="overflow-x-auto border-t border-border pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Root</th>
                    <th className="text-left py-2 font-medium">Suffix</th>
                    <th className="text-left py-2 font-medium">Result</th>
                    <th className="text-left py-2 font-muted-foreground">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {dhatus.flatMap((d) =>
                    d.derivedForms.slice(0, 3).map((f) => (
                      <tr key={`${d.id}-${f.form}`} className="border-b border-border/50">
                        <td className="py-3">
                          <span className="font-mono">{d.iast}</span>
                          <span className="ml-1" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{d.devanagari}</span>
                        </td>
                        <td className="py-3 text-muted-foreground">{f.suffix}</td>
                        <td className="py-3">
                          <span className="font-mono">{f.form}</span>
                          <span className="ml-1" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{f.devanagari}</span>
                        </td>
                        <td className="py-3 text-muted-foreground">{f.meaning}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Practice */}
      <LessonPracticeSection
        title="Practice"
        description="Multiple choice quiz. Test your understanding of kṛt and taddhita suffixes."
      >
        <div className="space-y-6">
          <MultipleChoiceQuiz
            questions={SUFFIX_QUIZ_QUESTIONS}
            title="Suffix Quiz"
            shuffleQuestions
            shuffleOptions
            showProgress
          />
        </div>
      </LessonPracticeSection>

      {/* Nav */}
      <div className="flex justify-between">
        <button
          onClick={() => setLessonStep((s) => Math.max(0, s - 1))}
          disabled={!canPrev}
          className={cn("text-primary hover:underline", !canPrev && "opacity-50 cursor-not-allowed")}
        >
          ← Previous lesson
        </button>
        <button
          onClick={() => setLessonStep((s) => Math.min(SUFFIX_LESSONS.length - 1, s + 1))}
          disabled={!canNext}
          className={cn("text-primary hover:underline", !canNext && "opacity-50 cursor-not-allowed")}
        >
          Next lesson →
        </button>
      </div>
    </div>
  );
}
