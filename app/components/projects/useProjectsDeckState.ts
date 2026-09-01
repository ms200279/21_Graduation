import { useCallback, useRef, useState } from "react";

import {
  createCylinderRows,
  getAllProjectCards,
  getProjectDeck,
  type ProjectCard,
} from "./projectsCylinderConfig";

type DeckDrawResult = {
  card: ProjectCard;
  deck: ProjectCard[];
  seed: number;
};

export function drawProjectDeckCard(
  deck: ProjectCard[],
  seed: number,
  projectIds: number[],
  blockedCards: ProjectCard[],
): DeckDrawResult {
  const uniqueCount = new Set(projectIds).size;
  const blockedIds = new Set(blockedCards.map((card) => card.id));
  const allowDuplicates = uniqueCount <= blockedIds.size;
  let nextDeck = deck;
  let nextSeed = seed;
  const getAvailableDeckCards = () =>
    allowDuplicates
      ? nextDeck
      : nextDeck.filter((card) => !blockedIds.has(card.id));

  let availableCards = getAvailableDeckCards();

  if (availableCards.length === 0) {
    nextSeed += 1;
    nextDeck = getProjectDeck(nextSeed, projectIds);
    availableCards = getAvailableDeckCards();
  }

  const nextCard =
    availableCards[0] ??
    getAllProjectCards(projectIds).find(
      (card) => allowDuplicates || !blockedIds.has(card.id),
    ) ??
    getAllProjectCards(projectIds)[0];

  if (!nextCard) {
    return {
      card: blockedCards[0] ?? { id: projectIds[0] ?? 1 },
      deck: nextDeck,
      seed: nextSeed,
    };
  }

  const nextIndex = nextDeck.findIndex((card) => card.id === nextCard.id);

  if (nextIndex >= 0) {
    nextDeck = [
      ...nextDeck.slice(0, nextIndex),
      ...nextDeck.slice(nextIndex + 1),
    ];
  }

  return { card: nextCard, deck: nextDeck, seed: nextSeed };
}

export function useProjectsDeckState(projectIds: number[]) {
  const initialRows = createCylinderRows(projectIds, 1);
  const deckSeedRef = useRef(1);
  const deckRef = useRef<ProjectCard[]>(initialRows.remaining);
  const activeRowsRef = useRef({
    upper: initialRows.upper,
    lower: initialRows.lower,
  });
  const [upperCards, setUpperCards] = useState(initialRows.upper);
  const [lowerCards, setLowerCards] = useState(initialRows.lower);

  const drawCard = useCallback(
    (blockedCards: ProjectCard[]) => {
      const result = drawProjectDeckCard(
        deckRef.current,
        deckSeedRef.current,
        projectIds,
        blockedCards,
      );

      deckRef.current = result.deck;
      deckSeedRef.current = result.seed;

      return result.card;
    },
    [projectIds],
  );

  const replaceUpperCard = useCallback(
    (index: number) => {
      setUpperCards((currentCards) => {
        const blockedCards = [
          ...activeRowsRef.current.lower,
          ...currentCards.filter((_, cardIndex) => cardIndex !== index),
        ];
        const nextCards = [...currentCards];

        nextCards[index] = drawCard(blockedCards);
        activeRowsRef.current.upper = nextCards;

        return nextCards;
      });
    },
    [drawCard],
  );

  const replaceLowerCard = useCallback(
    (index: number) => {
      setLowerCards((currentCards) => {
        const blockedCards = [
          ...activeRowsRef.current.upper,
          ...currentCards.filter((_, cardIndex) => cardIndex !== index),
        ];
        const nextCards = [...currentCards];

        nextCards[index] = drawCard(blockedCards);
        activeRowsRef.current.lower = nextCards;

        return nextCards;
      });
    },
    [drawCard],
  );

  return {
    upperCards,
    lowerCards,
    replaceUpperCard,
    replaceLowerCard,
  };
}
