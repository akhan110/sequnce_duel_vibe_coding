import { Card, BoardCell, ChipColor, Suit, Rank } from '../types';

export const BOARD_LAYOUT: BoardCell[][] = [
  [ { type: 'FREE' }, { suit: 'S', rank: '2' }, { suit: 'S', rank: '3' }, { suit: 'S', rank: '4' }, { suit: 'S', rank: '5' }, { suit: 'S', rank: '6' }, { suit: 'S', rank: '7' }, { suit: 'S', rank: '8' }, { suit: 'S', rank: '9' }, { type: 'FREE' } ],
  [ { suit: 'C', rank: '6' }, { suit: 'C', rank: '5' }, { suit: 'C', rank: '4' }, { suit: 'C', rank: '3' }, { suit: 'C', rank: '2' }, { suit: 'H', rank: 'A' }, { suit: 'H', rank: 'K' }, { suit: 'H', rank: 'Q' }, { suit: 'H', rank: '10' }, { suit: 'S', rank: '10' } ],
  [ { suit: 'C', rank: '7' }, { suit: 'S', rank: 'A' }, { suit: 'D', rank: '2' }, { suit: 'D', rank: '3' }, { suit: 'D', rank: '4' }, { suit: 'D', rank: '5' }, { suit: 'D', rank: '6' }, { suit: 'D', rank: '7' }, { suit: 'H', rank: '9' }, { suit: 'S', rank: 'Q' } ],
  [ { suit: 'C', rank: '8' }, { suit: 'S', rank: 'K' }, { suit: 'C', rank: 'A' }, { suit: 'H', rank: '7' }, { suit: 'H', rank: '6' }, { suit: 'H', rank: '5' }, { suit: 'H', rank: '4' }, { suit: 'D', rank: '8' }, { suit: 'H', rank: '8' }, { suit: 'S', rank: 'K' } ],
  [ { suit: 'C', rank: '9' }, { suit: 'S', rank: '10' }, { suit: 'C', rank: 'K' }, { suit: 'H', rank: '8' }, { suit: 'H', rank: '2' }, { suit: 'H', rank: '3' }, { suit: 'H', rank: '2' }, { suit: 'D', rank: '9' }, { suit: 'H', rank: '7' }, { suit: 'S', rank: 'A' } ],
  [ { suit: 'C', rank: '10' }, { suit: 'S', rank: '9' }, { suit: 'C', rank: 'Q' }, { suit: 'H', rank: '9' }, { suit: 'H', rank: 'A' }, { suit: 'H', rank: 'K' }, { suit: 'H', rank: '3' }, { suit: 'D', rank: '10' }, { suit: 'H', rank: '6' }, { suit: 'D', rank: '2' } ],
  [ { suit: 'C', rank: 'Q' }, { suit: 'S', rank: '8' }, { suit: 'C', rank: '10' }, { suit: 'H', rank: '10' }, { suit: 'H', rank: 'Q' }, { suit: 'D', rank: 'Q' }, { suit: 'H', rank: '4' }, { suit: 'D', rank: 'Q' }, { suit: 'H', rank: '5' }, { suit: 'D', rank: '3' } ],
  [ { suit: 'C', rank: 'K' }, { suit: 'S', rank: '7' }, { suit: 'C', rank: '9' }, { suit: 'C', rank: '8' }, { suit: 'C', rank: '7' }, { suit: 'C', rank: '6' }, { suit: 'C', rank: '5' }, { suit: 'D', rank: 'K' }, { suit: 'H', rank: '4' }, { suit: 'D', rank: '4' } ],
  [ { suit: 'C', rank: 'A' }, { suit: 'S', rank: '6' }, { suit: 'S', rank: '5' }, { suit: 'S', rank: '4' }, { suit: 'S', rank: '3' }, { suit: 'S', rank: '2' }, { suit: 'C', rank: '4' }, { suit: 'D', rank: 'A' }, { suit: 'H', rank: '5' }, { suit: 'D', rank: '5' } ],
  [ { type: 'FREE' }, { suit: 'C', rank: '3' }, { suit: 'C', rank: '2' }, { suit: 'H', rank: '2' }, { suit: 'H', rank: '3' }, { suit: 'H', rank: '4' }, { suit: 'H', rank: '5' }, { suit: 'H', rank: '6' }, { suit: 'H', rank: '7' }, { type: 'FREE' } ]
];

// Helper to check if a cell is an un-claimable corner space
export function isCorner(row: number, col: number): boolean {
  return (row === 0 && col === 0) ||
         (row === 0 && col === 9) ||
         (row === 9 && col === 0) ||
         (row === 9 && col === 9);
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Q', 'K', 'A', 'J'];
  
  for (let d = 0; d < 2; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit,
          rank,
          id: `${suit}_${rank}_deck${d}_${Math.random().toString(36).substring(2, 6)}`
        });
      }
    }
  }
  return shuffle(deck);
}

// Check if a normal card is 'dead' (both spaces on the board are occupied by any color chips)
export function isDeadCard(card: Card, boardChips: Record<string, ChipColor>): boolean {
  if (card.rank === 'J') {
    // Jacks are never dead, they're wild or removal
    return false;
  }
  const matchCells: [number, number][] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = BOARD_LAYOUT[r][c];
      if (cell.type !== 'FREE' && cell.suit === card.suit && cell.rank === card.rank) {
        matchCells.push([r, c]);
      }
    }
  }
  // If all matching positions are already claimed
  return matchCells.every(([r, c]) => boardChips[`${r}_${c}`] !== undefined);
}

// Find matching cells on board for a selected card
export function getMatchingCells(card: Card, boardChips: Record<string, ChipColor>, winningSequences: [number, number][][]): [number, number][] {
  const result: [number, number][] = [];
  
  // Two-eyed Jacks (C, D) are completely WILD: can place anywhere NOT already occupied or a corner
  const isTwoEyedJack = card.rank === 'J' && (card.suit === 'C' || card.suit === 'D');
  // One-eyed Jacks (S, H) are REMOVAL: can remove any opponent chip that is NOT part of a completed sequence
  const isOneEyedJack = card.rank === 'J' && (card.suit === 'S' || card.suit === 'H');

  if (isTwoEyedJack) {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (!isCorner(r, c) && boardChips[`${r}_${c}`] === undefined) {
          result.push([r, c]);
        }
      }
    }
    return result;
  }

  if (isOneEyedJack) {
    // Generate flat list of winning sequence cells which are sealed/unremovable
    const sealedCells = new Set<string>();
    winningSequences.forEach(seq => {
      seq.forEach(([r, c]) => sealedCells.add(`${r}_${c}`));
    });

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (!isCorner(r, c) && boardChips[`${r}_${c}`] !== undefined && !sealedCells.has(`${r}_${c}`)) {
          result.push([r, c]);
        }
      }
    }
    return result;
  }

  // Normal card matches
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const cell = BOARD_LAYOUT[r][c];
      if (cell.type !== 'FREE' && cell.suit === card.suit && cell.rank === card.rank) {
        if (boardChips[`${r}_${c}`] === undefined) {
          result.push([r, c]);
        }
      }
    }
  }

  return result;
}

// Real-time sequence evaluator
// Given board chips and a player color, locate all 5-in-a-rows (including Free corners)
export function detectSequences(boardChips: Record<string, ChipColor>, playerColor: ChipColor): [number, number][][] {
  const lines: [number, number][][] = [];
  
  // Helper to check if a single cell is owned by color or is wild corner
  const isColorOrCorner = (r: number, c: number): boolean => {
    if (isCorner(r, c)) return true;
    return boardChips[`${r}_${c}`] === playerColor;
  };

  const checkLineAndAdd = (coords: [number, number][]) => {
    if (coords.length === 5) {
      lines.push(coords);
    }
  };

  // 1. Horizontal Sequences
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c <= 5; c++) {
      let isSeq = true;
      const coords: [number, number][] = [];
      for (let len = 0; len < 5; len++) {
        if (!isColorOrCorner(r, c + len)) {
          isSeq = false;
          break;
        }
        coords.push([r, c + len]);
      }
      if (isSeq) checkLineAndAdd(coords);
    }
  }

  // 2. Vertical Sequences
  for (let c = 0; c < 10; c++) {
    for (let r = 0; r <= 5; r++) {
      let isSeq = true;
      const coords: [number, number][] = [];
      for (let len = 0; len < 5; len++) {
        if (!isColorOrCorner(r + len, c)) {
          isSeq = false;
          break;
        }
        coords.push([r + len, c]);
      }
      if (isSeq) checkLineAndAdd(coords);
    }
  }

  // 3. Diagonal Down-Right Sequences
  for (let r = 0; r <= 5; r++) {
    for (let c = 0; c <= 5; c++) {
      let isSeq = true;
      const coords: [number, number][] = [];
      for (let len = 0; len < 5; len++) {
        if (!isColorOrCorner(r + len, c + len)) {
          isSeq = false;
          break;
        }
        coords.push([r + len, c + len]);
      }
      if (isSeq) checkLineAndAdd(coords);
    }
  }

  // 4. Diagonal Up-Right Sequences
  for (let r = 4; r < 10; r++) {
    for (let c = 0; c <= 5; c++) {
      let isSeq = true;
      const coords: [number, number][] = [];
      for (let len = 0; len < 5; len++) {
        if (!isColorOrCorner(r - len, c + len)) {
          isSeq = false;
          break;
        }
        coords.push([r - len, c + len]);
      }
      if (isSeq) checkLineAndAdd(coords);
    }
  }

  // Deduplicate overlapping combinations that describe identical sequences
  // In sequence, we need distinct combinations of 5. If chips 0-8 are filled, it's 2 sequences (0-4, 4-8 sharing middle)
  // Let's perform a simple filters so we don't count duplicate indexes for 1 sequence when it's exactly the same 5-set
  const seenStr = new Set<string>();
  const uniqLines: [number, number][][] = [];

  for (const line of lines) {
    const sortedStr = [...line].map(([r, c]) => `${r}_${c}`).sort().join('|');
    if (!seenStr.has(sortedStr)) {
      seenStr.add(sortedStr);
      uniqLines.push(line);
    }
  }

  return uniqLines;
}

// Bot AI Agent: Compute the smartest move
export function playBotTurn(
  botHand: Card[],
  boardChips: Record<string, ChipColor>,
  botColor: ChipColor,
  playerColor: ChipColor,
  winningSequences: [number, number][][]
): { cardIndex: number; row: number; col: number; actionType: 'PLACE' | 'JACK_WILD' | 'JACK_REMOVE' | 'DISCARD_DEAD' } {
  
  // 1. Check for Dead Cards first (high priority to cycle hand)
  for (let i = 0; i < botHand.length; i++) {
    if (isDeadCard(botHand[i], boardChips)) {
      // Find a dummy center position just for logs, or random cell that matches layout to discard
      return { cardIndex: i, row: -1, col: -1, actionType: 'DISCARD_DEAD' };
    }
  }

  // 2. Collect all options
  interface Candidate {
    cardIndex: number;
    row: number;
    col: number;
    score: number;
    type: 'PLACE' | 'JACK_WILD' | 'JACK_REMOVE';
  }

  const candidates: Candidate[] = [];

  botHand.forEach((card, cIndex) => {
    const matches = getMatchingCells(card, boardChips, winningSequences);
    const isTwoEyed = card.rank === 'J' && (card.suit === 'C' || card.suit === 'D');
    const isOneEyed = card.rank === 'J' && (card.suit === 'S' || card.suit === 'H');

    matches.forEach(([r, c]) => {
      let score = 0;

      // Base heuristic: check if placing here forms or blocks sequence
      if (isOneEyed) {
        // ONE-EYED JACK: Removing an opponent chip. 
        // Analyze how critical that opponent chip was to their sequence progress
        score = evaluateStrategicValue(r, c, boardChips, playerColor) * 1.5;
        candidates.push({ cardIndex: cIndex, row: r, col: c, score, type: 'JACK_REMOVE' });
      } else {
        // PLACE or WILD
        // Analyze how close we are to forming sequence here
        const botValue = evaluateStrategicValue(r, c, boardChips, botColor);
        // Analyze how close player is (block them!)
        const playerValue = evaluateStrategicValue(r, c, boardChips, playerColor);

        // Prioritize winning (botValue) over blocking (playerValue)
        score = botValue * 1.3 + playerValue * 1.1;

        // Extra points for wild value if strategic
        if (isTwoEyed) {
          score += 2; // Added premium for flexibility
        }

        candidates.push({ 
          cardIndex: cIndex, 
          row: r, 
          col: c, 
          score, 
          type: isTwoEyed ? 'JACK_WILD' : 'PLACE' 
        });
      }
    });
  });

  // If no moves, play random or cycle first card
  if (candidates.length === 0) {
    return { cardIndex: 0, row: -1, col: -1, actionType: 'DISCARD_DEAD' };
  }

  // Sort descending
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  return {
    cardIndex: best.cardIndex,
    row: best.row,
    col: best.col,
    actionType: best.type as any
  };
}

// Evaluate strategic value of a cell: look in 4 directions and see how many chips we can align
function evaluateStrategicValue(row: number, col: number, boardChips: Record<string, ChipColor>, targetColor: ChipColor): number {
  let score = 0;
  const dirs = [
    [0, 1],   // H
    [1, 0],   // V
    [1, 1],   // DR
    [-1, 1]   // UR
  ];

  const isMyColorOrCorner = (r: number, _c: number): boolean => {
    if (r < 0 || r >= 10 || _c < 0 || _c >= 10) return false;
    if (isCorner(r, _c)) return true;
    return boardChips[`${r}_${_c}`] === targetColor;
  };

  const isEnemyColor = (r: number, _c: number): boolean => {
    if (r < 0 || r >= 10 || _c < 0 || _c >= 10) return false;
    if (isCorner(r, _c)) return false;
    const owner = boardChips[`${r}_${_c}`];
    return owner !== undefined && owner !== targetColor;
  };

  dirs.forEach(([dr, dc]) => {
    // Check range of 5 slots crossing this cell
    for (let offset = -4; offset <= 0; offset++) {
      let aligns = 0;
      let blocked = false;

      for (let step = 0; step < 5; step++) {
        const checkR = row + (offset + step) * dr;
        const checkC = col + (offset + step) * dc;

        if (checkR < 0 || checkR >= 10 || checkC < 0 || checkC >= 10) {
          blocked = true;
          break;
        }

        if (checkR === row && checkC === col) {
          // This is the placement cell
          continue;
        }

        if (isEnemyColor(checkR, checkC)) {
          blocked = true;
          break;
        }

        if (isMyColorOrCorner(checkR, checkC)) {
          aligns++;
        }
      }

      if (!blocked) {
        // High score scaling as we approach completed 5-sequence
        score += Math.pow(aligns + 1, 2.5);
      }
    }
  });

  return score;
}
