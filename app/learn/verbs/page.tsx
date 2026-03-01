"use client";

import { useState } from "react";
import Link from "next/link";
import dhatusData from "@/data/dhatus.json";
import { cn } from "@/lib/utils";
import { ZoneGate } from "@/components/ZoneGate";
import { MultipleChoiceQuiz, type MCQuestion } from "@/components/MultipleChoiceQuiz";
import { LessonPracticeSection } from "@/components/LessonPracticeSection";

const VERB_QUIZ_QUESTIONS: MCQuestion[] = [
  {
    id: "1",
    question: "How many numbers does Sanskrit have?",
    options: ["One (singular only)", "Two (singular, plural)", "Three (singular, dual, plural)", "Four"],
    correctIndex: 2,
    explanation: "Sanskrit has singular, dual (exactly two), and plural.",
  },
  {
    id: "2",
    question: "Which voice is 'word for another' (parasmaipada)?",
    options: ["Middle", "Passive", "Active", "Reflexive"],
    correctIndex: 2,
    explanation: "Parasmaipada = active. Ātmanepada = middle.",
  },
  {
    id: "3",
    question: "The potential mood expresses:",
    options: ["Past action", "Commands", "Possibility, wish, or condition", "Continuous aspect"],
    correctIndex: 2,
    explanation: "Potential (optative): 'may', 'should', 'would', 'if he...'.",
  },
  {
    id: "4",
    question: "Primary endings are used for:",
    options: ["Imperfect and aorist", "Present and future", "Perfect only", "Imperative only"],
    correctIndex: 1,
    explanation: "Primary = present, future. Secondary = imperfect, aorist, perfect.",
  },
  {
    id: "5",
    question: "The augment a- marks:",
    options: ["Future tense", "Present tense", "Past tense (e.g. imperfect)", "Middle voice"],
    correctIndex: 2,
    explanation: "अ- before the stem marks past: अभरत् 'he carried'.",
  },
  {
    id: "6",
    question: "How many verb classes (gaṇas) does Sanskrit have?",
    options: ["Three", "Five", "Ten", "Twelve"],
    correctIndex: 2,
    explanation: "Ten gaṇas. Each has different stem-formation rules.",
  },
  {
    id: "7",
    question: "Non-finite forms include:",
    options: ["Only the infinitive", "Infinitive, participles, absolutive, gerundive", "Only participles", "Only imperative"],
    correctIndex: 1,
    explanation: "Non-finite: infinitive (-tum), participles, absolutive (-tvā/-ya), gerundive (-ya, -tavya).",
  },
  {
    id: "8",
    question: "What is the 3rd person singular present ending?",
    options: ["-mi", "-si", "-ti", "-nti"],
    correctIndex: 2,
    explanation: "-ti = 3rd sg, -nti = 3rd pl. भरति 'he carries'.",
  },
];

type Dhatu = { iast: string; devanagari: string; gana: number; derivedForms: { form: string; devanagari: string; category: string }[] };
const dhatus = dhatusData as Dhatu[];

const VERB_LESSONS: Array<{
  title: string;
  body: string[];
  technicalNote?: string;
  nutshell?: string;
  reviewQuestions?: string[];
}> = [
  {
    title: "1) The Categories of the Sanskrit Verb",
    body: [
      "A verb expresses an action. Sanskrit verbs, like English ones, encode who does it (person), how many (number), when (tense), how (mood), and whether the subject acts or is acted upon (voice). The difference is that Sanskrit adds affixes and endings to the verb itself, while English often uses separate words: 'I will carry' vs. भरिष्यामि bhariṣyāmi.",
      "Person: first ('I'), second ('you'), third ('he/she/it'). Number: singular, dual (exactly two), plural. Sanskrit has a dual — 'we two', 'the two brothers' — which English lacks. Tense: present, future, and several past tenses (imperfect, aorist, perfect). Mood: indicative (statements), potential (possibility, wish), imperative (commands). Voice: active, middle, passive.",
    ],
    nutshell: "Verb = person, number, tense, mood, voice. Sanskrit marks these with endings.",
    reviewQuestions: ["What three numbers does Sanskrit have?", "Name the three voices."],
  },
  {
    title: "2) Person and Number",
    body: [
      "First person = speaker ('I', 'we'). Second person = addressee ('you'). Third person = someone/something spoken about ('he', 'she', 'it', 'they'). The verb ending changes: भरामि bharāmi 'I carry', भरसि bharasi 'you carry', भरति bharati 'he/she/it carries'.",
      "The dual is used for exactly two. भरावः bharāvaḥ 'we two carry', भरथः bharathaḥ 'you two carry', भरतः bharataḥ 'they two carry'. In translation, dual can be rendered as plural ('we carry') unless the 'two' is semantically important.",
    ],
    technicalNote: "The terminology 'parasmaipada' (word for another) = active; 'ātmanepada' (word for oneself) = middle. Some verbs use only active endings, some only middle, some both (ubhayapada).",
    nutshell: "1st, 2nd, 3rd person; singular, dual, plural. Endings mark both.",
    reviewQuestions: ["What does the dual number indicate?", "What is parasmaipada?"],
  },
  {
    title: "3) Tense: Present, Future, Past",
    body: [
      "Present tense: भरति 'he carries', 'he is carrying'. Sanskrit does not distinguish simple vs. continuous; context determines translation. Future tense: भरिष्यति 'he will carry'. Formed with -sya- or -iṣya- plus primary endings.",
      "Past: Sanskrit has three past tenses — imperfect (अभरत् 'he carried'), aorist (various formations), and perfect (जभार 'he has carried'). Each is formed differently. For now, recognise that past reference is common and that the augment a- often marks past (अ-भरत्).",
    ],
    nutshell: "Present, future, imperfect/aorist/perfect. Future: -sya-/-iṣya- + endings.",
    reviewQuestions: ["How many past tenses does Sanskrit have?", "What often marks the imperfect?"],
  },
  {
    title: "4) Mood: Indicative, Potential, Imperative",
    body: [
      "Indicative: statements about reality. भरति 'he carries'. Potential (also called subjunctive/optative): possibility, wish, condition. भरेत् 'he may/should/would carry'. Used in conditional clauses: 'if he carried...'. Imperative: commands. भरतु 'let him carry!'.",
      "The potential is regularly used only in the present tense. In 1st dual/plural it can mean 'let us...'. The imperative has its own set of endings. Mood is marked by different vowels and endings before the personal ending.",
    ],
    nutshell: "Indicative = statements. Potential = may/should/would. Imperative = commands.",
    reviewQuestions: ["What does the potential mood express?", "When is the potential typically used?"],
  },
  {
    title: "5) Voice: Active, Middle, Passive",
    body: [
      "Active: the subject does the action. भरति 'he carries'. Passive: the subject is acted upon. भ्रियते 'he is carried'. Middle: originally between active and passive — reflexive, self-benefiting, or intransitive. In Classical Sanskrit, middle often translates like active; outside present/imperfect, middle and passive share forms.",
      "Some verbs are only active (parasmaipada), some only middle (ātmanepada), some both. The 3rd sg form in a dictionary tells you: भरति = active; भाषते = middle.",
    ],
    technicalNote: "Parasmaipada = 'word for another' (the action affects another). Ātmanepada = 'word for oneself' (the action reflects back or benefits the subject).",
    nutshell: "Active, middle, passive. Middle often = active in translation. Check dictionary for verb's voice.",
    reviewQuestions: ["What is the difference between parasmaipada and ātmanepada?", "When do middle and passive share forms?"],
  },
  {
    title: "6) Finite vs. Non-Finite Forms",
    body: [
      "Finite verbs are fully specified: person, number, tense, mood, voice. भरति, भरिष्यति, अभरत् — all finite. Non-finite forms are less specified: the infinitive (भरितुम् 'to carry'), participles (भरन् 'carrying', भूत 'carried'), the absolutive (भृत्वा 'having carried'), the gerundive (भरणीय 'to be carried').",
      "Participles and the gerundive decline like adjectives. The infinitive and absolutive have fixed form. Non-finite forms are extremely common in Sanskrit — often more so than finite verbs in literary prose.",
    ],
    nutshell: "Finite = full specification. Non-finite = infinitive, participles, absolutive, gerundive.",
    reviewQuestions: ["What makes a verb form 'finite'?", "Name three non-finite forms."],
  },
  {
    title: "7) Roots, Stems, and Verb Classes",
    body: [
      "The root (√धातु dhātu) is the minimal form: √भृ bhṛ 'to carry', √कृ kṛ 'to do'. Roots do not appear in sentences. The stem is the form to which endings are added. For √भृ, the present stem is भर- bhara-; for √कृ (class 8), it is करो- karo-.",
      "Sanskrit has ten verb classes (gaṇas). Each class forms its present stem differently: some add -a-, some reduplicate, some use -ya-, etc. √भू (class 1) → भवति. √वच् (class 2) → वक्ति. √दृश् (class 4) → पश्यति. √कृ (class 8) → करोति. The class must be memorised for each root.",
    ],
    technicalNote: "Pāṇini's ten classes: 1 bhvādi, 2 adādi, 3 juhoṭi, 4 divādi, 5 svādi, 6 tudādi, 7 rudhādi, 8 tanādi, 9 kryādi, 10 curādi. Class 10 often forms causatives and denominatives.",
    nutshell: "Root → stem (+ class-specific rules) → + ending = verb. Ten classes, different stem formation.",
    reviewQuestions: ["What is the difference between root and stem?", "How many verb classes are there?"],
  },
  {
    title: "8) Primary and Secondary Endings",
    body: [
      "Primary endings are used for present and future: -mi, -si, -ti (1st, 2nd, 3rd sg), -vaḥ, -thaḥ, -taḥ (dual), -maḥ, -tha, -nti (plural). Secondary endings are used for imperfect, aorist, perfect (and potential): -m, -ḥ, -t, -va, -tam, -tām, -ma, -ta, -an/-uḥ.",
      "The terminology helps when you see a form like अभरत्: the -t ending is secondary, so this is imperfect (or aorist). भरति has -ti (primary), so present or future. The augment a- confirms imperfect.",
    ],
    nutshell: "Primary = present, future. Secondary = imperfect, aorist, perfect. Different ending sets.",
    reviewQuestions: ["When are primary endings used?", "What is the 3rd sg secondary ending?"],
  },
  {
    title: "9) Example Paradigm: Present of √भृ",
    body: [
      "Present indicative active of √भृ 'to carry' (class 1): 1st sg भरामि, 2nd sg भरसि, 3rd sg भरति; 1st du भरावः, 2nd du भरथः, 3rd du भरतः; 1st pl भरामः, 2nd pl भरथ, 3rd pl भरन्ति.",
      "Note the stem भर- throughout. The personal endings attach to it. For athematic verbs (classes 2, 3, 5, 7, 8, 9), the stem may change between strong and weak forms in different persons.",
    ],
    nutshell: "भरामि, भरसि, भरति... Stem + primary endings = present.",
    reviewQuestions: ["What is the 3rd plural of √भृ in the present?", "What class is √भृ?"],
  },
  {
    title: "10) Example Forms from Our Roots",
    body: [
      "The roots in our database illustrate the variety. √कृ (class 8): करोति. √गम् (class 1): गच्छति (reduplicating class). √वच् (class 2): वक्ति. √दृश् (class 4): पश्यति. √श्रु (class 5): शृणोति. Each class has its own stem-formation rules.",
      "When you meet an unfamiliar verb form, try to identify: (1) the ending (person, number), (2) the tense (primary vs. secondary, augment?), (3) the stem, (4) the root. A dictionary lists roots with class and 3rd sg present to help you.",
    ],
    nutshell: "Each root has a class. Class determines stem. Memorise 3rd sg present for each root.",
    reviewQuestions: ["What is the 3rd sg present of √कृ?", "What is the 3rd sg present of √दृश्?"],
  },
  {
    title: "11) The Nutshell & Next Steps",
    body: [
      "Verbs mark person, number, tense, mood, voice. Roots belong to classes; classes determine stem formation. Primary endings → present, future. Secondary + augment → imperfect. Middle and passive have separate paradigms.",
      "Full conjugation tables are in reference grammars (e.g. Whitney, Ruppel Appendix). For reading, focus on recognising common forms: भवति, करोति, गच्छति, पश्यति, etc. Proceed to Compounds to see how verbs interact with nouns in complex sentences.",
    ],
    nutshell: "Learn verb categories; memorise class and 3rd sg for each root; recognise common forms.",
    reviewQuestions: ["What five categories does the Sanskrit verb encode?", "Where can you find full paradigms?"],
  },
];

export default function VerbsPage() {
  const [lessonStep, setLessonStep] = useState(0);
  const [showTechnical, setShowTechnical] = useState<Record<number, boolean>>({});

  const lesson = VERB_LESSONS[lessonStep];
  const verbExamples = dhatus.flatMap((d) => d.derivedForms.filter((f) => f.category === "verb")).slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Verbal Conjugation</h1>
          <p className="text-muted-foreground">
            Person, number, tense, mood, voice. Eleven lessons on the Sanskrit verb system.
          </p>
          <div className="mt-3">
            <ZoneGate zoneId="verbs" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/learn/karakas/" className="text-sm text-primary hover:underline">← Kārakas</Link>
          <span className="text-muted-foreground">|</span>
          <Link href="/learn/compounds/" className="text-sm text-primary hover:underline">Compounds →</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {VERB_LESSONS.map((_, i) => (
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
          {lessonStep === 9 && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              {verbExamples.map((v) => (
                <div key={v.form} className="px-4 py-2 rounded-lg border border-border bg-background">
                  <span className="font-mono">{v.form}</span>
                  <span className="ml-2 text-lg" style={{ fontFamily: "var(--font-devanagari), sans-serif" }}>{v.devanagari}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <LessonPracticeSection
        title="Practice"
        description="Multiple choice quiz on verb categories, stem formation, and endings."
      >
        <MultipleChoiceQuiz
          questions={VERB_QUIZ_QUESTIONS}
          title="Verb Quiz"
          shuffleQuestions
          shuffleOptions
          showProgress
        />
      </LessonPracticeSection>

      <div className="flex justify-between">
        <button
          onClick={() => setLessonStep((s) => Math.max(0, s - 1))}
          disabled={lessonStep === 0}
          className={cn("text-primary hover:underline", lessonStep === 0 && "opacity-50 cursor-not-allowed")}
        >
          ← Previous lesson
        </button>
        <button
          onClick={() => setLessonStep((s) => Math.min(VERB_LESSONS.length - 1, s + 1))}
          disabled={lessonStep === VERB_LESSONS.length - 1}
          className={cn("text-primary hover:underline", lessonStep === VERB_LESSONS.length - 1 && "opacity-50 cursor-not-allowed")}
        >
          Next lesson →
        </button>
      </div>
    </div>
  );
}
