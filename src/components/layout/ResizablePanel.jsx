import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export function ResizableHandle({
  orientation = 'horizontal', // 'horizontal' = split columns (left/right drag), 'vertical' = split rows (up/down drag)
  onResize,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      if (orientation === 'horizontal') {
        const delta = e.clientX - startPosRef.current;
        startPosRef.current = e.clientX;
        onResize(delta);
      } else {
        const delta = e.clientY - startPosRef.current;
        startPosRef.current = e.clientY;
        onResize(delta);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'unset';
      document.body.style.userSelect = 'unset';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'unset';
      document.body.style.userSelect = 'unset';
    };
  }, [isDragging, orientation, onResize]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    startPosRef.current = orientation === 'horizontal' ? e.clientX : e.clientY;
    setIsDragging(true);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        'group flex items-center justify-center transition-colors select-none z-10',
        orientation === 'horizontal'
          ? 'w-1.5 hover:w-1.5 cursor-col-resize hover:bg-emerald-500/50 active:bg-emerald-600 bg-slate-200 dark:bg-slate-800'
          : 'h-1.5 hover:h-1.5 cursor-row-resize hover:bg-emerald-500/50 active:bg-emerald-600 bg-slate-200 dark:bg-slate-800',
        isDragging && 'bg-emerald-600',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full bg-slate-400/40 group-hover:bg-emerald-300 transition-colors',
          orientation === 'horizontal' ? 'h-6 w-0.5' : 'w-6 h-0.5'
        )}
      />
    </div>
  );
}
