import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, getDocs, collection, query, where, limit, getDocFromServer, serverTimestamp } from 'firebase/firestore';
import { auth, db, loginAnonymously, loginWithGoogle, handleFirestoreError, OperationType } from './lib/firebase';
import { Card, ChipColor, GameState, Player, BoardCell, GameAction, ChatMessage } from './types';
import { 
  BOARD_LAYOUT, 
  generateDeck, 
  detectSequences, 
  isDeadCard, 
  getMatchingCells, 
  playBotTurn,
  isCorner
} from './lib/gameLogic';
import { synth } from './lib/audio';

import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import Hand from './components/Hand';
import Chat from './components/Chat';
import WaitingRoom from './components/WaitingRoom';

import { 
  Share2, Play, Users, LogOut, RotateCcw, Volume2, VolumeX, MessageSquare, 
  Clock, Award, ChevronRight, CheckSquare, Sparkles, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userColor, setUserColor] = useState<ChipColor>('red');
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Game states
  const [currentGame, setCurrentGame] = useState<GameState | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'chat'>('board');
  const [activeRooms, setActiveRooms] = useState<GameState[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState(45);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; name: string; color: ChipColor }[]>([]);

  // Confetti particles for completions
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  // Transition states for smooth lobby auto-close
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionSeconds, setTransitionSeconds] = useState(3);
  const prevGameStatusRef = useRef<string | null>(null);

  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Connection Verification tests
  useEffect(() => {
    if (!user) return;
    const testConnection = async () => {
      try {
        // According to skill rules: "Initially boots, call getFromServer to test the connection"
        const testRef = doc(db, 'games', '_boot_chk_');
        await getDocFromServer(testRef);
        setIsDbConnected(true);
      } catch (err) {
        console.warn("Firestore offline test:", err);
        setIsDbConnected(false);
      }
    };
    testConnection();
  }, [user]);

  useEffect(() => {
    // Subscribe to Auth
    const unsubAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        setUserName(authUser.displayName || `AnonymousPlayer`);
        setAuthError(null);
      } else {
        // Secure Auto-login lazily to support multiplayer matchmaking instantly
        setIsLoggingIn(true);
        loginAnonymously()
          .then((u) => {
            setUser(u);
            setUserName(u.displayName || `GuestPlayer#${Math.floor(Math.random()*900)+100}`);
            setAuthError(null);
          })
          .catch((err: any) => {
            console.warn("Auto anonymous login failed, activating local simulation profile:", err);
            const msg = err?.message || "";
            if (msg.includes("admin-restricted-operation")) {
              setAuthError("Anonymous sign-in is disabled in your Firebase Console.");
            } else {
              setAuthError(msg || "Anonymous login failed");
            }
            
            // Automatically log them in as a simulated user so local offline play/bot modes work instantly out-of-the-box
            const simulatedId = `sim_guest_${Math.floor(Math.random()*8999)+1000}`;
            const simulatedUser = {
              uid: simulatedId,
              displayName: `GuestPlayer#${Math.floor(Math.random()*900)+100}`,
              photoURL: null,
              isAnonymous: true,
              isSimulated: true
            };
            setUser(simulatedUser as any);
            setUserName(simulatedUser.displayName);
          })
          .finally(() => {
            setIsLoggingIn(false);
          });
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const u = await loginWithGoogle();
      setUser(u);
      setUserName(u.displayName || `GooglePlayer#${Math.floor(Math.random()*900)+100}`);
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setAuthError(err?.message || "Google sign-in failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setAuthError(null);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const handleRetryAnonymousLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const u = await loginAnonymously();
      setUser(u);
      setUserName(u.displayName || `GuestPlayer#${Math.floor(Math.random()*900)+100}`);
    } catch (err: any) {
      console.warn("Manual anonymous login failed, activating local simulation profile:", err);
      const msg = err?.message || "";
      if (msg.includes("admin-restricted-operation")) {
        setAuthError("Anonymous sign-in is disabled in your Firebase Console.");
      } else {
        setAuthError(msg || "Anonymous login failed");
      }

      // Automatically log them in as a simulated user so the lobby opens seamlessly
      const simulatedId = `sim_guest_${Math.floor(Math.random()*8999)+1000}`;
      const simulatedUser = {
        uid: simulatedId,
        displayName: `GuestPlayer#${Math.floor(Math.random()*900)+100}`,
        photoURL: null,
        isAnonymous: true,
        isSimulated: true
      };
      setUser(simulatedUser as any);
      setUserName(simulatedUser.displayName);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Query other waiting game lobbies for online list
  useEffect(() => {
    if (!user) {
      setIsLoadingRooms(false);
      return;
    }
    setIsLoadingRooms(true);

    const q = query(
      collection(db, 'games'),
      where('status', '==', 'waiting'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms: GameState[] = [];
      snapshot.forEach((docSnap) => {
        rooms.push(docSnap.data() as GameState);
      });
      setActiveRooms(rooms.filter(r => r.players && r.players.length > 0));
      setIsLoadingRooms(false);
    }, (error) => {
      console.warn("Cannot sync lobbying lists:", error);
      setIsLoadingRooms(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Sync target online room if active using onSnapshot
  useEffect(() => {
    if (!currentGame || currentGame.mode !== 'online') return;

    const docRef = doc(db, 'games', currentGame.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const game = docSnap.data() as GameState;
        setCurrentGame(game);

        // Play drop sound if lastAction was performed by other player
        if (game.lastAction && game.lastAction.playerUid !== user?.uid) {
          if (soundEnabled) {
            if (game.lastAction.type === 'PLACE' || game.lastAction.type === 'JACK_WILD') {
              synth.playChipDrop();
            } else if (game.lastAction.type === 'JACK_REMOVE') {
              synth.playError();
            }
          }
        }

        // Trigger victory sounds if completed
        if (game.status === 'completed' && game.winnerUid === user?.uid) {
          triggerVictoryConfetti();
        }
      } else {
        // Room deleted, leave clean
        setCurrentGame(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `games/${currentGame.id}`);
    });

    return () => unsubscribe();
  }, [currentGame?.id]);

  // 3.4 Listen to lastReaction to trigger floating emoji particles on the fly
  useEffect(() => {
    if (currentGame && currentGame.lastReaction) {
      const { emoji, senderUid, senderName, timestamp } = currentGame.lastReaction;
      const now = Date.now();
      // Ensure the reaction is within last 12 seconds to prevent retro-firing stale reactions on startup
      if (now - timestamp < 12000) {
        const player = currentGame.players?.find(p => p.uid === senderUid);
        const color = player ? player.color : 'red';
        const reactId = `${senderUid}_${timestamp}_${Math.random()}`;
        
        setFloatingReactions(prev => {
          // Deny duplication for the exact matching timestamp
          if (prev.some(r => r.id.includes(`${senderUid}_${timestamp}`))) return prev;
          return [...prev, { id: reactId, emoji, name: senderName, color }];
        });

        if (soundEnabled) {
          synth.playCardDraw();
        }

        const timer = setTimeout(() => {
          setFloatingReactions(prev => prev.filter(r => r.id !== reactId));
        }, 3200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentGame?.lastReaction?.timestamp, currentGame?.lastReaction?.emoji]);

  // 3.45 Handle game completion
  const [processedGames, setProcessedGames] = useState<string[]>([]);
  useEffect(() => {
    if (currentGame && currentGame.status === 'completed' && !processedGames.includes(currentGame.id)) {
      setProcessedGames(prev => [...prev, currentGame.id]);
    }
  }, [currentGame?.status, currentGame?.winnerUid]);

  // 3.5 Handle smooth auto-transition/countdown from waiting lobby to playing board
  useEffect(() => {
    if (currentGame && currentGame.mode === 'online') {
      if (prevGameStatusRef.current === 'waiting' && currentGame.status === 'playing') {
        setIsTransitioning(true);
        setTransitionSeconds(3);
        if (soundEnabled) {
          synth.playCardDraw();
        }
      }
      prevGameStatusRef.current = currentGame.status;
    } else {
      prevGameStatusRef.current = currentGame ? currentGame.status : null;
    }
  }, [currentGame?.status]);

  useEffect(() => {
    if (!isTransitioning) return;

    const interval = setInterval(() => {
      setTransitionSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTransitioning(false);
          return 0;
        }
        if (soundEnabled) {
          synth.playCardDraw();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTransitioning, soundEnabled]);

  // 4. Game Turn Timer clock tracker loop
  useEffect(() => {
    if (currentGame && currentGame.status === 'playing') {
      setTurnTimeLeft(45);
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);

      turnTimerRef.current = setInterval(() => {
        setTurnTimeLeft((prev) => {
          if (prev <= 1) {
            // Auto skip turn or trigger automatic card play
            handleTimeoutTurnEnd();
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
        turnTimerRef.current = null;
      }
    }

    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };
  }, [currentGame?.currentTurn, currentGame?.status]);

  // Trigger bots when active
  useEffect(() => {
    if (currentGame && currentGame.mode === 'ai' && currentGame.status === 'playing') {
      const activePlayer = currentGame.players.find(p => p.uid === currentGame.currentTurn);
      if (activePlayer && activePlayer.uid.startsWith('ai_bot')) {
        const timer = setTimeout(() => {
          triggerAIBotDecision();
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentGame?.currentTurn, currentGame?.status]);

  // Check on Boot parameters for automatic linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && user) {
      // Clear url trace so it doesnt force rejoining
      window.history.replaceState({}, document.title, window.location.pathname);
      handleJoinOnline(userName || 'Player', userColor, roomParam.toUpperCase());
    }
  }, [user]);

  // Handlers for lobby actions
  const handleHostOnline = async (name: string, color: ChipColor, maxPlayers: number = 2, sequencesToWin: number = 2) => {
    if (!user) return;

    try {
      const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      const currentDeck = generateDeck();
      
      // For 4-player games, deal 6 cards each too.
      const hostCards = currentDeck.splice(0, 6);

      const newPlayer: Player = {
        uid: user.uid,
        name,
        color,
        isHost: true,
        hand: hostCards,
        isOnline: true
      };

      const initialGame: GameState = {
        id: roomId,
        status: 'waiting',
        mode: 'online',
        players: [newPlayer],
        currentTurn: user.uid,
        boardChips: {},
        deck: currentDeck,
        discardPile: [],
         winnerUid: null,
        winningSequences: [],
        maxPlayers,
        sequencesToWin,
        chat: [{
          id: `sys_${Date.now()}`,
          senderUid: 'system',
          senderName: 'System Log',
          senderColor: 'red',
          text: `Welcome! Sequence room ${roomId} created (${maxPlayers} Players, ${sequencesToWin} Sequences to win). Send passcode to share!`,
          timestamp: Date.now()
        }],
        lastAction: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'games', roomId), initialGame);
      setCurrentGame(initialGame);
      setUserColor(color);
      if (soundEnabled) synth.playCardDraw();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `games/unknown`);
    }
  };

  const handleJoinOnline = async (name: string, color: ChipColor, roomId: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'games', roomId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        alert("Lobby room code not found! Check code and retry.");
        return;
      }

      const game = snap.data() as GameState;
      if (game.status !== 'waiting') {
        alert("Lobby is already playing or complete.");
        return;
      }

      // Check if user is already in players list (frequent on refresh)
      const existingUserIdx = game.players.findIndex(p => p.uid === user.uid);
      if (existingUserIdx !== -1) {
        setCurrentGame(game);
        return;
      }

      const maxPlayers = game.maxPlayers || 2;
      const hostColor = game.players[0].color;
      
      if (game.players.length >= maxPlayers) {
        alert("⚠️ This game room lobby is already full!");
        return;
      }

      // Ensure joining player has different color / correct team color
      let joinedColor = color;
      if (maxPlayers === 4) {
        const team2Color: ChipColor = hostColor === 'red' ? 'blue' : hostColor === 'blue' ? 'red' : 'blue';
        const currentCount = game.players.length; 
        joinedColor = (currentCount % 2 === 0) ? hostColor : team2Color;
      } else {
        if (game.players[0].color === color) {
          joinedColor = color === 'red' ? 'green' : color === 'green' ? 'blue' : 'red';
        }
      }

      const deck = [...game.deck];
      const playerHand = deck.splice(0, 6);

      const challengerPlayer: Player = {
        uid: user.uid,
        name,
        color: joinedColor,
        isHost: false,
        hand: playerHand,
        isOnline: true
      };

      const updatedPlayers = [...game.players, challengerPlayer];

      const joinLog: GameAction = {
        playerUid: user.uid,
        playerName: name,
        type: 'JOIN',
        timestamp: Date.now()
      };

      const isGameStarting = updatedPlayers.length >= maxPlayers;

      const updatedGame: GameState = {
        ...game,
        status: isGameStarting ? 'playing' : 'waiting',
        players: updatedPlayers,
        deck,
        currentTurn: game.players[0].uid, // Host goes first
        chat: [
          ...game.chat,
          {
            id: `sys_${Date.now()}`,
            senderUid: 'system',
            senderName: 'System Log',
            senderColor: 'green',
            text: isGameStarting
              ? `${name} joined! All positions filled (${updatedPlayers.length}/${maxPlayers}). Starting Sequence!`
              : `${name} joined the waiting room. Waiting for other challengers (${updatedPlayers.length}/${maxPlayers} ready).`,
            timestamp: Date.now()
          }
        ],
        lastAction: joinLog,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, updatedGame);
      setCurrentGame(updatedGame);
      setUserColor(joinedColor);
      
      if (isGameStarting) {
        setIsTransitioning(true);
        setTransitionSeconds(3);
      }
      if (soundEnabled) synth.playCardDraw();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `games/${roomId}`);
    }
  };

  const handleJoinLocalAI = (name: string, color: ChipColor, maxPlayers: number = 2, sequencesToWin: number = 2) => {
    const deck = generateDeck();
    
    const players: Player[] = [];
    
    // Player 1 (Human)
    const userHand = deck.splice(0, 6);
    players.push({
      uid: 'human_player',
      name,
      color,
      isHost: true,
      hand: userHand,
      isOnline: true
    });
    
    const aiColor: ChipColor = color === 'red' ? 'green' : 'red';

    if (maxPlayers === 4) {
      // 4 Players: Human & Teammate Bot vs Two Opponent Bots
      const botHand1 = deck.splice(0, 6);
      const botHand2 = deck.splice(0, 6);
      const botHand3 = deck.splice(0, 6);

      // Player 2 is AI Opponent 1
      players.push({
        uid: 'ai_bot_1',
        name: 'AI Bot 1 (Opponent)',
        color: aiColor,
        isHost: false,
        hand: botHand1,
        isOnline: true
      });

      // Player 3 is AI Partner (Teammate)
      players.push({
        uid: 'ai_bot_2',
        name: 'AI Partner (Teammate)',
        color: color,
        isHost: false,
        hand: botHand2,
        isOnline: true
      });

      // Player 4 is AI Bot 2 (Opponent Teammate)
      players.push({
        uid: 'ai_bot_3',
        name: 'AI Bot 2 (Opponent)',
        color: aiColor,
        isHost: false,
        hand: botHand3,
        isOnline: true
      });
    } else {
      // 2 Players
      const botHand = deck.splice(0, 6);
      players.push({
        uid: 'ai_bot',
        name: 'AI Engine bot',
        color: aiColor,
        isHost: false,
        hand: botHand,
        isOnline: true
      });
    }

    const initialGame: GameState = {
      id: 'local_vs_ai',
      status: 'playing',
      mode: 'ai',
      players,
      currentTurn: 'human_player',
      boardChips: {},
      deck,
      discardPile: [],
      winnerUid: null,
      winningSequences: [],
      chat: [],
      lastAction: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      maxPlayers,
      sequencesToWin
    };

    setCurrentGame(initialGame);
    setUserColor(color);
    if (soundEnabled) synth.playCardDraw();
  };

  const handleJoinPassPlay = (p1Name: string, p2Name: string, maxPlayers: number = 2, sequencesToWin: number = 2) => {
    const deck = generateDeck();
    
    const players: Player[] = [];
    
    // Player 1 & 2 hands
    const p1Hand = deck.splice(0, 6);
    const p2Hand = deck.splice(0, 6);

    if (maxPlayers === 4) {
      const p3Hand = deck.splice(0, 6);
      const p4Hand = deck.splice(0, 6);
      
      players.push({
        uid: 'player_1',
        name: p1Name,
        color: 'red',
        isHost: true,
        hand: p1Hand,
        isOnline: true
      });
      players.push({
        uid: 'player_2',
        name: p2Name,
        color: 'green',
        isHost: false,
        hand: p2Hand,
        isOnline: true
      });
      players.push({
        uid: 'player_3',
        name: `${p1Name} Partner`,
        color: 'red',
        isHost: false,
        hand: p3Hand,
        isOnline: true
      });
      players.push({
        uid: 'player_4',
        name: `${p2Name} Partner`,
        color: 'green',
        isHost: false,
        hand: p4Hand,
        isOnline: true
      });
    } else {
      players.push({
        uid: 'player_1',
        name: p1Name,
        color: 'red',
        isHost: true,
        hand: p1Hand,
        isOnline: true
      });
      players.push({
        uid: 'player_2',
        name: p2Name,
        color: 'green',
        isHost: false,
        hand: p2Hand,
        isOnline: true
      });
    }

    const initialGame: GameState = {
      id: 'local_pass_play',
      status: 'playing',
      mode: 'local',
      players,
      currentTurn: 'player_1',
      boardChips: {},
      deck,
      discardPile: [],
      winnerUid: null,
      winningSequences: [],
      chat: [],
      lastAction: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      maxPlayers,
      sequencesToWin
    };

    setCurrentGame(initialGame);
    setUserColor('red');
    if (soundEnabled) synth.playCardDraw();
  };

  // Turn Timeout logic
  const handleTimeoutTurnEnd = () => {
    if (!currentGame || !getCurrentPlayer()) return;
    
    // Auto draw/discard card from hand randomly to avoid freezing
    const activePlayer = getCurrentPlayer()!;
    if (activePlayer.hand.length > 0) {
      const card = activePlayer.hand[0];
      handlePlayCardOnCell(-1, -1, card); // Triggers standard swap-cycle turn toggle
    }
  };

  const handleLeaveGame = () => {
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    setCurrentGame(null);
    setSelectedCard(null);
    setIsTransitioning(false);
  };

  const handleQuickRestart = async () => {
    if (!currentGame) return;

    const deck = generateDeck();
    const p1Hand = deck.splice(0, 6);
    const p2Hand = deck.splice(0, 6);

    const updatedPlayers = currentGame.players.map((plr, idx) => ({
      ...plr,
      hand: idx === 0 ? p1Hand : p2Hand
    }));

    const freshGame: GameState = {
      ...currentGame,
      status: 'playing',
      players: updatedPlayers,
      currentTurn: updatedPlayers[0].uid,
      boardChips: {},
      deck,
      discardPile: [],
      winnerUid: null,
      winningSequences: [],
      chat: [
        ...currentGame.chat,
        {
          id: `sys_${Date.now()}`,
          senderUid: 'system',
          senderName: 'System Log',
          senderColor: 'red',
          text: `A fresh Sequence match has begun! Board cleared.`,
          timestamp: Date.now()
        }
      ],
      lastAction: null,
      updatedAt: serverTimestamp()
    };

    if (currentGame.mode === 'online') {
      try {
        await setDoc(doc(db, 'games', currentGame.id), freshGame);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `games/${currentGame.id}`);
      }
    } else {
      setCurrentGame(freshGame);
    }
    setSelectedCard(null);
    if (soundEnabled) synth.playCardDraw();
  };

  const getMyPlayer = (): Player | undefined => {
    if (!currentGame) return undefined;
    if (currentGame.mode === 'online') {
      return currentGame.players.find(p => p.uid === user?.uid);
    }
    if (currentGame.mode === 'ai') {
      return currentGame.players.find(p => p.uid === 'human_player');
    }
    // For local pass & play, my player is whoever's turn it is currently, so they can click cards in the single screen view
    return currentGame.players.find(p => p.uid === currentGame.currentTurn);
  };

  const getCurrentPlayer = (): Player | undefined => {
    if (!currentGame) return undefined;
    return currentGame.players.find(p => p.uid === currentGame.currentTurn);
  };

  // Trigger Local Bot step
  const triggerAIBotDecision = () => {
    if (!currentGame) return;
    const activePlayer = getCurrentPlayer();
    if (!activePlayer || !activePlayer.uid.startsWith('ai_bot')) return;

    // Use first opposing player to determine opponent's chip color
    const opposingPlayer = currentGame.players.find(p => p.color !== activePlayer.color);
    const opponentColor = opposingPlayer ? opposingPlayer.color : 'green';

    const decision = playBotTurn(
      activePlayer.hand,
      currentGame.boardChips,
      activePlayer.color,
      opponentColor,
      currentGame.winningSequences
    );

    const botCard = activePlayer.hand[decision.cardIndex];

    if (decision.actionType === 'DISCARD_DEAD') {
      // Discard dead/blank card
      handlePlayCardOnCell(-1, -1, botCard, true);
    } else {
      handlePlayCardOnCell(decision.row, decision.col, botCard);
    }
  };

  // Perform card card play triggers
  const handlePlayCardOnCell = async (row: number, col: number, card: Card, forceDiscard = false) => {
    if (!currentGame) return;

    const activePlayer = getCurrentPlayer();
    if (!activePlayer) return;

    const isTwoEyed = card.rank === 'J' && (card.suit === 'C' || card.suit === 'D');
    const isOneEyed = card.rank === 'J' && (card.suit === 'S' || card.suit === 'H');

    // 1. Validation
    if (!forceDiscard && row !== -1 && col !== -1) {
      if (isCorner(row, col)) {
        if (soundEnabled) synth.playError();
        return;
      }
      
      const currentChip = currentGame.boardChips[`${row}_${col}`];
      if (isOneEyed) {
        if (currentChip === undefined) {
          if (soundEnabled) synth.playError();
          return;
        }
      } else {
        if (currentChip !== undefined) {
          if (soundEnabled) synth.playError();
          return;
        }
      }
    }

    // Sound drop feedback
    if (soundEnabled && row !== -1) {
      if (isOneEyed) {
        synth.playError();
      } else {
        synth.playChipDrop();
      }
    }

    // Modify board chips
    const nextBoardChips = { ...currentGame.boardChips };
    if (row !== -1 && col !== -1) {
      if (isOneEyed) {
        delete nextBoardChips[`${row}_${col}`];
      } else {
        nextBoardChips[`${row}_${col}`] = activePlayer.color;
      }
    }

    // Move Card out of player hand and draw new one
    const handWithPlayRemoved = activePlayer.hand.filter(c => c.id !== card.id);
    const nextDeck = [...currentGame.deck];
    
    // Auto-draw a card if deck has remaining
    if (nextDeck.length > 0) {
      const drawnCard = nextDeck.splice(0, 1)[0];
      handWithPlayRemoved.push(drawnCard);
    }

    // Build move actions
    const layoutLabel = row !== -1 ? `${BOARD_LAYOUT[row][col].rank}${getSuitSymbolForLog(BOARD_LAYOUT[row][col].suit)}` : '';
    const logText = forceDiscard 
      ? `${activePlayer.name} discarded a dead card [${card.rank}${getSuitSymbolForLog(card.suit)}] to draw a new card.`
      : isTwoEyed
        ? `${activePlayer.name} played Two-Eyed WILD Jack to place chip at row ${row + 1}, col ${col + 1}`
        : isOneEyed
          ? `${activePlayer.name} used One-Eyed removal Jack to remove opponent chip of color at row ${row + 1}, col ${col + 1}`
          : `${activePlayer.name} played [${card.rank}${getSuitSymbolForLog(card.suit)}] and placed chip at row ${row + 1}, col ${col + 1} (${layoutLabel})`;

    const actionData: GameAction = {
      playerUid: activePlayer.uid,
      playerName: activePlayer.name,
      type: forceDiscard ? 'DISCARD_DEAD' : isTwoEyed ? 'JACK_WILD' : isOneEyed ? 'JACK_REMOVE' : 'PLACE',
      card: { suit: card.suit, rank: card.rank },
      row,
      col,
      timestamp: Date.now()
    };

    // Sequence evaluations for active player
    let nextWinningSeqs = [...currentGame.winningSequences];
    if (row !== -1 && !isOneEyed && !forceDiscard) {
      const activeColorSeqs = detectSequences(nextBoardChips, activePlayer.color);
      
      // Look for newly gained 5-chip lines that weren't counted before
      activeColorSeqs.forEach(newSeq => {
        const alreadyCounted = nextWinningSeqs.some(counted => 
          counted.every(([r, c]) => newSeq.some(([nr, nc]) => nr === r && nc === c))
        );
        if (!alreadyCounted) {
          nextWinningSeqs.push(newSeq);
          if (soundEnabled) synth.playSequenceDone();
          triggerVictoryConfetti();
        }
      });
    }

    // If active player has scored sequencesToWin sequences, they win!
    const mySequencesCount = nextWinningSeqs.filter(seq => {
      // Confirm sequence contains chips of our color (checking non-corners)
      return seq.some(([r, c]) => !isCorner(r, c) && nextBoardChips[`${r}_${c}`] === activePlayer.color);
    }).length;

    let nextWinnerUid = currentGame.winnerUid;
    let nextStatus = currentGame.status;
    const winTarget = currentGame.sequencesToWin || 2;

    if (mySequencesCount >= winTarget) {
      nextWinnerUid = activePlayer.uid;
      nextStatus = 'completed';
      if (soundEnabled) synth.playVictory();
    }

    // Cycle current player UID turn index depending on total players (2 or 4)
    const activePlayerIdx = currentGame.players.findIndex(p => p.uid === activePlayer.uid);
    const nextPlayerIdx = (activePlayerIdx + 1) % currentGame.players.length;
    const nextTurn = currentGame.players[nextPlayerIdx].uid;

    const updatedPlayers = currentGame.players.map(p => {
      if (p.uid === activePlayer.uid) {
        return { ...p, hand: handWithPlayRemoved };
      }
      return p;
    });

    const updatedState: GameState = {
      ...currentGame,
      status: nextStatus,
      players: updatedPlayers,
      currentTurn: nextTurn,
      boardChips: nextBoardChips,
      deck: nextDeck,
      discardPile: [...currentGame.discardPile, card],
      winnerUid: nextWinnerUid,
      winningSequences: nextWinningSeqs,
      chat: [
        ...currentGame.chat,
        {
          id: `log_${Date.now()}`,
          senderUid: 'system',
          senderName: 'Activity Log',
          senderColor: activePlayer.color,
          text: logText,
          timestamp: Date.now()
        }
      ],
      lastAction: actionData,
      updatedAt: serverTimestamp()
    };

    if (currentGame.mode === 'online') {
      try {
        await setDoc(doc(db, 'games', currentGame.id), updatedState);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `games/${currentGame.id}`);
      }
    } else {
      setCurrentGame(updatedState);
    }

    setSelectedCard(null);
  };

  const handleCellClick = React.useCallback((r: number, c: number) => {
    if (selectedCard) {
      handlePlayCardOnCell(r, c, selectedCard);
    }
  }, [selectedCard, currentGame?.id, soundEnabled]);

  // Dead card recycler discard handler
  const handleDiscardDeadCard = (cardId: string) => {
    if (!currentGame) return;
    const activePlr = getCurrentPlayer();
    if (!activePlr) return;

    const targetCard = activePlr.hand.find(c => c.id === cardId);
    if (targetCard) {
      handlePlayCardOnCell(-1, -1, targetCard, true);
    }
  };

  const handleSendReaction = async (emoji: string) => {
    if (!currentGame) return;
    
    if (soundEnabled) {
      synth.playChipDrop();
    }

    if (currentGame.mode === 'online') {
      try {
        const docRef = doc(db, 'games', currentGame.id);
        const reactionLog = {
          emoji,
          senderUid: user?.uid || 'anonymous',
          senderName: userName || 'Player',
          timestamp: Date.now()
        };
        await setDoc(docRef, {
          lastReaction: reactionLog,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed syncing reaction to Firebase:", err);
      }
    } else {
      // Offline trigger overlay animation
      const id = `local_${Date.now()}_${Math.random()}`;
      setFloatingReactions(prev => [...prev, {
        id,
        emoji,
        name: userName || 'Player',
        color: userColor
      }]);
      setTimeout(() => {
        setFloatingReactions(prev => prev.filter(r => r.id !== id));
      }, 3200);

      // VS AI bot quick response probability trigger
      if (currentGame.mode === 'ai') {
        setTimeout(() => {
          const rId = `ai_${Date.now()}`;
          const aiAnswers = ['😎', '😠', '😂', '👍', '😮'];
          const aiChoice = aiAnswers[Math.floor(Math.random() * aiAnswers.length)];
          setFloatingReactions(prev => [...prev, {
            id: rId,
            emoji: aiChoice,
            name: 'Strategic BOT',
            color: 'green'
          }]);
          setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== rId));
          }, 3200);
        }, 1500);
      }
    }
  };

  const handleSendChatMessage = async (text: string) => {
    if (!currentGame || !user) return;

    const chatMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      senderUid: user.uid,
      senderName: userName || 'Player',
      senderColor: userColor,
      text,
      timestamp: Date.now()
    };

    const updatedState = {
      ...currentGame,
      chat: [...currentGame.chat, chatMsg],
      updatedAt: serverTimestamp()
    } as any;

    if (currentGame.mode === 'online') {
      try {
        await setDoc(doc(db, 'games', currentGame.id), updatedState);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `games/${currentGame.id}`);
      }
    } else {
      setCurrentGame(updatedState);
    }
  };

  const getSuitSymbolForLog = (suit?: string) => {
    switch (suit) {
      case 'S': return '♠';
      case 'H': return '♥';
      case 'D': return '♦';
      case 'C': return '♣';
      default: return '';
    }
  };

  // Confetti micro-blasts
  const triggerVictoryConfetti = () => {
    const list = Array.from({ length: 40 }).map((_, i) => ({
      id: i + Date.now(),
      x: Math.random() * 80 + 10,
      y: Math.random() * 40 + 20,
      color: ['#ef4444', '#10b981', '#06b6d4', '#f59e0b'][Math.floor(Math.random() * 4)]
    }));
    setConfetti(list);
    setTimeout(() => setConfetti([]), 4000);
  };

  const isPlayingGame = currentGame && currentGame.status !== 'waiting' && !isTransitioning;
  const isMyTurn = currentGame
    ? currentGame.mode === 'online'
      ? currentGame.currentTurn === user?.uid
      : currentGame.mode === 'ai'
        ? currentGame.currentTurn === 'human_player'
        : true
    : false;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 selection:bg-rose-500 selection:text-white relative overflow-hidden flex flex-col justify-between">
      {/* Background Soft Color Halos */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[5%] w-[45%] h-[45%] bg-[#e22d7a]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[5%] left-[5%] w-[45%] h-[45%] bg-[#3ab3c2]/5 rounded-full blur-[120px]"></div>
      </div>

      {/* 1. LOBBY CONTAINER VIEWS */}
      {!currentGame && (
        <Lobby
          onJoinLocalAI={handleJoinLocalAI}
          onJoinPassPlay={handleJoinPassPlay}
          onHostOnline={handleHostOnline}
          onJoinOnlineById={(name, color, rid) => handleJoinOnline(name, color, rid)}
          activeOnlineRooms={activeRooms}
          isLoadingRooms={isLoadingRooms}
          user={user}
          authError={authError}
          isLoggingIn={isLoggingIn}
          onGoogleLogin={handleGoogleLogin}
          onLogout={handleLogout}
          onRetryAnonymousLogin={handleRetryAnonymousLogin}
        />
      )}

      {/* 2. MATCHROOM WAITING LOBBLIES OR TRANSITIONING STATUS */}
      {currentGame && (currentGame.status === 'waiting' || isTransitioning) && (
        <WaitingRoom
          gameId={currentGame.id}
          players={currentGame.players}
          onLeaveGame={handleLeaveGame}
          onSendChatMessage={handleSendChatMessage}
          chat={currentGame.chat}
          currentUserId={user?.uid || ''}
          isTransitioning={isTransitioning}
          transitionSeconds={transitionSeconds}
          coinStake={currentGame.coinStake || 500}
          maxPlayers={currentGame.maxPlayers || 2}
          onSendReaction={handleSendReaction}
        />
      )}

      {/* 3. CORE SEQUENCE MATCHBOARD IN-PLAY */}
      {currentGame && currentGame.status !== 'waiting' && !isTransitioning && (
        <div className="relative z-10 min-h-screen flex flex-col justify-between pt-3 pb-32 lg:pb-4 px-4 w-full max-w-full">
          
          {/* Confetti Explosion Elements */}
          {confetti.map((c) => (
            <div
              key={c.id}
              style={{ left: `${c.x}%`, top: `${c.y}%`, backgroundColor: c.color }}
              className="absolute w-2 h-2 rounded-full z-50 pointer-events-none animate-ping shadow-sm"
            />
          ))}

          {/* Gameplay HUD Header */}
          <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-2 mb-3 w-full">
            <div className="flex items-center gap-3">
              <span className="font-sans text-lg md:text-xl font-black text-slate-900 italic uppercase tracking-wider">Sequence Duel</span>
              <span className="bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold px-3 py-1 rounded-full select-all shadow-sm">
                CODE: {currentGame.id}
              </span>
            </div>

            {/* Quick Actions Panel info */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="bg-white border border-slate-200 hover:border-slate-350 p-2 rounded-full text-slate-500 hover:text-slate-850 shadow-sm transition cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#e22d7a]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                onClick={handleLeaveGame}
                className="bg-white border border-slate-200 hover:border-rose-300 text-xs font-mono uppercase tracking-widest text-slate-650 hover:text-rose-600 px-4 py-2 rounded-full transition shadow-sm cursor-pointer"
              >
                Quit duel
              </button>
            </div>
          </header>

          {/* Gameplay Core Panel Split - Full screen width optimized */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 w-full max-w-full">
            
            {/* Split A: Card Grid of 100 cells (8 Cols) */}
            <section className="lg:col-span-8 flex flex-col items-center justify-center w-full my-auto">
              <GameBoard
                boardChips={currentGame.boardChips}
                selectedCard={selectedCard}
                winningSequences={currentGame.winningSequences}
                onCellClick={handleCellClick}
                userColor={userColor}
              />
            </section>

            {/* Split B: Statistics Panel, Turn counters, and Hand Sidebar (4 Cols) */}
            <section className="lg:col-span-4 flex flex-col gap-3.5 self-start w-full">
              
              {/* Turn Display and statistics overview card */}
              <div className="bg-white border border-slate-205 p-3 rounded-2xl flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-0.5">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 font-bold">Sequence Arena HUD</span>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#e22d7a] bg-rose-50 px-2.5 py-1 rounded-full border border-[#e22d7a]/15">
                    <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>{turnTimeLeft}s</span>
                  </div>
                </div>

                {/* Score indicators - styled in a single vertical column on both mobile and desktop views to prevent text overlap */}
                <div className="grid grid-cols-1 gap-1.5">
                  {currentGame.players.map((plr) => {
                    const activeIndicator = currentGame.currentTurn === plr.uid;
                    const seqCount = currentGame.winningSequences.filter(seq => 
                      seq.some(([r, c]) => !isCorner(r, c) && currentGame.boardChips[`${r}_${c}`] === plr.color)
                    ).length;

                    const winTarget = currentGame.sequencesToWin || 2;
                    const isTeamMatch = (currentGame.maxPlayers || 2) === 4;
                    const teamLabel = isTeamMatch 
                      ? ` (Team ${plr.color === 'red' ? 'Red' : plr.color === 'blue' ? 'Blue' : plr.color.toUpperCase()})` 
                      : '';

                    return (
                      <div 
                        key={plr.uid}
                        className={`p-2 rounded-xl border transition ${
                          activeIndicator 
                            ? 'bg-slate-50 border-[#e22d7a]/60 shadow-sm font-bold' 
                            : 'bg-white border-slate-150'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full border border-white/20 ${
                              plr.color === 'red'
                                ? 'bg-red-500 shadow-sm'
                                : plr.color === 'green'
                                  ? 'bg-emerald-500 shadow-sm'
                                  : 'bg-blue-500 shadow-sm'
                            }`} />
                            <span className="text-xs font-bold font-mono text-slate-800">
                              {plr.name}
                              {teamLabel && <span className="text-[9px] font-sans font-black tracking-wide ml-1 text-slate-450">{teamLabel}</span>}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Seqs:</span>
                            <span className="text-xs font-bold text-[#e22d7a] font-mono flex items-center gap-0.5">
                              {seqCount >= winTarget ? `${'🏆'.repeat(winTarget)} Complete` : `${seqCount}/${winTarget}`}
                            </span>
                          </div>
                        </div>
                        {activeIndicator && (
                          <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div className="bg-[#e22d7a] h-full animate-bar-timer" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Player's hand of cards in sidebar - visible only on desktop to prevent vertical scrolling */}
              <div className="hidden lg:block">
                <Hand
                  hand={getMyPlayer()?.hand || []}
                  selectedCard={selectedCard}
                  onSelectCard={setSelectedCard}
                  boardChips={currentGame.boardChips}
                  onDiscardDeadCard={handleDiscardDeadCard}
                  isMyTurn={isMyTurn}
                />
              </div>

              {/* Ludo Star Bet Pot Status */}
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-center justify-between text-left shadow-xs mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🪙</span>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono tracking-wider font-extrabold uppercase text-[#e22d7a]">Tournament Stakes</span>
                    <span className="text-[10.5px] font-mono text-slate-700 font-bold">Pot: 🪙{((currentGame.coinStake || 500) * 2).toLocaleString()}</span>
                  </div>
                </div>
                <span className="bg-[#e22d7a] text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">DUEL ACTIVE</span>
              </div>

              {/* Ludo Star Style Floating Emoji Reactions picker */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col gap-2 shadow-sm mt-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#e22d7a] font-black">Interactive Shoutouts</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { e: '😂', l: 'Haha!' },
                    { e: '😠', l: 'Grrr!' },
                    { e: '😎', l: 'Easy!' },
                    { e: '😮', l: 'OMG!' },
                    { e: '👍', l: 'Nice!' },
                    { e: '🔥', l: 'On Fire!' },
                    { e: '💀', l: 'Dead!' },
                    { e: '👑', l: 'Winner!' }
                  ].map((item) => (
                    <button
                      key={item.e}
                      onClick={() => handleSendReaction(item.e)}
                      className="bg-white hover:bg-rose-50 border border-slate-150 rounded-xl py-1.5 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs gap-0.5 text-[#1e293b]"
                    >
                      <span className="text-lg">{item.e}</span>
                      <span className="text-[7.5px] font-sans text-slate-500 capitalize leading-none font-bold">{item.l}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat trigger toggle row */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-sm mt-1"
              >
                <MessageSquare className="w-4 h-4 text-[#e22d7a]" />
                <span>Open Room Chat Lounge</span>
                {currentGame.chat.length > 0 && (
                  <span className="bg-[#e22d7a] text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-bounce flex items-center justify-center">
                    {currentGame.chat.length}
                  </span>
                )}
              </button>

            </section>
          </main>

          {/* Sticky Bottom Drawer for Mobile Hand view only */}
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.12)]">
            <div className="w-full max-w-md mx-auto">
              <Hand
                hand={getMyPlayer()?.hand || []}
                selectedCard={selectedCard}
                onSelectCard={setSelectedCard}
                boardChips={currentGame.boardChips}
                onDiscardDeadCard={handleDiscardDeadCard}
                isMyTurn={isMyTurn}
              />
            </div>
          </div>

        </div>
      )}

      {/* 4. CHAT OVERLAY DRAWER */}
      <AnimatePresence>
        {currentGame && isChatOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop: translucent dark blur, click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs cursor-pointer"
            />

            {/* Slider container panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-200"
            >
              {/* Header inside drawer */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#e22d7a]" />
                  <h3 className="font-sans text-sm font-black text-slate-800 uppercase tracking-wider">Lobby Dual-Deck Chat</h3>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="bg-white border border-slate-200 hover:border-slate-350 px-3 py-1.5 rounded-full text-slate-650 hover:text-slate-900 transition cursor-pointer shadow-sm text-xs font-mono font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Chat frame */}
              <div className="flex-1 flex flex-col overflow-hidden p-4">
                <Chat
                  chat={currentGame.chat}
                  currentUserId={user?.uid || ''}
                  onSendChatMessage={handleSendChatMessage}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. GAME OVER WINNING DIALOG MODAL */}
      <AnimatePresence>
        {currentGame && currentGame.status === 'completed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 relative"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-slate-205 rounded-3xl max-w-md w-full p-8 text-center shadow-lg relative overflow-hidden"
            >
              {/* Grand top accent banner band */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-[#e22d7a]" />
              
              <Award className="w-16 h-16 text-[#e22d7a] mx-auto mb-4 animate-bounce" />

              <h3 className="text-2xl font-black text-slate-905 mb-2 italic tracking-tight text-slate-950">MATCH RESOLVED!</h3>
              
              <p className="text-sm text-slate-650 mb-6 font-sans">
                🎉 Congratulations to{' '}
                <strong className="text-[#e22d7a] capitalize font-mono font-black">
                  {currentGame.players.find((p) => p.uid === currentGame.winnerUid)?.name || 'Unknown Champion'}
                </strong>{' '}
                for aligning two continuous 5-chip Sequences on the game board!
              </p>

              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl mb-6">
                <span className="block text-[10px] font-mono uppercase text-slate-550 tracking-wider mb-1 font-bold">Total Completed Sequences</span>
                <span className="font-mono text-2xl font-black text-[#e22d7a]">2 / 2 SEQS</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleQuickRestart}
                  className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 transition shadow-sm border-none cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-white" /> Rematch Duel
                </button>
                <button
                  onClick={handleLeaveGame}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition cursor-pointer shadow-sm"
                >
                  Exit to Lobby
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Overlay Reactions Panel (Ludo Star Style!) */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: '85vh', scale: 0.3, x: '50vw' }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: '15vh', 
                scale: [0.3, 1.4, 1.4, 0.7],
                x: [
                  '50vw', 
                  '48vw', 
                  '52vw',
                  '50vw'
                ] 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: 'easeOut' }}
              className="absolute flex flex-col items-center gap-1 bg-white border border-slate-200 shadow-xl px-4 py-2.5 rounded-2xl transform -translate-x-1/2"
            >
              <span className="text-4xl filter drop-shadow-sm">{r.emoji}</span>
              <span className={`text-[8px] font-black font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                r.color === 'red' ? 'bg-red-50 text-red-650' : r.color === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {r.name.split('#')[0]}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
