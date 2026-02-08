import React from 'react';
import { Badge } from './ui/badge';

interface StatBadgeProps {
  label: string;
  value: string | number;
  variant?: 'primary' | 'secondary' | 'accent' | 'success';
  className?: string;
}

export function StatBadge({ label, value, variant = 'primary', className = '' }: StatBadgeProps) {
  const variantStyles = {
    primary: 'bg-[#DBEAFE] text-[#2563EB]',
    secondary: 'bg-[#D1FAE5] text-[#10B981]',
    accent: 'bg-[#FEF3C7] text-[#F59E0B]',
    success: 'bg-[#D1FAE5] text-[#059669]',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm text-[#6B7280]">{label}:</span>
      <Badge className={`${variantStyles[variant]} font-medium`}>
        {value}
      </Badge>
    </div>
  );
}
