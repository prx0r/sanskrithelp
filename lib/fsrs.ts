import { FSRS, Card, Rating as FSRSRatingEnum, State, createEmptyCard } from "ts-fsrs";
import type { FSRSState, DrillMode } from "./types";

const fsrs = new FSRS({});

export type Rating = 1 | 2 | 3 | 4;
export type RatingLabel = "Again" | "Hard" | "Good" | "Easy";

export const RATING_LABELS: { [key in Rating]: RatingLabel } = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

export const RATING_COLORS: { [key in Rating]: string } = {
  1: "bg-rose-500",
  2: "bg-amber-500",
  3: "bg-emerald-500",
  4: "bg-sky-500",
};

function stateToFSRSCard(cardState: FSRSState): Card {
  return {
    due: cardState.dueDate,
    stability: cardState.stability,
    difficulty: cardState.difficulty,
    elapsed_days: cardState.lastReview
      ? Math.floor((Date.now() - cardState.lastReview.getTime()) / (24 * 60 * 60 * 1000))
      : 0,
    scheduled_days: 0,
    reps: cardState.reps,
    lapses: cardState.lapses,
    state: cardState.reps === 0 ? State.New : State.Review,
    last_review: cardState.lastReview,
  };
}

function fsrsCardToState(card: Card, cardId: string, userId: string, mode: DrillMode): FSRSState {
  return {
    cardId,
    userId,
    mode,
    stability: card.stability,
    difficulty: card.difficulty,
    dueDate: card.due,
    lastReview: card.last_review || new Date(),
    reps: card.reps,
    lapses: card.lapses,
  };
}

export function createEmptyFSRSState(cardId: string, userId: string, mode: DrillMode): FSRSState {
  const card = createEmptyCard(new Date());
  return fsrsCardToState(card, cardId, userId, mode);
}

// Map our 1-4 rating to ts-fsrs 0-3 (Again, Hard, Good, Easy)
const RATING_TO_FSRS: Record<Rating, FSRSRatingEnum> = {
  1: FSRSRatingEnum.Again,
  2: FSRSRatingEnum.Hard,
  3: FSRSRatingEnum.Good,
  4: FSRSRatingEnum.Easy,
};

export function scheduleCard(cardState: FSRSState, rating: Rating): FSRSState {
  const card = stateToFSRSCard(cardState);
  const fsrsRating = RATING_TO_FSRS[rating];

  const now = new Date();
  const scheduling = fsrs.repeat(card, now);
  const result = scheduling[fsrsRating];

  if (!result?.card) {
    console.error("FSRS repeat returned no result for rating", rating, "scheduling:", scheduling);
    return cardState;
  }

  const newDueDate = result.card.due;
  const newCard: Card = {
    ...result.card,
    due: newDueDate,
  };

  return fsrsCardToState(newCard, cardState.cardId, cardState.userId, cardState.mode);
}

export function isCardDue(cardState: FSRSState): boolean {
  return new Date() >= cardState.dueDate;
}

export function getDaysUntilDue(cardState: FSRSState): number {
  const now = new Date();
  const diff = cardState.dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDueCards(cards: FSRSState[]): FSRSState[] {
  return cards.filter((card) => isCardDue(card));
}

export function getCardStatus(cardState: FSRSState): "new" | "learning" | "review" | "relearning" | "due" {
  if (cardState.reps === 0) return "new";
  if (cardState.lapses > 0 && cardState.reps < 3) return "relearning";
  if (cardState.stability < 1) return "learning";
  return isCardDue(cardState) ? "due" : "review";
}

export function getMasteryLevel(cardState: FSRSState): number {
  const statuses = { new: 0, learning: 1, relearning: 1, due: 2, review: 3 };
  return statuses[getCardStatus(cardState)];
}
