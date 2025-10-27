// apps/tenant-app/src/components/schedule/draggable-job.tsx
// Draggable job card component

'use client';

import { useDraggable } from '@dnd-kit/core';
import { Clock } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';

interface DraggableJobProps {
  job: {
    id: string;
    publicId: string;
    customerName: string;
    scheduledStart: string;
    duration: number;
    status: string;
    priority: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
  renderStatus?: (status: string) => React.ReactNode;
}

export function DraggableJob({
  job,
  isSelected,
  onClick,
  renderStatus,
}: DraggableJobProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`p-3 bg-white border-2 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isSelected ? 'border-blue-500' : 'border-gray-200'
      } ${isDragging ? 'shadow-xl' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-gray-900">{job.publicId}</div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
              job.priority === 'high'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {job.priority}
          </span>
          {renderStatus?.(job.status)}
        </div>
      </div>
      <div className="text-sm text-gray-900 mb-1">{job.customerName}</div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Clock className="w-3 h-3" />
        <span>
          {new Date(job.scheduledStart).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </span>
        <span>•</span>
        <span>{job.duration} min</span>
      </div>
    </div>
  );
}
