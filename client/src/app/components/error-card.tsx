import React from 'react';
import { Card } from './ui/card';
import { X, Check } from 'lucide-react';

interface ErrorCardProps {
  type: string;
  incorrect: string;
  correct: string;
  frequency?: number;
  className?: string;
}

export function ErrorCard({ 
  type, 
  incorrect, 
  correct, 
  frequency,
  className = '' 
}: ErrorCardProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-[#1A202C]">{type}</h4>
            {frequency !== undefined && (
              <p className="text-sm text-[#6B7280] mt-1">
                {frequency} {frequency === 1 ? 'vez' : 'veces'}
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-3 bg-[#FEE2E2] rounded-lg">
            <X className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#1A202C]">{incorrect}</p>
          </div>
          
          <div className="flex items-start gap-2 p-3 bg-[#D1FAE5] rounded-lg">
            <Check className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#1A202C]">{correct}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
