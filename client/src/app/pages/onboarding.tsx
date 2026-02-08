import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { GoalCard } from '../components/goal-card';
import { Button } from '../components/ui/button';
import { Plane, Briefcase, Code, TrendingUp, MessageCircle, Gamepad2 } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/auth/AuthContext';

const goals = [
  {
    id: 'travel',
    icon: Plane,
    title: 'Viajar',
    description: 'Comunicarte con confianza en tus viajes',
  },
  {
    id: 'interviews',
    icon: Briefcase,
    title: 'Entrevistas laborales',
    description: 'Prepararte para oportunidades profesionales',
  },
  {
    id: 'programming',
    icon: Code,
    title: 'Programación / IT',
    description: 'Dominar el inglés técnico del sector',
  },
  {
    id: 'business',
    icon: TrendingUp,
    title: 'Negocios',
    description: 'Comunicarte efectivamente en el entorno empresarial',
  },
  {
    id: 'conversation',
    icon: MessageCircle,
    title: 'Conversación diaria',
    description: 'Hablar con fluidez en situaciones cotidianas',
  },
  {
    id: 'gaming',
    icon: Gamepad2,
    title: 'Gaming',
    description: 'Conectar con jugadores de todo el mundo',
  },
];

export function Onboarding() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const goalMap: Record<string, string> = {
    travel: 'TRAVEL',
    interviews: 'JOB_INTERVIEW',
    programming: 'IT',
    business: 'BUSINESS',
    conversation: 'DAILY_CONVERSATION',
    gaming: 'GAMING',
  };

  const handleContinue = async () => {
    if (!selectedGoal) return;
    setSubmitting(true);
    try {
      const goal = goalMap[selectedGoal];
      await api.post('/goal', { goal });
      await auth.refresh();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB]/5 via-[#10B981]/5 to-[#F59E0B]/5">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center text-white text-2xl font-bold">
              L
            </div>
            <h1 className="text-2xl text-[#1A202C]">LinguaPath</h1>
          </div>
          <h2 className="text-3xl text-[#1A202C] mb-3">
            ¿Para qué quieres aprender inglés?
          </h2>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
            Personaliza tu experiencia eligiendo tu objetivo principal. 
            Esto nos ayudará a crear un plan de aprendizaje perfecto para ti.
          </p>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              icon={goal.icon}
              title={goal.title}
              description={goal.description}
              selected={selectedGoal === goal.id}
              onClick={() => setSelectedGoal(goal.id)}
            />
          ))}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedGoal || submitting}
            size="lg"
            className="bg-[#2563EB] hover:bg-[#1E40AF] text-white px-12 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Guardando...' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
