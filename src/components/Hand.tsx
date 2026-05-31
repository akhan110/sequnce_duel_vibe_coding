import React from 'react';
import { motion } from 'motion/react';
import { Card, ChipColor } from '../types';
import { isDeadCard } from '../lib/gameLogic';
import { RefreshCw } from 'lucide-react';

interface HandProps {
  hand: Card[];
  selectedCard: Card | null;
  onSelectCard: (card: Card) => void;
  boardChips: Record<string, ChipColor>;
  onDiscardDeadCard: (cardId: string) => void;
  isMyTurn: boolean;
}

export default function Hand({
  hand,
  selectedCard,
  onSelectCard,
  boardChips,
  onDiscardDeadCard,
  isMyTurn
}: HandProps) {

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'S': return '♠';
      case 'H': return '♥';
      case 'D': return '♦';
      case 'C': return '♣';
      default: return '';
    }
  };

  const getSuitColorClass = (suit: string) => {
    return (suit === 'H' || suit === 'D') ? 'text-red-600 font-bold' : 'text-slate-800 font-bold';
  };

  return (
    <div className="w-full bg-slate-50/80 backdrop-blur-md border border-slate-250 p-2 sm:p-3 rounded-2xl shadow-md">
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-200 pb-1">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5 font-black">
          <span>My Hand ({hand.length} cards)</span>
          {isMyTurn && (
            <span className="bg-[#e22d7a] text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse uppercase shadow-sm">
              Your turn
            </span>
          )}
        </h3>
        <p className="hidden sm:block text-[9px] text-slate-400 font-sans font-medium">Select a card, then tap match highlights on board.</p>
      </div>

      <div className="grid grid-cols-6 lg:grid-cols-3 gap-1 px-0.5 sm:gap-2">
        {hand.map((card, idx) => {
          const isSelected = selectedCard?.id === card.id;
          const suitColor = getSuitColorClass(card.suit);
          const symbol = getSuitSymbol(card.suit);
          const isDead = isDeadCard(card, boardChips);

          // Jack special helpers
          const isTwoEyed = card.rank === 'J' && (card.suit === 'C' || card.suit === 'D');
          const isOneEyed = card.rank === 'J' && (card.suit === 'S' || card.suit === 'H');

          return (
            <motion.div
              key={card.id}
              whileHover={{ y: -6 }}
              onClick={() => isMyTurn && onSelectCard(card)}
              className={`relative bg-white p-2 h-20 sm:h-[92px] rounded-lg border flex flex-col justify-between cursor-pointer transition select-none ${
                isSelected 
                  ? 'border-[#e22d7a] ring-2 ring-[#e22d7a]/20 bg-rose-50/10 scale-[1.03] shadow' 
                  : isDead
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200 hover:border-[#e22d7a]/50 hover:shadow-sm'
              }`}
            >
              {/* Top value corner */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-sans font-black leading-none ${suitColor}`}>
                  {card.rank}
                </span>
                <span className={`text-xs ${suitColor}`}>
                  {symbol}
                </span>
              </div>

              {/* Middle identifier context */}
              <div className="text-center font-mono py-0.5">
                {isTwoEyed ? (
                  <span className="text-[7px] font-black text-[#e22d7a] bg-rose-50 px-1 py-0.5 rounded uppercase font-mono border border-[#e22d7a]/15">WILD</span>
                ) : isOneEyed ? (
                  <span className="text-[7px] font-black text-slate-700 bg-slate-100 px-1 py-0.5 rounded uppercase font-mono border border-slate-200">REMOVE</span>
                ) : (
                  <span className={`text-base font-bold leading-none ${suitColor}`}>{symbol}</span>
                )}
              </div>

              {/* Card Bottom status indicators / Dead check */}
              {isDead ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMyTurn) onDiscardDeadCard(card.id);
                  }}
                  disabled={!isMyTurn}
                  className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[8px] font-black py-0.5 rounded flex items-center justify-center gap-0.5 mt-auto uppercase transition cursor-pointer"
                >
                  <RefreshCw className="w-2 h-2 animate-spin-slow text-rose-600" /> Swap
                </button>
              ) : (
                <div className="w-full flex justify-between select-none rotate-180">
                  <span className={`text-xs font-sans font-black leading-none ${suitColor}`}>
                    {card.rank}
                  </span>
                  <span className={`text-[9px] leading-none ${suitColor}`}>
                    {symbol}
                  </span>
                </div>
              )}

              {/* Selection overlay layout */}
              {isSelected && (
                <motion.div layoutId="handSelected" className="absolute -inset-0.5 border border-[#e22d7a] rounded-lg pointer-events-none shadow-sm" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
