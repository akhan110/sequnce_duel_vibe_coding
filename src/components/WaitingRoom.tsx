import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Users, ArrowLeft, RefreshCw, Send } from 'lucide-react';
import { Player, ChatMessage } from '../types';
import Chat from './Chat';

interface WaitingRoomProps {
  gameId: string;
  players: Player[];
  onLeaveGame: () => void;
  onSendChatMessage: (text: string) => void;
  chat: ChatMessage[];
  currentUserId: string;
  isTransitioning?: boolean;
  transitionSeconds?: number;
  coinStake?: number;
  maxPlayers?: number;
  onSendReaction?: (emoji: string) => void;
}

export default function WaitingRoom({
  gameId,
  players,
  onLeaveGame,
  onSendChatMessage,
  chat,
  currentUserId,
  isTransitioning = false,
  transitionSeconds = 3,
  coinStake = 500,
  maxPlayers = 2,
  onSendReaction
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);

  const getFullShareUrl = () => {
    return `${window.location.origin}?room=${gameId}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getFullShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 md:px-8 max-w-5xl mx-auto flex flex-col justify-center relative overflow-hidden">
      {/* Dynamic Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white"
          >
            {/* Visual styling halos */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#e22d7a]/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3ab3c2]/20 rounded-full blur-[100px]" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative flex flex-col items-center text-center p-8 max-w-md w-full"
            >
              {/* Spinning geometric radar loader */}
              <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                <motion.div
                  className="absolute inset-0 border-[3px] border-dashed border-[#e22d7a] rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                />
                <motion.div
                  className="absolute w-24 h-24 border-[3px] border-solid border-[#3ab3c2] border-t-transparent border-b-transparent rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                />
                <motion.div
                  key={transitionSeconds}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200 uppercase font-sans select-none"
                >
                  {transitionSeconds}
                </motion.div>
              </div>

              {/* Labels */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 justify-center text-emerald-400 text-xs font-mono font-bold tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Opponent Connected
                </div>
                
                <h3 className="text-2xl font-black italic uppercase tracking-wider text-white">
                  Sequence Starting
                </h3>

                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Both decks configured. Dealing 6 card hands...
                </p>
                
                {/* Micro-bar loader */}
                <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto mt-4 overflow-hidden relative">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#e22d7a] to-[#3ab3c2]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "linear" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background soft color spots */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#e22d7a]/5 rounded-full blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#3ab3c2]/5 rounded-full blur-[110px]"></div>
      </div>

      {/* Back to Lobby Button */}
      <button
        onClick={onLeaveGame}
        className="relative z-10 self-start flex items-center gap-2 mb-6 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider text-slate-600 transition cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-4 h-4 text-slate-500" /> Leave Room Lobby
      </button>

      {/* Main Board Waiting Room Frame */}
      <main className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 bg-white border border-slate-200 p-6 md:p-8 shadow-sm rounded-3xl overflow-hidden">
        
        {/* Connection Setup and Lobby ID (Left Column, 7 Cols) */}
        <section className="md:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs tracking-wider text-slate-500 uppercase font-bold flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" /> Matchmaking Lobby Created
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 italic uppercase tracking-tight">Invite Your Opponent</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md font-sans">
              Send the unique room passcode or share link to your opponent. When they join, the dual-deck of Sequence cards will deal, and real-time multiplayer will begin!
            </p>

            {/* No coin stakes, open play room */}
          </div>

          {/* Lobby Identifiers Boxes */}
          <div className="space-y-4">
            {/* 1. Room Code */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl shadow-sm">
              <label className="block text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-2 font-bold">Room Passcode</label>
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                <span className="font-mono text-3xl font-black text-[#e22d7a] tracking-widest uppercase">{gameId}</span>
                <button
                  onClick={handleCopyCode}
                  className="bg-[#e22d7a] hover:bg-[#c01c62] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-1 transition shadow-sm cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Quick Link */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl shadow-sm">
              <label className="block text-[10px] font-mono uppercase text-slate-500 tracking-wider mb-2 font-bold">Direct Challenge Invite Link</label>
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 gap-3">
                <span className="font-mono text-xs text-slate-500 truncate max-w-[240px] md:max-w-xs">{getFullShareUrl()}</span>
                <button
                  onClick={handleCopyLink}
                  className="bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider shrink-0/5 flex items-center gap-1 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Lobby Connection Roster List */}
          <div className="flex-1 flex flex-col gap-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-bold">
              <Users className="w-4 h-4 text-slate-500" /> Lobby Players Joined ({players.length}/{maxPlayers})
            </h3>
            
            <div className="space-y-2">
              {players.map((plr, index) => (
                <div
                  key={plr.uid}
                  className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between hover:border-slate-350 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-sm ${
                      plr.color === 'red' 
                      ? 'bg-red-50 border-red-300 text-red-650' 
                      : plr.color === 'green' 
                        ? 'bg-emerald-50 border-[#10b981] text-[#10b981]' 
                        : 'bg-blue-50 border-blue-300 text-blue-600'
                    }`}>
                      {plr.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 capitalize font-mono">
                          {plr.name}
                        </span>
                        {plr.isHost && (
                          <span className="bg-slate-100 text-slate-500 text-[8px] font-mono px-1 rounded border border-slate-200 font-bold">HOST</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono capitalize font-bold">Playing chips: {plr.color} • {plr.isOnline ? 'Active Online' : 'Connecting'}</span>
                    </div>
                  </div>
                  
                  <span className="text-[10px] font-bold text-slate-500 font-mono">
                    {index === 0 ? 'READY 🔴' : 'JOINED ⚡'}
                  </span>
                </div>
              ))}

              {players.length < maxPlayers && (
                <div className="bg-slate-50 border border-dashed border-slate-200 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider animate-pulse">
                    Waiting for challengers to join Room ({players.length}/{maxPlayers} ready)
                  </span>
                </div>
              )}
            </div>

            {/* Ludo Star Style Floating Emoji Reactions picker */}
            {onSendReaction && (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col gap-2.5 mt-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#e22d7a] font-black">Live Match Shoutouts Reactions</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
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
                      onClick={() => onSendReaction(item.e)}
                      className="bg-white hover:bg-rose-50 border border-slate-150 rounded-xl p-2 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs gap-0.5 group"
                    >
                      <span className="text-xl group-hover:animate-bounce-slow">{item.e}</span>
                      <span className="text-[8px] font-sans text-slate-500 capitalize leading-none font-bold">{item.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Real-time Match Chat inside lobby waitroom (Right Column, 5 Cols) */}
        <section className="md:col-span-5 flex flex-col h-[320px] md:h-[480px]">
          <Chat
            chat={chat}
            currentUserId={currentUserId}
            onSendChatMessage={onSendChatMessage}
          />
        </section>

      </main>
    </div>
  );
}
