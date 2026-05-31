import React from 'react';
import { motion } from 'motion/react';
import { BoardCell, ChipColor, Card } from '../types';
import { BOARD_LAYOUT, isCorner } from '../lib/gameLogic';

interface GameBoardProps {
  boardChips: Record<string, ChipColor>;
  selectedCard: Card | null;
  winningSequences: [number, number][][];
  onCellClick: (row: number, col: number) => void;
  userColor?: ChipColor; // Current user's color to show guided highlighting match indicators
}

export default function GameBoard({
  boardChips,
  selectedCard,
  winningSequences,
  onCellClick,
  userColor = 'red'
}: GameBoardProps) {
  // Determine if a specific coordinates is highlighted/matchable with the current selected card
  const highlightCells = React.useMemo(() => {
    if (!selectedCard) return new Set<string>();
    
    const set = new Set<string>();
    const isTwoEyed = selectedCard.rank === 'J' && (selectedCard.suit === 'C' || selectedCard.suit === 'D');
    const isOneEyed = selectedCard.rank === 'J' && (selectedCard.suit === 'S' || selectedCard.suit === 'H');

    // Create a set of unremovable cells in completed sequences
    const sealedCells = new Set<string>();
    winningSequences.forEach(seq => {
      seq.forEach(([r, c]) => sealedCells.add(`${r}_${c}`));
    });

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (isCorner(r, c)) continue;

        const chip = boardChips[`${r}_${c}`];
        if (isTwoEyed) {
          if (chip === undefined) {
            set.add(`${r}_${c}`);
          }
        } else if (isOneEyed) {
          if (chip !== undefined && !sealedCells.has(`${r}_${c}`)) {
            set.add(`${r}_${c}`);
          }
        } else {
          // Normal card matching
          const layoutCell = BOARD_LAYOUT[r][c];
          if (layoutCell.suit === selectedCard.suit && layoutCell.rank === selectedCard.rank && chip === undefined) {
            set.add(`${r}_${c}`);
          }
        }
      }
    }
    return set;
  }, [selectedCard, boardChips, winningSequences]);

  // Determine if a cell is indeed part of a won sequence path
  const isWinningCell = (row: number, col: number): boolean => {
    return winningSequences.some(seq =>
      seq.some(([r, c]) => r === row && c === col)
    );
  };

  const getSuitSymbol = (suit?: string) => {
    switch (suit) {
      case 'S': return '♠';
      case 'H': return '♥';
      case 'D': return '♦';
      case 'C': return '♣';
      default: return '';
    }
  };

  const getSuitColorClass = (suit?: string) => {
    return (suit === 'H' || suit === 'D') ? 'text-red-600' : 'text-slate-900';
  };

  return (
    <div className="bg-[#e22d7a] p-1.5 sm:p-2.5 rounded-2xl shadow-[0_10px_25px_rgba(226,45,122,0.14)] border border-[#c01c62] relative select-none w-full max-w-[460px] sm:max-w-[520px] md:max-w-[580px] lg:max-w-[630px] xl:max-w-[700px] mx-auto aspect-square">
      {/* 1. Inner white margin board plate */}
      <div className="w-full h-full bg-white p-1 rounded-xl flex items-stretch">
        
        {/* 2. Main Teal Board Field wrapper */}
        <div className="w-full h-full bg-[#3ab3c2] rounded-lg p-1 flex gap-1 items-center justify-between relative overflow-hidden">
          
          {/* Left Decorative Rail - Shows on small screens and up */}
          <div className="hidden sm:flex flex-col justify-between items-center py-2 px-0.5 w-4 h-full text-white/90 select-none shrink-0 rounded border border-white/10 bg-white/5">
            <div className="text-[5px] font-mono tracking-wider rotate-270 uppercase leading-none font-black text-white/80">WILD</div>
            <div className="flex flex-col text-[8px] font-black tracking-widest leading-none my-auto items-center">
              {'SEQUENCE'.split('').map((char, index) => (
                <span key={index} className="my-[1px]">{char}</span>
              ))}
            </div>
            <div className="text-[5px] font-mono tracking-wider rotate-90 uppercase leading-none font-black text-white/80">REMOVE</div>
          </div>

          {/* Core Grid Matrix (10x10) */}
          <div className="flex-1 grid grid-cols-10 gap-0.5 p-0.5 bg-black/10 rounded-lg h-full">
            {BOARD_LAYOUT.map((rowArr, rIndex) =>
              rowArr.map((cell, cIndex) => {
                const hasChip = boardChips[`${rIndex}_${cIndex}`];
                const isMatch = highlightCells.has(`${rIndex}_${cIndex}`);
                const isWon = isWinningCell(rIndex, cIndex);
                const corner = isCorner(rIndex, cIndex);

                // Suit color
                const suitColor = getSuitColorClass(cell.suit);
                const symbol = getSuitSymbol(cell.suit);

                // Jack removal target cue
                const isRemovalCard = selectedCard?.rank === 'J' && (selectedCard.suit === 'S' || selectedCard.suit === 'H');

                return (
                  <div
                    key={`${rIndex}_${cIndex}`}
                    onClick={() => (isMatch || corner) && onCellClick(rIndex, cIndex)}
                    className={`relative aspect-square flex flex-col items-center justify-between rounded cursor-pointer transition-all border ${
                      corner 
                        ? 'bg-white border-slate-300 shadow-sm p-0.5' 
                        : isMatch
                          ? 'bg-blue-50 border-blue-550 shadow-inner'
                          : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm transition-colors'
                    }`}
                  >
                    {/* A. FREE CORNER SPECIAL LAYOUT */}
                    {corner ? (
                      <div className="flex flex-col items-center justify-center h-full w-full relative">
                        {/* Elegant compass/medallion design */}
                        <div className="w-[85%] h-[85%] rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center relative shadow-inner">
                          <span className="text-[5px] text-slate-300 font-mono tracking-tighter absolute transform scale-75 top-[1px]">★</span>
                          <span className="text-[5px] text-slate-300 font-mono tracking-tighter absolute transform scale-75 bottom-[1px]">★</span>
                          <span className="text-[6px] font-mono text-white font-bold leading-none select-none tracking-tighter">FREE</span>
                        </div>
                      </div>
                    ) : (
                      /* B. NORMAL PLAYING CARD CONTENT LAYOUT */
                      <>
                        {/* Top corner cell indicators */}
                        <div className="w-full flex items-center justify-between px-0.5 pt-0.5 opacity-90 select-none pointer-events-none">
                          <span className={`text-[8px] sm:text-[9px] font-sans font-black leading-none ${suitColor}`}>
                            {cell.rank}
                          </span>
                          <span className={`text-[7px] sm:text-[8px] leading-none ${suitColor}`}>
                            {symbol}
                          </span>
                        </div>

                        {/* Centered Large Ghost Suit Background Symbol */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.14] pointer-events-none select-none">
                          <span className={`text-xs sm:text-base font-black ${suitColor}`}>{symbol}</span>
                        </div>

                        {/* Bottom corner rotated indicators */}
                        <div className="w-full flex items-center justify-between px-0.5 pb-0.5 opacity-90 select-none pointer-events-none rotate-180">
                          <span className={`text-[8px] sm:text-[9px] font-sans font-black leading-none ${suitColor}`}>
                            {cell.rank}
                          </span>
                          <span className={`text-[7px] sm:text-[8px] leading-none ${suitColor}`}>
                            {symbol}
                          </span>
                        </div>
                      </>
                    )}

                    {/* C. DYNAMIC RECTANGLE FOCUS RINGS */}
                    {isMatch && !hasChip && (
                      <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.9, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`absolute -inset-[1px] border-2 rounded pointer-events-none z-10 ${
                          isRemovalCard ? 'border-rose-500 bg-rose-500/10' : 'border-amber-500 bg-amber-500/10'
                        }`}
                      />
                    )}

                    {/* D. GAME PLACED CHIPS */}
                    {hasChip && (
                      <motion.div
                        initial={{ scale: 0.3, y: -20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                        className={`absolute inset-[1px] rounded-full border border-white/50 flex items-center justify-center shadow z-20 ${
                          hasChip === 'red'
                            ? 'bg-gradient-to-br from-red-400 to-red-600'
                            : hasChip === 'green'
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
                              : 'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}
                      >
                        {/* Tactile internal glassy circle */}
                        <div className="w-[70%] h-[70%] rounded-full border border-white/20 flex items-center justify-center">
                          <div className="w-[50%] h-[50%] rounded-full bg-black/10"></div>
                        </div>

                        {/* Sequence Completed Special highlights */}
                        {isWon && (
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                            className="absolute -inset-[1px] border border-yellow-300 rounded-full border-dashed pointer-events-none"
                          />
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Decorative Rail - Matches left rail */}
          <div className="hidden sm:flex flex-col justify-between items-center py-2 px-0.5 w-4 h-full text-white/90 select-none shrink-0 rounded border border-white/10 bg-white/5">
            <div className="text-[5px] font-mono tracking-wider rotate-270 uppercase leading-none font-black text-white/80">REMOVE</div>
            <div className="flex flex-col text-[8px] font-black tracking-widest leading-none my-auto items-center">
              {'SEQUENCE'.split('').map((char, index) => (
                <span key={index} className="my-[1px]">{char}</span>
              ))}
            </div>
            <div className="text-[5px] font-mono tracking-wider rotate-90 uppercase leading-none font-black text-white/80">WILD</div>
          </div>

        </div>
      </div>
    </div>
  );
}
