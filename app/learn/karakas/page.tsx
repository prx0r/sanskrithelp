"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ZoneGate } from "@/components/ZoneGate";
import { MultipleChoiceQuiz, type MCQuestion } from "@/components/MultipleChoiceQuiz";
import { LessonPracticeSection } from "@/components/LessonPracticeSection";

const KARAKA_QUIZ_QUESTIONS: MCQuestion[] = [
  {
    id: "1",
    question: "Which kāraka is the doer of the action?",
    options: ["Karman", "Kartṛ", "Karaṇa", "Sampradāna"],
    correctIndex: 1,
    explanation: "कर्तृ kartṛ = agent, the doer. Typically nominative in active sentences.",
  },
  {
    id: "2",
    question: "What case does the karman (object) typically take?",
    options: ["Nominative", "Accusative", "Instrumental", "Dative"],
    correctIndex: 1,
    explanation: "The object is in the accusative: रामः पुस्तकं पठति 'Rāma reads the book'.",
  },
  {
    id: "3",
    question: "In 'He cuts with a knife', the knife is which kāraka?",
    options: ["Kartṛ", "Karman", "Karaṇa", "Apādāna"],
    correctIndex: 2,
    explanation: "करण karaṇa = instrument. The means by which the action is done. Instrumental case.",
  },
  {
    id: "4",
    question: "The recipient (to whom something is given) is:",
    options: ["Sampradāna (dative)", "Apādāna (ablative)", "Adhikaraṇa (locative)", "Karaṇa (instrumental)"],
    correctIndex: 0,
    explanation: "सम्प्रदान sampradāna = recipient. Dative case.",
  },
  {
    id: "5",
    question: "'From the village' — the village is which kāraka?",
    options: ["Karaṇa", "Sampradāna", "Apādāna", "Adhikaraṇa"],
    correctIndex: 2,
    explanation: "अपादान apādāna = source, the fixed point from which. Ablative case.",
  },
  {
    id: "6",
    question: "Where does the action take place? Which kāraka?",
    options: ["Kartṛ", "Karman", "Apādāna", "Adhikaraṇa"],
    correctIndex: 3,
    explanation: "अधिकरण adhikaraṇa = locus. Locative case: in/on which.",
  },
  {
    id: "7",
    question: "In a passive sentence, the agent usually appears in:",
    options: ["Nominative", "Accusative", "Instrumental", "Dative"],
    correctIndex: 2,
    explanation: "बालो नरेण भ्रियते 'The child is carried by the man' — agent in instrumental.",
  },
  {
    id: "8",
    question: "How many kārakas did Pāṇini define?",
    options: ["Four", "Five", "Six", "Seven"],
    correctIndex: 2,
    explanation: "Six: कर्तृ, कर्मन्, करण, सम्प्रदान, अपादान, अधिकरण.",
  },
];

const KARAKA_LESSONS: Array<{
  title: string;
  body: string[];
  technicalNote?: string;
  nutshell?: string;
  reviewQuestions?: string[];
}> = [
  {
    title: "1) What is a Kāraka?",
    body: [
      "In the sentence 'Rāma gives a book to Sītā', we understand who does what to whom: Rāma is the giver, the book is what is given, Sītā is the recipient. Sanskrit grammar encodes these roles through a system of six kārakas — semantic roles that connect meaning to form.",
      "Pāṇini defined kārakas to explain why nouns take particular case endings. The kartṛ (agent) typically appears in the nominative; the karman (object) in the accusative; the sampradāna (recipient) in the dative; and so on. Kārakas are not the same as cases: one kāraka can be expressed by different cases in different contexts, and one case can express different kārakas. But the mapping is regular enough to be the backbone of Sanskrit syntax.",
    ],
    nutshell: "Kāraka = semantic role (who does what to whom). Six kārakas map to case endings.",
    reviewQuestions: ["What is the difference between a kāraka and a case?", "Why did Pāṇini introduce kārakas?"],
  },
  {
    title: "2) The Six Kārakas — Overview",
    body: [
      "The six kārakas are: (1) कर्तृ kartṛ 'agent' — the doer; (2) कर्मन् karman 'object' — what is done to; (3) करण karaṇa 'instrument' — the means; (4) सम्प्रदान sampradāna 'recipient' — for whom; (5) अपादान apādāna 'source' — from which; (6) अधिकरण adhikaraṇa 'locus' — in/on which.",
      "Each name is itself a Sanskrit word: कर्तृ means 'doer', कर्मन् means 'deed, object', करण means 'instrument', सम्प्रदान means 'giving over', अपादान means 'taking away', अधिकरण means 'support, locus'. Learning these terms helps you parse commentaries and grammars.",
    ],
    technicalNote: "Western grammars sometimes use different terms: agent, patient/theme, instrument, recipient/benefactive, source/ablative, location. The mapping is roughly but not exactly the same.",
    nutshell: "Six: कर्तृ, कर्मन्, करण, सम्प्रदान, अपादान, अधिकरण.",
    reviewQuestions: ["List all six kārakas with their rough English equivalents.", "What does सम्प्रदान mean literally?"],
  },
  {
    title: "3) Kartṛ — The Agent",
    body: [
      "The कर्तृ kartṛ is the independent doer of the action. In active sentences, it is the subject. रामः पठति rāmaḥ paṭhati 'Rāma reads' — राम is कर्तृ. The agent is typically in the nominative case and agrees with the verb in person and number.",
      "With passive verbs, the logical agent may appear in the instrumental: पुस्तकं रामेण पठ्यते pustakaṃ rāmeṇa paṭhyate 'The book is read by Rāma'. Here रामेण is still the agent semantically, but the case changes. Pāṇini has rules for when the kartṛ takes nominative vs. instrumental vs. other cases.",
    ],
    nutshell: "कर्तृ = doer. Usually nominative in active; instrumental with passive.",
    reviewQuestions: ["What case does the agent typically take in an active sentence?", "How is the agent expressed in a passive sentence?"],
  },
  {
    title: "4) Karman — The Object",
    body: [
      "The कर्मन् karman is the object of a transitive verb — the entity most directly affected by the action. रामः पुस्तकं पठति rāmaḥ pustakaṃ paṭhati 'Rāma reads the book' — पुस्तकं is कर्मन्. It typically appears in the accusative case.",
      "Some verbs take two objects (e.g. 'give' has a thing given and a recipient). The thing given is karman (accusative); the recipient is sampradāna (dative). Intransitive verbs have no karman: रामः गच्छति 'Rāma goes' — only kartṛ, no karman.",
    ],
    nutshell: "कर्मन् = object. Accusative. The entity most directly affected.",
    reviewQuestions: ["What case does the karman take?", "In 'Rāma gives a book to Sītā', which noun is karman?"],
  },
  {
    title: "5) Karaṇa — The Instrument",
    body: [
      "The करण karaṇa is the means or instrument by which the action is performed. छुरिकया छिनत्ति churikayā chinatti 'He cuts with a knife' — छुरिकया is करण, in the instrumental case. अश्वेन गच्छति aśvena gacchati 'He goes by horse'.",
      "Karaṇa includes tools, weapons, body parts used as tools, and abstract means (by effort, by speech). It is always in the instrumental. Do not confuse the instrumental of agent (passive) with the instrumental of instrument — context and verb voice will clarify.",
    ],
    nutshell: "करण = instrument. Instrumental case. The means by which.",
    reviewQuestions: ["Give an example sentence with karaṇa.", "What case does karaṇa take?"],
  },
  {
    title: "6) Sampradāna — The Recipient",
    body: [
      "The सम्प्रदान sampradāna is the recipient or beneficiary — the one for whom the action is done, or to whom something is given. रामः सीतायै पुस्तकं ददाति rāmaḥ sītāyai pustakaṃ dadāti 'Rāma gives a book to Sītā' — सीतायै is सम्प्रदान, dative case.",
      "Verbs of giving, telling, showing, and pleasing often take a sampradāna. The dative case is also used for purpose ('for the sake of') and in many other constructions. Not every dative is sampradāna — but when the verb implies transfer or benefit, the recipient is sampradāna.",
    ],
    nutshell: "सम्प्रदान = recipient. Dative case. To/for whom.",
    reviewQuestions: ["What case does sampradāna take?", "Name two verb types that typically take a sampradāna."],
  },
  {
    title: "7) Apādāna — The Source",
    body: [
      "The अपादान apādāna is the fixed point from which separation or movement away occurs. ग्रामात् आगच्छति grāmāt āgacchati 'He comes from the village' — ग्रामात् is अपादान. वृक्षात् पतति vṛkṣāt patati 'He falls from the tree'.",
      "It is always in the ablative case. Apādāna implies that the source is fixed — we do not move the village when we 'come from' it. Contrast with karman, where the object is directly affected. Verbs of fearing also take the ablative: राक्षसात् बिभेति rākṣasāt bibheti 'He fears the demon'.",
    ],
    technicalNote: "Apādāna is sometimes translated as 'ablative' or 'source'. The key is that it denotes the fixed starting point of a movement or separation.",
    nutshell: "अपादान = source. Ablative case. From which (fixed point).",
    reviewQuestions: ["What case does apādāna take?", "Why is the village 'fixed' in 'he comes from the village'?"],
  },
  {
    title: "8) Adhikaraṇa — The Locus",
    body: [
      "The अधिकरण adhikaraṇa is the locus or location — where the action takes place, or on/in which something rests. गृहे वसति gṛhe vasati 'He dwells in the house' — गृहे is अधिकरण. पृथिव्याम् स्थितः pṛthivyām sthitaḥ 'Situated on earth'.",
      "It is in the locative case. Adhikaraṇa can be spatial (in the city, on the mountain) or temporal (at that time). It can also be abstract: विषये जानाति viṣaye jānāti 'He knows about the subject'.",
    ],
    nutshell: "अधिकरण = locus. Locative case. In/on which, where.",
    reviewQuestions: ["What case does adhikaraṇa take?", "Can adhikaraṇa be temporal as well as spatial?"],
  },
  {
    title: "9) Case–Kāraka Mapping Summary",
    body: [
      "A rough default mapping: Nominative → kartṛ (agent). Accusative → karman (object). Instrumental → karaṇa (instrument) or kartṛ (in passive). Dative → sampradāna (recipient). Ablative → apādāna (source). Locative → adhikaraṇa (locus).",
      "But cases have multiple uses. The genitive, for example, expresses possession and many other relations; it is not a primary kāraka in Pāṇini's system. The vocative is for address. When parsing, ask: what role does this noun play in the action of the verb? That will guide you to the right kāraka and thus the expected case.",
    ],
    technicalNote: "Pāṇini uses a more complex system: each kāraka is defined by a relation (e.g. kartṛ is the independent participant in the action). Cases are then assigned by rules that refer to these relations, with many exceptions.",
    nutshell: "Nom→kartṛ, Acc→karman, Instr→karaṇa/kartṛ, Dat→sampradāna, Abl→apādāna, Loc→adhikaraṇa.",
    reviewQuestions: ["Which case typically expresses the agent?", "What case is used for the object?"],
  },
  {
    title: "10) Parsing a Sentence",
    body: [
      "To parse a Sanskrit sentence: (1) Find the verb and identify its root, tense, and voice. (2) Identify the kartṛ — usually the nominative noun that agrees with the verb. (3) If transitive, find the karman (accusative). (4) Look for instrumentals (karaṇa or passive agent), datives (sampradāna), ablatives (apādāna), locatives (adhikaraṇa). (5) Fit each noun into the clause.",
      "Example: रामो रावणं शरैः हन्ति rāmo rāvaṇaṃ śaraiḥ hanti 'Rāma kills Rāvaṇa with arrows'. Verb: हन्ति (√हन्, present). रामः = kartṛ (nom). रावणं = karman (acc). शरैः = karaṇa (instr).",
    ],
    nutshell: "Parse: verb → kartṛ → karman → other kārakas. Match case to role.",
    reviewQuestions: ["What is the first step in parsing a sentence?", "In the example sentence, what is शरैः?"],
  },
  {
    title: "11) Where You'll See This",
    body: [
      "Every Sanskrit sentence you read uses the kāraka system. Commentaries and grammars refer to कर्तृ, कर्म, etc. When you learn a new verb, note which kārakas it typically takes: √दा 'give' takes kartṛ, karman, sampradāna. √गम् 'go' takes kartṛ and optionally apādāna (from) or adhikaraṇa (to/at).",
      "The Verbs and Compounds sections build on this. A compound like राज-पुरुषः 'king's man' involves a genitive relation; a bahuvrīhi like दीर्घ-बाहुः 'long-armed' describes a possessor. Kārakas help you understand how all the pieces of a sentence fit together.",
    ],
    nutshell: "Kārakas underpin every sentence. Learn verb frames; apply when reading.",
    reviewQuestions: ["Which kārakas does √दा typically take?", "How do kārakas relate to compound analysis?"],
  },
];

export default function KarakasPage() {
  const [lessonStep, setLessonStep] = useState(0);
  const [showTechnical, setShowTechnical] = useState<Record<number, boolean>>({});

  const lesson = KARAKA_LESSONS[lessonStep];
  const canNext = lessonStep < KARAKA_LESSONS.length - 1;
  const canPrev = lessonStep > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">The Kāraka System</h1>
          <p className="text-muted-foreground">
            Six semantic roles connect meaning to grammar. Eleven lessons from first principles.
          </p>
          <div className="mt-3">
            <ZoneGate zoneId="karakas" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/learn/suffixes/" className="text-sm text-primary hover:underline">← Suffixes</Link>
          <span className="text-muted-foreground">|</span>
          <Link href="/learn/verbs/" className="text-sm text-primary hover:underline">Verbs →</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {KARAKA_LESSONS.map((_, i) => (
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
        description="Multiple choice quiz on the six kārakas and their case mappings."
      >
        <MultipleChoiceQuiz
          questions={KARAKA_QUIZ_QUESTIONS}
          title="Kāraka Quiz"
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
          onClick={() => setLessonStep((s) => Math.min(KARAKA_LESSONS.length - 1, s + 1))}
          disabled={!canNext}
          className={cn("text-primary hover:underline", !canNext && "opacity-50 cursor-not-allowed")}
        >
          Next lesson →
        </button>
      </div>
    </div>
  );
}
