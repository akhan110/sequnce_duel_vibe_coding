import React from 'react';
import { motion } from 'motion/react';
import { BoardCell, ChipColor, Card } from '../types';
import { BOARD_LAYOUT, isCorner } from '../lib/gameLogic';

interface GameBoardProps {
  boardChips: Record<string, ChipColor>;
  selectedCard: Card | null;
  winningSequences: [number, number][][];
  onCellClick: (row: number, col: number) => void;
  userColor?: ChipColor;
}

// 1. MEMOIZED BOARD CELL COMPONENT FOR ZERO-LAG PRESTINE PERFORMANCE
interface CellProps {
  row: number;
  col: number;
  cell: BoardCell;
  hasChip: ChipColor | undefined;
  isMatch: boolean;
  isWon: boolean;
  corner: boolean;
  isRemovalCard: boolean;
  onCellClick: (row: number, col: number) => void;
}

const MemoizedCell = React.memo(
  function MemoizedCell({
    row,
    col,
    cell,
    hasChip,
    isMatch,
    isWon,
    corner,
    isRemovalCard,
    onCellClick
  }: CellProps) {
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
      return (suit === 'H' || suit === 'D') ? 'text-red-500' : 'text-slate-900';
    };

    const suitColor = getSuitColorClass(cell.suit);
    const symbol = getSuitSymbol(cell.suit);

    // Dynamic mini physical card center patterns
    const renderCardCenter = () => {
      if (cell.rank === 'A') {
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className={`text-[11px] sm:text-[13px] md:text-[15px] font-black leading-none ${suitColor} filter drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.05)]`}>
              {symbol}
            </span>
          </div>
        );
      }

      if (cell.rank === 'K' || cell.rank === 'Q' || cell.rank === 'J') {
        const isRed = cell.suit === 'H' || cell.suit === 'D';
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <div className={`w-[55%] h-[55%] rounded-md flex items-center justify-center opacity-90 ${isRed ? 'bg-red-50' : 'bg-slate-100'} border ${isRed ? 'border-red-200' : 'border-slate-300'} shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]`}>
              {cell.rank === 'K' ? (
                <span className={`text-[7px] font-black leading-none ${suitColor} scale-90`}>👑</span>
              ) : cell.rank === 'Q' ? (
                <span className={`text-[7px] font-black leading-none ${suitColor} scale-90`}>🌸</span>
              ) : (
                <span className={`text-[7px] font-black leading-none ${suitColor} scale-90`}>🛡️</span>
              )}
            </div>
          </div>
        );
      }

      const count = parseInt(cell.rank || '', 10);
      if (isNaN(count)) return null;

      if (count <= 3) {
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 py-1.5 overflow-hidden pointer-events-none opacity-80 scale-[0.7]">
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className={`text-[5px] sm:text-[6px] font-black leading-none ${suitColor}`}>{symbol}</span>
            ))}
          </div>
        );
      }

      if (count <= 6) {
        return (
          <div className="absolute inset-0 grid grid-cols-2 gap-x-0.5 gap-y-0.5 justify-center content-center items-center py-2 overflow-hidden pointer-events-none opacity-80 scale-[0.65]">
            {Array.from({ length: count }).map((_, i) => (
              <span key={i} className={`text-[5px] sm:text-[6px] font-black leading-none text-center ${suitColor}`}>{symbol}</span>
            ))}
          </div>
        );
      }

      return (
        <div className="absolute inset-0 grid grid-cols-3 gap-x-0.5 gap-y-0.5 justify-center content-center items-center py-1.5 overflow-hidden pointer-events-none opacity-[0.85] scale-[0.55]">
          {Array.from({ length: count }).map((_, i) => (
            <span key={i} className={`text-[5px] sm:text-[6px] font-black leading-none text-center ${suitColor}`}>{symbol}</span>
          ))}
        </div>
      );
    };

    return (
      <div
        onClick={() => (isMatch || corner) && onCellClick(row, col)}
        className={`relative aspect-square flex flex-col items-center justify-between rounded-md cursor-pointer select-none transition-all duration-150 border overflow-hidden ${
          corner
            ? 'bg-slate-900 border-yellow-500/30'
            : isMatch
              ? 'bg-blue-50/90 border-[#1070e2] shadow-[0_0_8px_rgba(16,112,226,0.25)] ring-2 ring-blue-400/25 z-10 scale-[1.03]'
              : 'bg-white border-slate-205 hover:bg-slate-50 shadow-[0_1px_1.5px_rgba(0,0,0,0.06),_inset_0_1px_0_rgba(255,255,255,0.4)]'
        }`}
      >
        {/* A. FREE CORNER EXQUISITE MEDALLION DESIGN */}
        {corner ? (
          <div className="flex flex-col items-center justify-center h-full w-full relative p-0.5">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 p-[1px] shadow-[0_1.5px_3px_rgba(0,0,0,0.4)]">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center relative">
                {/* Concentric rings */}
                <span className="text-[5px] text-yellow-400 font-mono scale-[0.7] absolute top-[2px]">★</span>
                <span className="text-[5px] text-yellow-400 font-mono scale-[0.7] absolute bottom-[2px]">★</span>
                <span className="text-[6px] font-sans font-black text-yellow-400 tracking-tighter leading-none scale-90">FREE</span>
                <span className="text-[4px] font-mono font-black text-yellow-500/60 leading-none tracking-widest scale-75 mt-0.5">SLOT</span>
              </div>
            </div>
          </div>
        ) : (
          /* B. REALISTIC MINI CARD INTERFACE */
          <>
            {/* Top corner cell indicators */}
            <div className="w-full flex items-center justify-between px-1 pt-[1px] opacity-95 select-none pointer-events-none z-10">
              <span className={`text-[8.5px] sm:text-[9.5px] font-bold leading-none tracking-tighter ${suitColor}`}>
                {cell.rank}
              </span>
              <span className={`text-[6.5px] sm:text-[7.5px] leading-none ${suitColor}`}>
                {symbol}
              </span>
            </div>

            {/* Custom Center Pattern layout */}
            {renderCardCenter()}

            {/* Bottom corner rotated indicators */}
            <div className="w-full flex items-center justify-between px-1 pb-[1px] opacity-95 select-none pointer-events-none rotate-180 z-10">
              <span className={`text-[8.5px] sm:text-[9.5px] font-bold leading-none tracking-tighter ${suitColor}`}>
                {cell.rank}
              </span>
              <span className={`text-[6.5px] sm:text-[7.5px] leading-none ${suitColor}`}>
                {symbol}
              </span>
            </div>
          </>
        )}

        {/* C. VISUAL PULSE ON HIGHMATCHES CELLS */}
        {isMatch && !hasChip && (
          <div className="absolute inset-0 animate-pulse pointer-events-none z-10 bg-blue-500/10 border-2 rounded-md border-blue-500" />
        )}

        {/* D. GAME PLACED CHIPS */}
        {hasChip && (
          <div
            className={`absolute inset-[1.5px] rounded-full border-2 border-white/60 flex items-center justify-center aspect-square shadow-[0_2px_4px_rgba(0,0,0,0.25)] z-20 ${
              hasChip === 'red'
                ? 'bg-gradient-to-br from-red-500 via-red-650 to-red-800'
                : hasChip === 'green'
                  ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'
                  : 'bg-gradient-to-br from-blue-500 via-blue-650 to-blue-800'
            }`}
          >
            {/* Glossy and tactile inner pattern representing real plastic chips */}
            <div className="w-[80%] h-[80%] rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-[60%] h-[60%] rounded-full border border-black/10 flex items-center justify-center bg-black/5">
                <div className="w-[40%] h-[40%] rounded-full bg-white/25 shadow-inner"></div>
              </div>
            </div>

            {/* Sequence Completed Super golden rim highlights */}
            {isWon && (
              <div className="absolute -inset-[1px] border-2 border-yellow-300 rounded-full animate-pulse border-solid pointer-events-none shadow-[0_0_8px_rgba(253,224,71,0.6)] z-30" />
            )}
          </div>
        )}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.row === next.row &&
      prev.col === next.col &&
      prev.hasChip === next.hasChip &&
      prev.isMatch === next.isMatch &&
      prev.isWon === next.isWon &&
      prev.corner === next.corner &&
      prev.isRemovalCard === next.isRemovalCard
    );
  }
);

function GameBoard({
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
  const isWinningCell = React.useCallback((row: number, col: number): boolean => {
    return winningSequences.some(seq =>
      seq.some(([r, c]) => r === row && c === col)
    );
  }, [winningSequences]);

  // Is Jack removal active for layout hints
  const isRemovalCard = selectedCard?.rank === 'J' && (selectedCard.suit === 'S' || selectedCard.suit === 'H');

  return (
    <div className="bg-[#1e2329] p-2.5 sm:p-4 rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.65),_inset_0_2px_4px_rgba(255,255,255,0.15)] border-[5px] border-[#374151] relative select-none w-full max-w-[460px] sm:max-w-[520px] md:max-w-[600px] lg:max-w-[650px] xl:max-w-[720px] mx-auto aspect-square">
      {/* 1. Outer Luxurious Hot-Pink Cardplate Frame matching original board */}
      <div className="w-full h-full bg-[#d01362] p-2.5 sm:p-4 rounded-[20px] flex items-stretch border-2 border-[#ff3fa2]/40 relative">
        
        {/* Vintage decorative star corner decals in the pink border */}
        <div className="absolute top-1 left-1.5 text-[8px] text-white/20 select-none font-black leading-none shrink-0 pointer-events-none">★ ★</div>
        <div className="absolute top-1 right-1.5 text-[8px] text-white/20 select-none font-black leading-none shrink-0 pointer-events-none">★ ★</div>
        <div className="absolute bottom-1.5 left-1.5 text-[8px] text-white/20 select-none font-black leading-none shrink-0 pointer-events-none">★ ★</div>
        <div className="absolute bottom-1.5 right-1.5 text-[8px] text-white/20 select-none font-black leading-none shrink-0 pointer-events-none">★ ★</div>

        {/* 2. Left Rotated Side Rail - Hot Pink branded column with white outlining pill */}
        <div className="hidden md:flex flex-col justify-between items-center py-4 px-1.5 w-[38px] text-white select-none shrink-0 mr-3 rounded-xl border border-white/30 bg-black/10">
          <div className="relative w-full h-[120px] shrink-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] text-[6.5px] font-sans font-black tracking-widest leading-none -rotate-90 uppercase text-center text-white border border-white/20 rounded-full px-2 py-1.5 bg-white/5 whitespace-nowrap">
              2-EYED JACKS WILD
            </div>
          </div>
          <div className="flex flex-col text-[17px] font-sans font-black tracking-[0.4em] leading-none my-auto items-center text-white/95 text-center">
            {'SEQUENCE'.split('').map((char, idx) => (
              <span key={idx} className="my-[2px]">{char}</span>
            ))}
          </div>
          <div className="relative w-full h-[120px] shrink-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] text-[6.5px] font-sans font-black tracking-widest leading-none rotate-90 uppercase text-center text-white border border-white/20 rounded-full px-2 py-1.5 bg-white/5 whitespace-nowrap">
              1-EYED JACKS REMOVE
            </div>
          </div>
        </div>

        {/* 3. Main Turquoise Inner Playing Board Wrapper */}
        <div className="flex-grow h-full bg-[#1c9dac] rounded-xl p-2 sm:p-3 flex gap-2 items-center justify-between relative overflow-hidden border border-white/20 shadow-inner">
          
          {/* Subtle printed grid pattern lines running in background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:10%_10%]" />

          {/* Core Card Matrix (10x10) */}
          <div className="flex-grow grid grid-cols-10 gap-0.5 bg-black/15 p-1 rounded-lg h-full relative z-10 shadow-[inner_0_2px_8px_rgba(0,0,0,0.15)]">
            {BOARD_LAYOUT.map((rowArr, rIndex) =>
              rowArr.map((cell, cIndex) => {
                const hasChip = boardChips[`${rIndex}_${cIndex}`];
                const isMatch = highlightCells.has(`${rIndex}_${cIndex}`);
                const isWon = isWinningCell(rIndex, cIndex);
                const corner = isCorner(rIndex, cIndex);

                return (
                  <MemoizedCell
                    key={`${rIndex}_${cIndex}`}
                    row={rIndex}
                    col={cIndex}
                    cell={cell}
                    hasChip={hasChip}
                    isMatch={isMatch}
                    isWon={isWon}
                    corner={corner}
                    isRemovalCard={isRemovalCard}
                    onCellClick={onCellClick}
                  />
                );
              })
            )}
          </div>

        </div>

        {/* 4. Right Rotated Side Rail - Matches left side rail */}
        <div className="hidden md:flex flex-col justify-between items-center py-4 px-1.5 w-[38px] text-white select-none shrink-0 ml-3 rounded-xl border border-white/30 bg-black/10">
          <div className="relative w-full h-[120px] shrink-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] text-[6.5px] font-sans font-black tracking-widest leading-none -rotate-90 uppercase text-center text-white border border-white/20 rounded-full px-2 py-1.5 bg-white/5 whitespace-nowrap">
              1-EYED JACKS REMOVE
            </div>
          </div>
          <div className="flex flex-col text-[17px] font-sans font-black tracking-[0.4em] leading-none my-auto items-center text-white/95 text-center">
            {'SEQUENCE'.split('').map((char, idx) => (
              <span key={idx} className="my-[2px]">{char}</span>
            ))}
          </div>
          <div className="relative w-full h-[120px] shrink-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] text-[6.5px] font-sans font-black tracking-widest leading-none rotate-90 uppercase text-center text-white border border-white/20 rounded-full px-2 py-1.5 bg-white/5 whitespace-nowrap">
              2-EYED JACKS WILD
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const GameBoardMemoized = React.memo(
  GameBoard,
  (prevProps, nextProps) => {
    return (
      prevProps.boardChips === nextProps.boardChips &&
      prevProps.selectedCard?.id === nextProps.selectedCard?.id &&
      prevProps.winningSequences === nextProps.winningSequences &&
      prevProps.userColor === nextProps.userColor
    );
  }
);

export default GameBoardMemoized;
