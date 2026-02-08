import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, XCircle, Sparkles, Trophy } from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

type Challenge = {
  challengeId: string;
  dayNumber: number;
  goal: string;
  prompt: string;
  options: string[];
};

type ChallengeResult = {
  challengeId: string;
  isCorrect: boolean;
  correctIndex: number;
  selectedIndex: number;
  explanation: string;
  points: number;
  weeklyStats?: {
    weekStart: string;
    answeredCount: number;
    correctCount: number;
    totalPoints: number;
  };
};

export function DailyChallenge() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const playSuccessTone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.22);
      setTimeout(() => {
        void ctx.close();
      }, 260);
    } catch {
      // Ignore audio errors.
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem('daily_challenge_sound');
    setSoundEnabled(stored === 'on');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('daily_challenge_sound', soundEnabled ? 'on' : 'off');
  }, [soundEnabled]);

  useEffect(() => {
    if (!result?.isCorrect) return;
    setCelebrate(true);
    if (soundEnabled) playSuccessTone();
    const timer = setTimeout(() => setCelebrate(false), 1700);
    return () => clearTimeout(timer);
  }, [result, soundEnabled]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const out = await api.get<{ challenge: Challenge }>('/challenges/today');
        if (cancelled) return;
        setChallenge(out.challenge);
      } catch {
        // fallback handled by empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    if (!challenge || selectedIndex === null) return;
    setSubmitting(true);
    try {
      const out = await api.post<{ result: ChallengeResult }>('/challenges/answer', {
        challengeId: challenge.challengeId,
        selectedIndex,
      });
      setResult(out.result);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB]/5 via-[#10B981]/5 to-[#F59E0B]/5">
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <Badge className="bg-[#DBEAFE] text-[#2563EB]">Reto diario</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="relative overflow-hidden p-6 border-[#DBEAFE]">
          {celebrate && (
            <div className="pointer-events-none absolute inset-0 z-10">
              {[...Array(14)].map((_, i) => (
                <span
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-bounce"
                  style={{
                    left: `${8 + (i * 6)}%`,
                    top: `${10 + ((i % 4) * 8)}%`,
                    background: i % 3 === 0 ? '#2563EB' : i % 3 === 1 ? '#10B981' : '#F59E0B',
                    animationDelay: `${i * 40}ms`,
                    animationDuration: '700ms',
                  }}
                />
              ))}
            </div>
          )}
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#2563EB]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-[#10B981]/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h1 className="text-2xl text-[#1A202C] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2563EB]" />
                Pregunta del dia
              </h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled((s) => !s)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${soundEnabled ? 'bg-[#ECFDF5] border-[#86EFAC] text-[#166534]' : 'bg-white border-[#E5E7EB] text-[#4B5563]'}`}
                >
                  Sonido: {soundEnabled ? 'On' : 'Off'}
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE]">
                  <Trophy className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-sm text-[#1E40AF]">+10 pts por acierto</span>
                </div>
              </div>
            </div>

          {loading ? (
            <p className="text-[#6B7280]">Cargando reto...</p>
          ) : !challenge ? (
            <p className="text-[#6B7280]">No se pudo cargar el reto diario.</p>
          ) : (
            <>
              <div className="mb-5">
                <p className="text-sm text-[#6B7280] mb-2">Día {challenge.dayNumber}</p>
                <div className="h-2 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563EB] to-[#10B981] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (challenge.dayNumber / 30) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#BFDBFE] bg-white/80 p-4 mb-4">
                <p className="text-lg text-[#1A202C]">{challenge.prompt}</p>
              </div>

              <div className="space-y-3">
                {challenge.options.map((option, index) => {
                  const isSelected = selectedIndex === index;
                  const showResult = !!result;
                  const isCorrect = result?.correctIndex === index;
                  const isWrongSelected = showResult && isSelected && !isCorrect;
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={showResult}
                      onClick={() => setSelectedIndex(index)}
                      style={{ animationDelay: `${index * 70}ms` }}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                        isCorrect
                          ? 'border-[#10B981] bg-[#D1FAE5]'
                          : isWrongSelected
                            ? 'border-[#EF4444] bg-[#FEE2E2]'
                            : isSelected
                              ? 'border-[#2563EB] bg-[#EFF6FF] shadow-sm'
                              : 'border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] hover:border-[#BFDBFE]'
                      } hover:translate-y-[-1px]`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {!result ? (
                <Button
                  onClick={submit}
                  disabled={selectedIndex === null || submitting}
                  className="mt-6 bg-[#2563EB] hover:bg-[#1E40AF] text-white transition-all duration-300 hover:translate-y-[-1px] hover:shadow-lg"
                >
                  {submitting ? 'Revisando...' : 'Enviar respuesta'}
                </Button>
              ) : (
                <div className="mt-6">
                  <div className={`rounded-lg border p-4 ${result.isCorrect ? `bg-[#D1FAE5] border-[#10B981] ${celebrate ? 'animate-pulse' : ''}` : 'bg-[#FEE2E2] border-[#EF4444]'}`}>
                    <div className="flex items-start gap-2">
                      {result.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981] mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[#EF4444] mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-[#1A202C]">{result.isCorrect ? 'Correcto' : 'Casi, sigue practicando'}</p>
                        <p className="text-sm text-[#374151]">{result.explanation}</p>
                        <p className="text-sm text-[#1A202C] mt-1">Puntos ganados: {result.points}</p>
                      </div>
                    </div>
                  </div>

                  {result.weeklyStats && (
                    <Card className="mt-3 p-4 bg-[#EFF6FF] border-[#BFDBFE]">
                      <p className="text-sm text-[#1E3A8A]">
                        Esta semana: {result.weeklyStats.totalPoints} pts · {result.weeklyStats.correctCount}/{result.weeklyStats.answeredCount} retos correctos
                      </p>
                    </Card>
                  )}

                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="mt-4 bg-[#10B981] hover:bg-[#059669] text-white transition-all duration-300 hover:translate-y-[-1px]"
                  >
                    Volver al dashboard
                  </Button>
                </div>
              )}
            </>
          )}
          </div>
        </Card>
      </main>
    </div>
  );
}
