"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MultipleChoiceQuiz, type MCQuestion } from "@/components/MultipleChoiceQuiz";
import { LessonPracticeSection } from "@/components/LessonPracticeSection";

const COMPOUND_QUIZ_QUESTIONS: MCQuestion[] = [
  {
    id: "1",
    question: "In a compound, which member typically has the case ending?",
    options: ["The first", "All members", "Only the last", "The head (varies)"],
    correctIndex: 2,
    explanation: "Only the final member has the case ending. Others appear as stems.",
  },
  {
    id: "2",
    question: "महाराजः mahārājaḥ 'great king' is what type of compound?",
    options: ["Tatpuruṣa", "Karmadhāraya", "Bahuvrīhi", "Dvandva"],
    correctIndex: 1,
    explanation: "Karmadhāraya: first describes second. महान् राजा = a king who is great.",
  },
  {
    id: "3",
    question: "दीर्घकेशः dīrghakeśaḥ 'long-haired' is a:",
    options: ["Tatpuruṣa", "Karmadhāraya", "Bahuvrīhi", "Dvandva"],
    correctIndex: 2,
    explanation: "Bahuvrīhi: describes someone whose hair is long. Refers to the person, not the hair.",
  },
  {
    id: "4",
    question: "सूर्यचन्द्रौ sūryacandrau 'sun and moon' is a:",
    options: ["Tatpuruṣa", "Karmadhāraya", "Bahuvrīhi", "Dvandva"],
    correctIndex: 3,
    explanation: "Dvandva = coordination. Dual ending = two things. Sun and moon.",
  },
  {
    id: "5",
    question: "Bahuvrīhis are always:",
    options: ["Nouns", "Adjectives", "Verbs", "Adverbs"],
    correctIndex: 1,
    explanation: "Bahuvrīhis are always adjectives — they describe something outside the compound.",
  },
  {
    id: "6",
    question: "देवपतिः devapatiḥ 'lord of the gods' is a:",
    options: ["Karmadhāraya", "Tatpuruṣa", "Bahuvrīhi", "Dvandva"],
    correctIndex: 1,
    explanation: "Tatpuruṣa: genitive relation. देवानां पतिः = lord of the gods.",
  },
  {
    id: "7",
    question: "When a dvandva refers to exactly two things, it stands in:",
    options: ["Singular", "Dual", "Plural", "Either dual or plural"],
    correctIndex: 1,
    explanation: "Dual for two: सूर्यचन्द्रौ. Plural for more than two.",
  },
  {
    id: "8",
    question: "Avyayībhāva compounds function as:",
    options: ["Nouns", "Adjectives", "Adverbs", "Verbs"],
    correctIndex: 2,
    explanation: "अव्ययीभाव = indeclinable. First member indeclinable, second in ntr acc. Used as adverb.",
  },
];

const COMPOUND_LESSONS: Array<{
  title: string;
  body: string[];
  technicalNote?: string;
  nutshell?: string;
  reviewQuestions?: string[];
}> = [
  {
    title: "1) What is a Compound?",
    body: [
      "A compound (समास samāsa) is a word made of two or more stems joined together. English examples: toothpaste, blackbird, tree house. Sanskrit compounds are always written as one word — and they are far more frequent than in English. A 'kind person' can simply be प्रिय-जन- priya-jana- 'dear-person'; a 'message from Rāma' is राम-वचन- rāma-vacana-.",
      "Sanskrit compounds are often coined on the spot. The meaning does not have to be specialised — it can be exactly the sum of the parts. This makes compounds very common in every type of text. To read Sanskrit fluently, you must learn to split compounds and identify their type.",
    ],
    nutshell: "समास = compound. Two or more stems → one word. Very frequent in Sanskrit.",
    reviewQuestions: ["How are Sanskrit compounds written?", "How does Sanskrit compound meaning differ from English?"],
  },
  {
    title: "2) Stems in Compounds",
    body: [
      "In a compound, only the final member normally has a case ending. The other members appear in their stem form. अश्व-कोविदः aśva-kovidaḥ 'horse-knowing' — अश्व would be अश्वानां or अश्वेषु if used separately; in the compound, just the stem अश्व- appears.",
      "This is like English swordfight (not swordsfight) or bookseller — the first element is stem-like. The relation between the members (possessive, instrumental, etc.) is implied, not overtly marked. You infer it from meaning and context.",
    ],
    technicalNote: "Exceptions: aluk compounds retain a case ending on the first member (e.g. दास्याः-पुत्र- 'son of a female slave'). Āmreḍita compounds repeat an inflected form.",
    nutshell: "All members but the last appear as stems. Case relation is inferred.",
    reviewQuestions: ["Which member of a compound has the case ending?", "What form do the other members take?"],
  },
  {
    title: "3) The Four Main Types",
    body: [
      "Sanskrit compounds fall into four main types: (1) Tatpuruṣa — one member is grammatically dependent on the other. (2) Karmadhāraya — a subtype where the first describes the second (like 'blackbird'). (3) Bahuvrīhi — the compound as a whole describes something outside it (like 'barefoot'). (4) Dvandva — coordination, 'X and Y'.",
      "A fifth type, Avyayībhāva, forms adverbial compounds (indeclinable). We will look at each in turn. The key to identification: what relation do the members have? Is the compound a noun or an adjective? Does it refer to its last member or to something else?",
    ],
    nutshell: "Tatpuruṣa, Karmadhāraya, Bahuvrīhi, Dvandva, Avyayībhāva.",
    reviewQuestions: ["Name the four main compound types.", "What question helps identify the type?"],
  },
  {
    title: "4) Karmadhāraya — Descriptive",
    body: [
      "A Karmadhāraya (कर्मधारय) is a compound where the first member describes the second. If we split it into separate words, they would stand in the same case: महा-राजः mahā-rājaḥ 'great king' = महान् राजा 'a king who is great'. रजत-पात्रम् rajata-pātram 'silver vessel' = रजतम् पात्रम् 'a vessel that is silver'.",
      "The first member is typically an adjective. The compound refers to the second member (the head). Blackbird in English is similar — a bird that is black. Ruby-red is a colour like a ruby.",
    ],
    technicalNote: "Karmadhāraya is a traditional name; its literal meaning is unclear. Western term: descriptive or appositional compound.",
    nutshell: "First describes second. Same case if split. Head = second member.",
    reviewQuestions: ["What case would the members of a karmadhāraya be in if split?", "Give an example."],
  },
  {
    title: "5) Tatpuruṣa — Dependent Determinative",
    body: [
      "A Tatpuruṣa (तत्पुरुष) has a case relation between members other than same-case description. देव-पतिः deva-patiḥ 'lord of the gods' — देवेषां पतिः 'lord of the gods' (genitive). अश्व-कोविदः aśva-kovidaḥ 'knowledgeable about horses' — instrumental or genitive relation.",
      "Tree house = house in a tree (locative). Gunfight = fight with guns (instrumental). Cookbook = book for cooks (dative). The first member is grammatically dependent on the second. The compound refers to the second member (the head).",
    ],
    technicalNote: "Tatpuruṣa literally means 'his servant' — it is itself a tatpuruṣa (tat- 'his', puruṣa- 'servant'). The dependent member can express any case relation.",
    nutshell: "First dependent on second (gen, instr, dat, etc.). Head = second member.",
    reviewQuestions: ["What is the difference between karmadhāraya and tatpuruṣa?", "What does तत्पुरुष mean literally?"],
  },
  {
    title: "6) Bahuvrīhi — Possessive/Exocentric",
    body: [
      "A Bahuvrīhi (बहुव्रीहि) does not refer to its last member. It is an adjective describing something whose Y is X. दीर्घ-केशः dīrgha-keśaḥ 'long-haired' — not 'a long hair', but 'someone whose hair is long'. महा-मुखः mahā-mukhaḥ 'big-mouthed' — whose mouth is big.",
      "Bahuvrīhis are always adjectives. They agree in gender with the noun they describe. The noun may be omitted: दीर्घकेशः could stand alone for 'the long-haired one'. Barefoot, brown-eyed, king-size in English are similar.",
    ],
    technicalNote: "Bahuvrīhi literally means 'having much rice' — originally of fertile land; later 'rich'. Western term: possessive or exocentric compound.",
    nutshell: "Bahuvrīhi = adjective. 'Whose Y is X'. Refers to something outside the compound.",
    reviewQuestions: ["Why is a bahuvrīhi always an adjective?", "What does दीर्घकेशः mean?"],
  },
  {
    title: "7) Dvandva — Coordination",
    body: [
      "A Dvandva (द्वन्द्व) coordinates two or more members with 'and'. सूर्य-चन्द्रौ sūrya-candrau 'sun and moon' — note the dual ending, indicating two things. पुत्र-पौत्राः putra-pautrāḥ 'sons and grandsons' (plural when more than two).",
      "When the dvandva refers to exactly two, it stands in the dual. When it refers to more than two, plural. The meaning is the sum of the parts — but for पुत्रपौत्राः, context alone tells you whether it's one son + several grandsons, several of each, etc.",
    ],
    technicalNote: "Dvandva = द्वम् + द्वम् 'two and two' = 'pair'. Some dvandvas in English: singer-songwriter (one person who is both), bitter-sweet (one thing with two qualities).",
    nutshell: "Dvandva = X and Y. Dual if two, plural if more. Coordinative.",
    reviewQuestions: ["What case/number does a dvandva of two things take?", "What does द्वन्द्व mean?"],
  },
  {
    title: "8) Avyayībhāva — Adverbial",
    body: [
      "An Avyayībhāva (अव्ययीभाव) has an indeclinable first member (adverb, preverb) and a second member in neuter accusative. The whole is used as an adverb. उप-गृहम् upa-gṛham 'near the house' (adverbial). यथा-आगतम् yathā-āgatam 'as come' = 'as they had come'.",
      "These compounds are less common than the others. The first member is often a preverb or particle. सम्-अक्षम् sam-akṣam 'with the eye' = 'in sight'.",
    ],
    nutshell: "Avyayībhāva = indeclinable + noun (ntr acc). Used as adverb.",
    reviewQuestions: ["What part of speech does an avyayībhāva function as?", "What form does the second member take?"],
  },
  {
    title: "9) Analysing Compounds",
    body: [
      "To analyse a compound: (1) Split it into members. (2) Identify the possible relations. राज-पुत्रः could be tatpuruṣa 'son of a king' or bahuvrīhi 'whose son is a king'. (3) Use context. If it agrees with a noun as an adjective, bahuvrīhi. If it is the subject/object, likely tatpuruṣa or karmadhāraya.",
      "Longer compounds nest: [[राज्य-सुख-]लोभः] 'greed for royal happiness' — karmadhāraya inside tatpuruṣa. Work from the inside out. Ambiguity is common; commentators often discuss multiple interpretations.",
    ],
    nutshell: "Split → identify relation → check context. Nested compounds: parse inside out.",
    reviewQuestions: ["What makes राजपुत्रः ambiguous?", "How do you parse a nested compound?"],
  },
  {
    title: "10) The Nutshell & Exercises",
    body: [
      "Only the last member has a case ending. Tatpuruṣa and karmadhāraya refer to the last member; bahuvrīhi refers to something outside; dvandva lists. Bahuvrīhis are always adjectives — a quick test. When in doubt, try each analysis and see which fits the context.",
      "Practice: Split उत्सन्नकुलधर्मः (destroyed-family-law = whose family laws are destroyed — bahuvrīhi containing tatpuruṣa). Split सूर्यचन्द्रौ (sun-moon = sun and moon — dvandva). Proceed to Reading to apply this to real texts.",
    ],
    nutshell: "Last member = head (except bahuvrīhi, dvandva). Bahuvrīhi = adjective. Context disambiguates.",
    reviewQuestions: ["What quick test identifies a bahuvrīhi?", "Split सूर्यचन्द्रौ and give its type."],
  },
];

export default function CompoundsPage() {
  const [lessonStep, setLessonStep] = useState(0);
  const [showTechnical, setShowTechnical] = useState<Record<number, boolean>>({});

  const lesson = COMPOUND_LESSONS[lessonStep];
  const canNext = lessonStep < COMPOUND_LESSONS.length - 1;
  const canPrev = lessonStep > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Compound Words (Samāsa)</h1>
          <p className="text-muted-foreground">
            Four main types with distinct logic. Ten lessons from first principles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/learn/verbs/" className="text-sm text-primary hover:underline">← Verbs</Link>
          <span className="text-muted-foreground">|</span>
          <Link href="/learn/reading/" className="text-sm text-primary hover:underline">Reading →</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {COMPOUND_LESSONS.map((_, i) => (
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
        description="Multiple choice quiz on compound types and their identification."
      >
        <MultipleChoiceQuiz
          questions={COMPOUND_QUIZ_QUESTIONS}
          title="Compound Quiz"
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
          onClick={() => setLessonStep((s) => Math.min(COMPOUND_LESSONS.length - 1, s + 1))}
          disabled={!canNext}
          className={cn("text-primary hover:underline", !canNext && "opacity-50 cursor-not-allowed")}
        >
          Next lesson →
        </button>
      </div>
    </div>
  );
}
