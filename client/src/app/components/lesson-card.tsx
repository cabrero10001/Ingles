import React from 'react';
import { Card } from './ui/card';
import { ChevronRight } from 'lucide-react';

interface LessonCardProps {
  title: string;
  description: string;
  duration?: string;
  completed?: boolean;
  onClick?: () => void;
  className?: string;
}

export function LessonCard({ 
  title, 
  description, 
  duration,
  completed = false,
  onClick,
  className = '' 
}: LessonCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`
        p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#2563EB]
        ${completed ? 'bg-[#F0FDF4] border-[#10B981]' : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {completed && <span className="text-[#10B981]">✓</span>}
            <h4 className="font-medium">{title}</h4>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">{description}</p>
          {duration && (
            <p className="text-xs text-[#9CA3AF] mt-2">{duration}</p>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
      </div>
    </Card>
  );
}
