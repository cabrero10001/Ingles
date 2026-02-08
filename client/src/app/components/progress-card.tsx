import React from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';

interface ProgressCardProps {
  day: number;
  totalDays: number;
  streak: number;
  className?: string;
}

export function ProgressCard({ day, totalDays, streak, className = '' }: ProgressCardProps) {
  const progress = (day / totalDays) * 100;

  return (
    <Card className={`p-6 bg-gradient-to-br from-[#2563EB] to-[#1E40AF] text-white ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Tu progreso</p>
            <h2 className="text-3xl mt-1">Día {day} de {totalDays}</h2>
          </div>
          <div className="text-center bg-white/20 rounded-lg px-4 py-3 backdrop-blur-sm">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl">{streak}</div>
            <div className="text-xs opacity-90">días</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress} className="h-3 bg-white/20" />
          <p className="text-sm opacity-90">{Math.round(progress)}% completado</p>
        </div>
      </div>
    </Card>
  );
}
