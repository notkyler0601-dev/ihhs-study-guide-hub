import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { useState, useMemo } from 'react';

interface Pair { left: string; right: string; }
interface Props { pairs: Pair[]; }

export default function DragMatch({ pairs }: Props) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const shuffledRights = useMemo(() => [...pairs.map((p) => p.right)].sort(() => Math.random() - 0.5), [pairs]);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const left = String(over.id);
    const right = String(active.id);
    setMatches((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) if (k !== left && v !== right) next[k] = v;
      next[left] = right;
      return next;
    });
  };

  const reset = () => setMatches({});
  const usedRights = new Set(Object.values(matches));
  const allDone = Object.keys(matches).length === pairs.length;
  const correctCount = Object.entries(matches).filter(([l, r]) => pairs.find((p) => p.left === l)?.right === r).length;

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-zinc-500">Drop targets</div>
          {pairs.map((p) => {
            const matchedRight = matches[p.left];
            const isCorrect = matchedRight && matchedRight === p.right;
            const isWrong = matchedRight && matchedRight !== p.right;
            return (
              <Droppable key={p.left} id={p.left} matched={matchedRight} isCorrect={!!isCorrect} isWrong={!!isWrong}>
                <div className="font-medium">{p.left}</div>
                {matchedRight && <div className="mt-1 text-sm">{matchedRight}</div>}
              </Droppable>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-zinc-500">Drag these</div>
          {shuffledRights.map((r) => (
            <Draggable key={r} id={r} disabled={usedRights.has(r)}>{r}</Draggable>
          ))}
        </div>
      </div>
      {allDone && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-center">
          <div className="text-lg font-semibold">{correctCount} / {pairs.length} correct</div>
          <button onClick={reset} className="mt-2 px-3 py-1 text-sm rounded-md bg-red-700 hover:bg-red-800 text-white">Try again</button>
        </div>
      )}
    </DndContext>
  );
}

function Draggable({ id, disabled, children }: { id: string; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  if (disabled) {
    return <div className="px-4 py-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-sm">{children}</div>;
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`px-4 py-3 rounded-lg border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 cursor-grab active:cursor-grabbing text-sm ${isDragging ? 'opacity-60 shadow-lg' : 'hover:border-red-400'}`}
    >
      {children}
    </div>
  );
}

function Droppable({ id, matched, isCorrect, isWrong, children }: { id: string; matched?: string; isCorrect?: boolean; isWrong?: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const cls = isCorrect
    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
    : isWrong
    ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/30'
    : isOver
    ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
    : 'border-zinc-200 dark:border-zinc-800';
  return (
    <div ref={setNodeRef} className={`px-4 py-3 min-h-[64px] rounded-lg border-2 border-dashed ${cls} text-sm`}>
      {children}
    </div>
  );
}
