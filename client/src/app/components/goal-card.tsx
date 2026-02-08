import React from 'react';
import { Card } from './ui/card';
import { LucideIcon } from 'lucide-react';

interface GoalCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GoalCard({ 
  icon: Icon, 
  title, 
  description,
  selected = false, 
  onClick,
  className = '' 
}: GoalCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`
        p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1
        ${selected 
          ? 'border-2 border-[#2563EB] bg-[#DBEAFE] shadow-md' 
          : 'border-2 border-transparent hover:border-[#E5E7EB]'
        }
        ${className}
      `}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`
          p-4 rounded-full transition-colors
          ${selected ? 'bg-[#2563EB] text-white' : 'bg-[#F3F4F6] text-[#2563EB]'}
        `}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-[#6B7280] mt-1">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
