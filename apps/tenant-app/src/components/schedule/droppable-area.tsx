// apps/tenant-app/src/components/schedule/droppable-area.tsx
// Droppable area component for technician slots

'use client';

import { useDroppable } from '@dnd-kit/core';

interface DroppableAreaProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableArea({ id, children, className = '' }: DroppableAreaProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const baseClasses = className || 'border rounded-lg p-2 bg-gray-50';
  const hoverClasses = isOver
    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
    : '';

  return (
    <div ref={setNodeRef} className={`${baseClasses} ${hoverClasses} transition-all`}>
      {children}
    </div>
  );
}
