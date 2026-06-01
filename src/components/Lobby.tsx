import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, ChipColor } from '../types';
import { User } from 'firebase/auth';
import { 
  Cpu, Users, Play, Radio, Plus, Layers, Shield, HelpCircle, Gamepad2, ArrowRight,
  LogIn, LogOut, ChevronDown, ChevronUp, AlertCircle, Info, ExternalLink, Sparkles
} from 'lucide-react';

interface LobbyProps {
  onJoinLocalAI: (name: string, color: ChipColor, maxPlayers: number, sequencesToWin: number) => void;
  onJoinPassPlay: (player1Name: string, player2Name: string, maxPlayers: number, sequencesToWin: number) => void;
  onHostOnline: (name: string, color: ChipColor, maxPlayers: number, sequencesToWin: number) => void;
  onJoinOnlineById: (name: string, color: ChipColor, roomId: string) => void;
  activeOnlineRooms: GameState[];
  isLoadingRooms: boolean;
  user: User | null;
  authError: string | null;
  isLoggingIn: boolean;
  onGoogleLogin: () => void;
  onLogout: () => void;
  onRetryAnonymousLogin: () => void;
}

export default function Lobby({
  onJoinLocalAI,
  onJoinPassPlay,
  onHostOnline,
  onJoinOnlineById,
  activeOnlineRooms,
  isLoadingRooms,
  user,
  authError,
  isLoggingIn,
  onGoogleLogin,
  onLogout,
  onRetryAnonymousLogin
}: LobbyProps) {
  const [nickname, setNickname] = useState('');
  const [chipColor, setChipColor] = useState<ChipColor>('red');
  const [targetRoomId, setTargetRoomId] = useState('');
  const [activeTab, setActiveTab] = useState<'online' | 'local'>('online');
  const [showHowTo, setShowHowTo] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState<number>(2);
  const [selectedSequencesToWin, setSelectedSequencesToWin] = useState<number>(2);

  // Local modes state
  const [p1Name, setP1Name] = useState('Player 1');
  const [p2Name, setP2Name] = useState('Player 2');

  useEffect(() => {
    if (user) {
      setNickname(user.displayName || `Player#${Math.floor(Math.random() * 900) + 100}`);
    } else {
      // Generate simple random nickname on mount
      const adjectives = ['Apex', 'Zen', 'Quantum', 'Glitch', 'Sonic', 'Cosmic', 'Aero'];
      const nouns = ['Player', 'Cardist', 'Chiper', 'Strategist', 'Slinger', 'Runner'];
      const rndNum = Math.floor(Math.random() * 900) + 100;
      const initialName = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}#${rndNum}`;
      setNickname(initialName);
    }
  }, [user]);

  const handleCreateOnline = () => {
    if (!nickname.trim()) return;
    onHostOnline(nickname.trim(), chipColor, selectedMaxPlayers, selectedSequencesToWin);
  };

  const handleJoinById = () => {
    if (!nickname.trim() || !targetRoomId.trim()) return;
    onJoinOnlineById(nickname.trim(), chipColor, targetRoomId.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between py-10 px-4 md:px-8 max-w-7xl mx-auto font-sans relative overflow-hidden">
      {/* Background soft color spots */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#e22d7a]/5 rounded-full blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3ab3c2]/5 rounded-full blur-[110px]"></div>
      </div>

      {/* Header section with brand */}
      <header className="relative z-10 w-full flex flex-col items-center text-center gap-2 max-w-3xl mx-auto mb-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-full mb-3 shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-505 shadow bg-emerald-500 animate-pulse"></div>
          <span className="font-mono text-[10px] tracking-wider uppercase text-slate-500 font-bold">Infinite Sequence Engine v1.1</span>
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 flex flex-col sm:flex-row items-center gap-x-3 gap-y-1 leading-none italic">
          <span>SEQUENCE</span>
          <span className="text-[#e22d7a]">MULTIPLAYER</span>
        </h1>
        <p className="text-sm md:text-base text-slate-650 max-w-xl mt-1">
          The ultimate grid-card alignment challenge. Form two continuous lines of 5 chips to claim victory. Play with a competitor online, locally, or test your skills against the AI.
        </p>
      </header>

      {/* Main Panel layout */}
      <main className="relative z-10 max-w-4xl w-full mx-auto bg-white border border-slate-200 p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 shadow-sm rounded-3xl">
        {/* Profile and Preferences (Left Side, 5 Cols) */}
        <section className="md:col-span-5 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8">
          <div>
            <h2 className="text-sm font-bold font-mono tracking-widest text-slate-650 uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-700"></span> Player Setup
            </h2>
            
            <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 font-black">My Nickname</label>
            <input 
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl px-4 py-3 text-slate-800 outline-none transition font-sans text-sm font-semibold"
              placeholder="What should we call you?"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 font-semibold">Choose Token Color</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Red Force', val: 'red' as ChipColor, bg: 'bg-red-500 shadow-sm border-red-400' },
                { name: 'Emerald', val: 'green' as ChipColor, bg: 'bg-emerald-500 shadow-sm border-emerald-400' },
                { name: 'Cyan Pulse', val: 'blue' as ChipColor, bg: 'bg-blue-500 shadow-sm border-blue-400' }
              ].map((c) => (
                <button
                  key={c.val}
                  onClick={() => setChipColor(c.val)}
                  className={`relative flex flex-col items-center py-3 rounded-xl border transition-all ${
                    chipColor === c.val 
                      ? 'bg-slate-50 border-slate-400 scale-105 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 ${c.bg} flex items-center justify-center shadow mb-1`}>
                    <div className="w-4 h-4 rounded-full bg-white/20"></div>
                  </div>
                  <span className="text-[9px] font-bold uppercase font-mono text-slate-600">{c.name}</span>
                  {chipColor === c.val && (
                    <motion.div layoutId="selectRing" className="absolute -inset-0.5 border-2 border-slate-400 rounded-xl pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Ludo Star Match Configurations */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col gap-3 shadow-sm">
            <div className="flex flex-col gap-1 text-left">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#e22d7a] font-black">Game Configuration</h3>
              <p className="text-[9px] text-slate-450 font-sans font-bold uppercase tracking-wider leading-none">Configure team setup and win limits</p>
            </div>

            {/* Player Mode: 2 Players vs 4 Players Team Match */}
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-black">Match Format</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMaxPlayers(2)}
                  className={`py-2 px-3 rounded-xl border text-center transition font-sans text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedMaxPlayers === 2
                      ? 'bg-rose-50 border-[#e22d7a] text-[#e22d7a] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>👤</span>
                  <span>2 Players (1v1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMaxPlayers(4)}
                  className={`py-2 px-3 rounded-xl border text-center transition font-sans text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedMaxPlayers === 4
                      ? 'bg-rose-50 border-[#e22d7a] text-[#e22d7a] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>👥</span>
                  <span>4 Players (Teams)</span>
                </button>
              </div>
            </div>

            {/* Sequences to Win */}
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-black">Sequences to Win</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSequencesToWin(1)}
                  className={`py-2 px-3 rounded-xl border text-center transition font-sans text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedSequencesToWin === 1
                      ? 'bg-rose-50 border-[#e22d7a] text-[#e22d7a] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>⚡</span>
                  <span>1 Sequence to Win</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSequencesToWin(2)}
                  className={`py-2 px-3 rounded-xl border text-center transition font-sans text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
                    selectedSequencesToWin === 2
                      ? 'bg-rose-50 border-[#e22d7a] text-[#e22d7a] shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span>🏆</span>
                  <span>2 Sequences to Win</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            <button 
              onClick={() => setShowHowTo(true)}
              className="w-full border border-slate-200 hover:border-slate-350 bg-white text-slate-750 rounded-full py-2.5 px-4 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" /> How to Play Rules
            </button>
          </div>
        </section>

        {/* Action Panel Modes (Right Side, 7 Cols) */}
        <section className="md:col-span-7 flex flex-col gap-6">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              onClick={() => setActiveTab('online')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'online' ? 'bg-white border border-slate-150 text-slate-850 shadow-sm font-bold' : 'text-slate-550 hover:text-slate-750 font-medium'
              }`}
            >
              <Radio className="w-4 h-4 text-[#e22d7a]" /> Real-time Online
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'local' ? 'bg-white border border-slate-150 text-slate-850 shadow-sm font-bold' : 'text-slate-555 hover:text-slate-755 font-medium'
              }`}
            >
              <Layers className="w-4 h-4 text-[#3ab3c2]" /> Pass & Play / Bot
            </button>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'online' ? (
                <motion.div
                  key="online-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col gap-5 h-full"
                >
                  {!user ? (
                    <div className="flex flex-col gap-4 bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e22d7a]/10 flex items-center justify-center shrink-0">
                          <LogIn className="w-5 h-5 text-[#e22d7a]" />
                        </div>
                        <div className="flex flex-col text-left">
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Authentication Required</h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                            To host or join real-time multiplayer lobbies, you must be authenticated with Firebase.
                          </p>
                        </div>
                      </div>

                      {authError && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 text-xs flex flex-col gap-2 text-left">
                          <div className="flex items-center gap-2 font-bold font-mono text-[10px] uppercase text-amber-805 tracking-wider">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            Anonymous Sign-In Disabled
                          </div>
                          <p className="text-amber-800 text-[11px] font-sans leading-relaxed">
                            The application attempted to sign you in anonymously, but was blocked because <code className="bg-amber-100 font-mono text-[9px] px-1 py-0.5 rounded text-[#e22d7a]">Anonymous Sign-In</code> is not yet enabled in your Firebase Console.
                          </p>
                          
                          <button
                            type="button"
                            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                            className="bg-transparent hover:underline text-[10px] font-bold text-amber-700 w-fit flex items-center gap-1 cursor-pointer text-left"
                          >
                            {showTroubleshoot ? "Hide developer activation guide" : "How to enable Anonymous authentication"} 
                            {showTroubleshoot ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {showTroubleshoot && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="text-[11px] text-amber-900 bg-amber-100/50 p-2.5 rounded-lg border border-amber-200/55 mt-1 font-sans flex flex-col gap-1.5"
                            >
                              <strong className="text-[10px] text-amber-900 uppercase font-mono mb-1 block">🛠 Enable in Firebase Console:</strong>
                              <div className="flex gap-1.5"><span className="text-[#e22d7a] font-bold">1.</span> <span>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#e22d7a] inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-2.5 h-2.5 inline" /></a>.</span></div>
                              <div className="flex gap-1.5"><span className="text-[#e22d7a] font-bold">2.</span> <span>Select your project, click <strong className="text-slate-800">Authentication</strong> in the sidebar, and open the <strong className="text-slate-800">Sign-in method</strong> tab.</span></div>
                              <div className="flex gap-1.5"><span className="text-[#e22d7a] font-bold">3.</span> <span>Under <strong className="text-slate-800">Sign-in providers</strong>, select <strong className="text-slate-850">Anonymous</strong> and click the edit pencil.</span></div>
                              <div className="flex gap-1.5"><span className="text-[#e22d7a] font-bold">4.</span> <span>Flip the switch to <strong className="text-emerald-700 font-bold">Enable</strong>, and click <strong className="text-slate-800">Save</strong>.</span></div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-4 flex flex-col gap-3 text-left">
                        <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                          Sign in as a temporary guest player to instantly access multiplayer game lobbies:
                        </p>
                        <button
                          onClick={onRetryAnonymousLogin}
                          disabled={isLoggingIn}
                          className="w-full bg-[#3ab3c2] hover:bg-[#2d9ba9] text-white rounded-xl py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {isLoggingIn ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Gamepad2 className="w-4 h-4 text-cyan-100" />
                          )}
                          Enter Play Room as Guest
                        </button>

                        <div className="flex items-center my-1.5 opacity-60">
                          <hr className="flex-1 border-slate-200" />
                          <span className="text-[9px] text-slate-400 font-mono px-3 uppercase tracking-widest shrink-0">AUTHENTICATE CHANNELS</span>
                          <hr className="flex-1 border-slate-200" />
                        </div>

                        <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                          Alternatively, sign in with Google — Google Auth is already fully configured for your app and works out-of-the-box:
                        </p>
                        <button
                          onClick={onGoogleLogin}
                          disabled={isLoggingIn}
                          className="w-full bg-[#e22d7a] hover:bg-[#c01c62] text-white rounded-xl py-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                        >
                          {isLoggingIn ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Sparkles className="w-4 h-4 text-rose-250 fill-current" />
                          )}
                          Sign in with Google Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5 h-full">
                      {/* Active Auth Profile Indicator */}
                      <div className="bg-slate-50 px-4 py-3 border border-slate-200 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3 text-left w-full">
                          <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-200 overflow-hidden flex items-center justify-center text-white font-mono text-xs font-bold leading-none shrink-0 shadow-sm">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span>{(user.displayName || 'P').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 font-mono tracking-wide truncate max-w-[200px]">
                                {nickname}
                              </span>
                            </div>
                            
                            {/* Updated to hide actual email, showing connection details + Ludo Star status */}
                            <span className="text-[9px] text-[#3ab3c2] font-extrabold font-mono uppercase flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              Lobby: Available to Play
                            </span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={onLogout}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition cursor-pointer shrink-0"
                          title="Sign Out"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Join game by Room ID */}
                      <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex flex-col gap-3">
                        <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Join a Private Room</h3>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text"
                            value={targetRoomId}
                            onChange={(e) => setTargetRoomId(e.target.value.toUpperCase())}
                            placeholder="ROOM ID (E.G. ABCD)"
                            className="flex-1 bg-white border border-slate-205 focus:border-slate-400 rounded-xl px-4 py-2.5 text-xs text-center font-mono outline-none uppercase font-bold tracking-widest text-[#e22d7a]"
                          />
                          <button 
                            onClick={handleJoinById}
                            className="w-full sm:w-auto bg-[#e22d7a] text-white hover:bg-[#c01c62] rounded-xl px-5 py-2.5 text-xs font-black uppercase transition flex items-center justify-center gap-1 shrink-0 shadow-sm cursor-pointer"
                          >
                            Join Room <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Join Public Lobbies list */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-bold">
                            <Users className="w-3.5 h-3.5 text-slate-500" /> Public Lobbies Waiting
                          </h3>
                          <button
                            onClick={handleCreateOnline}
                            className="text-xs font-bold text-[#e22d7a] hover:text-[#c01c62] flex items-center gap-1 cursor-pointer tracking-wider"
                          >
                            <Plus className="w-3.5 h-3.5" /> Start New Room
                          </button>
                        </div>

                        <div className="flex-1 min-h-[160px] max-h-[180px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col gap-2 custom-scrollbar">
                          {isLoadingRooms ? (
                            <div className="m-auto text-slate-500 text-xs font-mono flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                              Syncing lobbies...
                            </div>
                          ) : activeOnlineRooms.length === 0 ? (
                            <div className="m-auto text-center p-3">
                              <p className="text-xs text-slate-500 font-semibold font-sans mb-1 uppercase tracking-widest">No active workspaces</p>
                              <p className="text-[10px] text-slate-450 font-mono">Create a game room and invite a competitor!</p>
                            </div>
                          ) : (
                            activeOnlineRooms.map((game) => (
                              <div 
                                key={game.id} 
                                className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-xl hover:border-slate-300 transition"
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${
                                      game.players[0]?.color === 'red' ? 'bg-red-500' : game.players[0]?.color === 'green' ? 'bg-emerald-500' : 'bg-blue-500'
                                    }`}></span>
                                    <span className="uppercase tracking-wider font-mono">{game.players[0]?.name || 'Unknown Host'}</span>
                                  </span>
                                  <span className="text-[10px] text-slate-450 font-mono">
                                    ID: {game.id} • {game.maxPlayers || 2}P ({game.maxPlayers === 4 ? 'Teams' : '1v1'}) • {game.sequencesToWin || 2} Seq to Win
                                  </span>
                                </div>
                                <button
                                  onClick={() => onJoinOnlineById(nickname, chipColor, game.id)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-full transition cursor-pointer"
                                >
                                  Join Match
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="local-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col gap-4 h-full"
                >
                  {/* Game Configuration in the Local Pass & Play / Bot Tab */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-3.5 shadow-sm text-left">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#3ab3c2] font-black">Local Game Format Settings</h3>
                      <p className="text-[9px] text-slate-450 uppercase tracking-wider font-extrabold leading-none">Apply config to your offline Match & Bot plays</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Format Choice */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Match Format</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedMaxPlayers(2)}
                            className={`py-1.5 px-2 rounded-lg border text-center transition font-sans text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer ${
                              selectedMaxPlayers === 2
                                ? 'bg-cyan-50 border-[#3ab3c2] text-[#3ab3c2] shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                          >
                            👤 1v1 Local
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedMaxPlayers(4)}
                            className={`py-1.5 px-2 rounded-lg border text-center transition font-sans text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer ${
                              selectedMaxPlayers === 4
                                ? 'bg-cyan-50 border-[#3ab3c2] text-[#3ab3c2] shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650'
                            }`}
                          >
                            👥 Teams 4P
                          </button>
                        </div>
                      </div>

                      {/* Score Target choice */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold">Sequences to Win</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSequencesToWin(1)}
                            className={`py-1.5 px-2 rounded-lg border text-center transition font-sans text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer ${
                              selectedSequencesToWin === 1
                                ? 'bg-cyan-50 border-[#3ab3c2] text-[#3ab3c2] shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                            }`}
                          >
                            ⚡ 1 Seq
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSequencesToWin(2)}
                            className={`py-1.5 px-2 rounded-lg border text-center transition font-sans text-[9px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer ${
                              selectedSequencesToWin === 2
                                ? 'bg-cyan-50 border-[#3ab3c2] text-[#3ab3c2] shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-650'
                            }`}
                          >
                            🏆 2 Seqs
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Single Player Mode card */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-center justify-between hover:border-slate-250 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <Cpu className="w-6 h-6 text-[#3ab3c2]" />
                      </div>
                      <div className="flex flex-col text-left">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">VS Strategic AI</h4>
                        <p className="text-xs text-slate-500">
                          Hone your blocks and plays against our bot competitor ({selectedMaxPlayers === 4 ? "4 Players Team Match" : "2 Players Match"} • {selectedSequencesToWin} {selectedSequencesToWin === 1 ? 'Sequence' : 'Sequences'} to Win).
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onJoinLocalAI(nickname, chipColor, selectedMaxPlayers, selectedSequencesToWin)}
                      className="bg-[#3ab3c2] hover:bg-[#35abb7] text-white p-3 rounded-full transition shrink-0 shadow-sm cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Pass & Play Mode input and setup */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col gap-4">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-[#e22d7a] animate-pulse" />
                      </div>
                      <div className="flex flex-col text-left">
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Local Pass & Play</h4>
                        <p className="text-xs text-slate-500">
                          Play sequence on the same screen taking physical turns ({selectedMaxPlayers === 4 ? "4 Players Teams" : "2 Players Standard"} • {selectedSequencesToWin} {selectedSequencesToWin === 1 ? 'Sequence' : 'Sequences'} to Win).
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1 font-bold">Player 1 Name / Team 1</label>
                        <input
                          type="text"
                          value={p1Name}
                          onChange={(e) => setP1Name(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1 font-bold">Player 2 Name / Team 2</label>
                        <input
                          type="text"
                          value={p2Name}
                          onChange={(e) => setP2Name(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-300"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => onJoinPassPlay(p1Name, p2Name, selectedMaxPlayers, selectedSequencesToWin)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" /> Play Local pass & play
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* Rules Modal How to Play Overlay */}
      <AnimatePresence>
        {showHowTo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white border border-slate-205 max-w-lg w-full rounded-3xl p-6 shadow-xl relative max-h-[85vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowHowTo(false)}
                className="absolute top-4 right-5 text-slate-400 hover:text-slate-800 transition font-mono text-2xl font-black cursor-pointer"
              >
                ×
              </button>
              
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase italic tracking-tighter">
                <Shield className="w-5 h-5 text-[#e22d7a]" /> Sequence Board Rules
              </h3>

              <div className="space-y-4 text-xs leading-relaxed text-slate-650 font-sans">
                <div>
                  <h4 className="font-bold text-[#e22d7a] mb-1 uppercase text-[11px] font-mono tracking-wider">Goal</h4>
                  <p>Be the first player/team to form **two sequences of 5 chips** of your color in a straight line (horizontal, vertical, or diagonal).</p>
                </div>

                <div>
                  <h4 className="font-bold text-[#e22d7a] mb-1 uppercase text-[11px] font-mono tracking-wider font-semibold">How to Take Turns</h4>
                  <p>Choose a card from your hand, click/tap it, and then click one of the corresponding matching card slots on the 10x10 board to drop your color chip. Clicking plays the card, replaces your turn, and automatically draws you a new card from the draw deck.</p>
                </div>

                <div>
                  <h4 className="font-bold text-[#e22d7a] mb-1 uppercase text-[11px] font-mono tracking-wider font-bold">Jacks are Wildcards!</h4>
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li><strong className="text-emerald-600">Two-Eyed Jacks (Clubs, Diamonds)</strong>: Completely WILD. You can drop your chip on *any vacant slot* on the board.</li>
                    <li><strong className="text-[#3ab3c2]">One-Eyed Jacks (Spades, Hearts)</strong>: REMOVAL. You can remove one opponent's chip from the board (provided it isn't part of an already completed 5-chip sequence).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-[#e22d7a] mb-1 uppercase text-[11px] font-mono tracking-wider">Free Corners</h4>
                  <p>The four corner locations are FREE and wildcard spaces. They count as your card/chip of any color for all players completing a sequence. Multiple sequences of different colors can cross over and share a single corner.</p>
                </div>

                <div>
                  <h4 className="font-bold text-[#e22d7a] mb-1 uppercase text-[11px] font-mono tracking-wider font-semibold font-mono">Dead Cards</h4>
                  <p>If you hold a card in your hand whose corresponding board spaces are empty or completely claimed by chips, you can discard it on your turn, announce it as **Dead**, and replace it with a new card without taking a regular turn.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowHowTo(false)}
                className="w-full mt-6 bg-slate-900 text-white hover:bg-slate-800 rounded-full py-3 px-6 font-black text-xs uppercase tracking-widest cursor-pointer"
              >
                Close and Play!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Humble Footer */}
      <footer className="relative z-10 w-full text-center mt-6">
        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-semibold">
          Created in Sandboxed Cloud Infrastructure • Play Sequence Securely
        </p>
      </footer>
    </div>
  );
}
