import React from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';

export function Completed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB]/5 via-[#10B981]/5 to-[#F59E0B]/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center animate-[bounce_1s_ease-in-out_3]">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title and Message */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl text-[#1A202C] mb-4">
            ¡Lección completada! 🎉
          </h1>
          <p className="text-lg text-[#6B7280] max-w-lg mx-auto">
            Has completado la lección de hoy. Tu racha continúa y estás cada vez más cerca de tu objetivo.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-[#DBEAFE]">
            <p className="text-2xl text-[#2563EB] mb-1">+10</p>
            <p className="text-sm text-[#1A202C]">Palabras nuevas</p>
          </Card>
          <Card className="p-4 bg-[#FEF3C7]">
            <p className="text-2xl text-[#F59E0B] mb-1">7</p>
            <p className="text-sm text-[#1A202C]">Días seguidos</p>
          </Card>
          <Card className="p-4 bg-[#D1FAE5]">
            <p className="text-2xl text-[#10B981] mb-1">23%</p>
            <p className="text-sm text-[#1A202C]">Completado</p>
          </Card>
        </div>

        {/* Motivation */}
        <Card className="p-5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-medium">Consejo del día</h3>
          </div>
          <p className="text-sm text-white/90">
            La consistencia es más importante que la perfección. 
            Sigue practicando todos los días y verás resultados sorprendentes.
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white"
            size="lg"
          >
            Volver al dashboard
          </Button>
          <Button
            onClick={() => navigate('/errores')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Ver mis errores
          </Button>
        </div>
      </Card>
    </div>
  );
}
