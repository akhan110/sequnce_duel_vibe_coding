export type Suit = 'S' | 'H' | 'D' | 'C'; // Spades, Hearts, Diamonds, Clubs
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'Q' | 'K' | 'A' | 'J';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // Unique instanced ID of the card (since it is a double deck)
}

export interface BoardCell {
  type?: 'FREE';
  suit?: Suit;
  rank?: Rank;
}

export type ChipColor = 'red' | 'green' | 'blue';

export interface Player {
  uid: string;
  name: string;
  color: ChipColor;
  isHost: boolean;
  hand: Card[];
  isOnline: boolean;
  coins?: number;
  xp?: number;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderColor: ChipColor;
  text: string;
  timestamp: number;
}

export interface GameAction {
  playerUid: string;
  playerName: string;
  type: 'PLACE' | 'JACK_WILD' | 'JACK_REMOVE' | 'DISCARD_DEAD' | 'PASS' | 'JOIN' | 'CHAT';
  card?: {
    suit: Suit;
    rank: Rank;
  };
  row?: number;
  col?: number;
  timestamp: number;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'playing' | 'completed';
  mode: 'online' | 'ai' | 'local';
  players: Player[];
  currentTurn: string; // Player UID
  boardChips: Record<string, ChipColor>; // Key: "row_col" -> Color
  deck: Card[];
  discardPile: Card[];
  winnerUid: string | null;
  winningSequences: [number, number][][]; // List of coordinate lines (each is array of 5 coordinates)
  chat: ChatMessage[];
  lastAction: GameAction | null;
  createdAt: any;
  updatedAt: any;
  coinStake?: number;
  maxPlayers?: number;
  sequencesToWin?: number;
  lastReaction?: {
    emoji: string;
    senderUid: string;
    senderName: string;
    timestamp: number;
  } | null;
}
