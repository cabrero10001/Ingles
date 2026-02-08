import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ErrorCard } from '../components/error-card';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { ArrowLeft, TrendingDown } from 'lucide-react';
import { api } from '../services/api';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'have', 'you', 'are', 'was', 'were', 'will',
  'is', 'am', 'to', 'of', 'in', 'on', 'at', 'a', 'an', 'or', 'as', 'by', 'it', 'be', 'use', 'add', 'more',
]);

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function errorTypeToLabel(type: string) {
  return type === 'PREPOSITION'
    ? 'Preposiciones'
    : type === 'TENSE'
      ? 'Tiempos verbales'
      : type === 'ARTICLE'
        ? 'Artículos (a/an/the)'
        : type === 'WORD_ORDER'
          ? 'Orden de oración'
          : type === 'SPELLING'
            ? 'Ortografía'
            : 'Otros';
}

function buildHighlightMeta(errors: Array<{ wrongExample: string; errorType: string; message: string }>) {
  const out = new Set<string>();
  const meta: Record<string, { typeLabel: string; message: string }> = {};

  for (const err of errors) {
    const tokens = err.wrongExample
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));

    for (const t of tokens) {
      out.add(t);
      if (!meta[t]) {
        meta[t] = {
          typeLabel: errorTypeToLabel(err.errorType),
          message: err.message,
        };
      }
    }
  }

  return {
    terms: Array.from(out).sort((a, b) => b.length - a.length).slice(0, 18),
    meta,
  };
}

function renderHighlightedAnswer(
  answer: string,
  terms: string[],
  meta: Record<string, { typeLabel: string; message: string }>,
  onTermTap: (text: string) => void,
) {
  if (!terms.length) return answer;
  const pattern = terms.map((t) => escapeRegExp(t)).join('|');
  if (!pattern) return answer;
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = answer.split(regex);

  return parts.map((part, index) => {
    const isMatch = terms.some((t) => t.toLowerCase() === part.toLowerCase());
    if (!isMatch) return <React.Fragment key={index}>{part}</React.Fragment>;

    const info = meta[part.toLowerCase()];
    return (
      <Tooltip key={index}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onTermTap(info ? `${info.typeLabel}: ${info.message}` : 'Posible zona de error')}
            className="bg-[#FEF3C7] text-[#92400E] rounded px-0.5 cursor-help"
          >
            {part}
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          {info ? `${info.typeLabel}: ${info.message}` : 'Posible zona de error'}
        </TooltipContent>
      </Tooltip>
    );
  });
}

const errorsData = [
  {
    type: 'Preposiciones con verbos',
    incorrect: 'I am good in programming.',
    correct: 'I am good at programming.',
    frequency: 8,
  },
  {
    type: 'Presente perfecto vs. Pasado simple',
    incorrect: 'I worked here since 2020.',
    correct: 'I have worked here since 2020.',
    frequency: 5,
  },
  {
    type: 'Artículos (a/an/the)',
    incorrect: 'I need to learn the Python.',
    correct: 'I need to learn Python.',
    frequency: 3,
  },
  {
    type: 'Orden de adjetivos',
    incorrect: 'I have a red beautiful car.',
    correct: 'I have a beautiful red car.',
    frequency: 2,
  },
  {
    type: 'Falsos amigos',
    incorrect: 'I need to assist the meeting.',
    correct: 'I need to attend the meeting.',
    frequency: 4,
  },
];

export function Errors() {
  const navigate = useNavigate();

  const [items, setItems] = useState(errorsData);
  const [historyLessons, setHistoryLessons] = useState<
    Array<{
      lessonId: string;
      dayNumber: number;
      lessonTitle: string;
      score: number;
      completedAt: string;
      userAnswer: string;
      errors: Array<{
        id: string;
        errorType: string;
        message: string;
        wrongExample: string;
        correctExample: string;
      }>;
    }>
  >([]);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
  const [selectedHintByLesson, setSelectedHintByLesson] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const out = await api.get<{
          errors: Array<{ errorType: string; count: number; sample: { wrong: string; correct: string; message: string } | null }>;
        }>('/errors/top');
        const history = await api.get<{
          lessons: Array<{
            lessonId: string;
            dayNumber: number;
            lessonTitle: string;
            score: number;
            completedAt: string;
            userAnswer: string;
            errors: Array<{
              id: string;
              errorType: string;
              message: string;
              wrongExample: string;
              correctExample: string;
            }>;
          }>;
        }>('/errors/history');
        if (cancelled) return;
        setItems(
          out.errors.map((e) => ({
            type: errorTypeToLabel(e.errorType),
            incorrect: e.sample?.wrong ?? '—',
            correct: e.sample?.correct ?? '—',
            frequency: e.count,
          })),
        );
        setHistoryLessons(history.lessons);
      } catch {
        // Keep mock UI if API is not ready.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalErrors = useMemo(() => items.reduce((sum, error) => sum + error.frequency, 0), [items]);
  const mostFrequent = items[0] ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB]/5 via-[#10B981]/5 to-[#F59E0B]/5">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="text-xl text-[#1A202C]">Errores frecuentes</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-3xl text-[#1A202C] mb-3">
            Aprende de tus errores
          </h2>
          <p className="text-lg text-[#6B7280] mb-6">
            Identifica patrones y mejora continuamente. Cada error es una oportunidad de aprendizaje.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FEF3C7] rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-sm text-[#6B7280]">Total de errores</p>
                  <p className="text-2xl text-[#1A202C]">{totalErrors}</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 md:col-span-2 bg-[#FEF3C7]">
              <p className="text-sm text-[#F59E0B] mb-1">Más frecuente</p>
              <p className="text-lg text-[#1A202C] font-medium">
                {mostFrequent ? `${mostFrequent.type} (${mostFrequent.frequency} veces)` : 'Sin datos aún'}
              </p>
              <p className="text-sm text-[#6B7280] mt-2">
                {mostFrequent ? 'Este error ya casi lo dominas 💪' : 'Completa una lección para ver tu análisis.'}
              </p>
            </Card>
          </div>
        </div>

        {/* Errors List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl text-[#1A202C]">Tus errores comunes</h3>
            <Badge className="bg-[#DBEAFE] text-[#2563EB]">
              {items.length} categorías
            </Badge>
          </div>

          {items.length === 0 && (
            <Card className="mb-4 p-4 bg-[#EFF6FF] border-[#BFDBFE]">
              <p className="text-sm text-[#1E40AF]">
                Aun no hay errores registrados. Completa tu lección de hoy para ver recomendaciones personalizadas.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((error, index) => (
              <ErrorCard
                key={index}
                type={error.type}
                incorrect={error.incorrect}
                correct={error.correct}
                frequency={error.frequency}
              />
            ))}
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl text-[#1A202C]">Errores por lección</h3>
              <Badge className="bg-[#E5E7EB] text-[#374151]">{historyLessons.length} lecciones</Badge>
            </div>

            {historyLessons.length === 0 ? (
              <Card className="p-4 bg-[#F9FAFB]">
                <p className="text-sm text-[#6B7280]">Todavía no hay lecciones con errores registrados.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {historyLessons.map((lesson) => (
                  <Card key={lesson.lessonId} className="p-5">
                    {/** terms to highlight in submitted answer */}
                    {(() => {
                      const { terms: highlightTerms, meta: highlightMeta } = buildHighlightMeta(lesson.errors);
                      return (
                        <>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <h4 className="text-lg text-[#1A202C]">Día {lesson.dayNumber}: {lesson.lessonTitle}</h4>
                        <p className="text-sm text-[#6B7280]">
                          Puntaje {Math.round(lesson.score)} · {new Date(lesson.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-[#FEF3C7] text-[#92400E]">{lesson.errors.length} errores</Badge>
                    </div>

                    <div className="mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedAnswers((prev) => ({
                            ...prev,
                            [lesson.lessonId]: !prev[lesson.lessonId],
                          }))
                        }
                      >
                        {expandedAnswers[lesson.lessonId] ? 'Ocultar respuesta' : 'Ver respuesta que envié'}
                      </Button>
                      {expandedAnswers[lesson.lessonId] && (
                        <Card className="mt-3 p-4 bg-[#F9FAFB] border-[#E5E7EB]">
                          {highlightTerms.length > 0 && (
                            <p className="text-xs text-[#92400E] mb-2">
                              Resaltado: toca una palabra para ver detalle (en desktop tambien puedes pasar el mouse).
                            </p>
                          )}
                          <p className="text-sm text-[#374151] whitespace-pre-wrap">
                            {renderHighlightedAnswer(
                              lesson.userAnswer,
                              highlightTerms,
                              highlightMeta,
                              (text) => {
                                setSelectedHintByLesson((prev) => ({ ...prev, [lesson.lessonId]: text }));
                              },
                            )}
                          </p>
                          {selectedHintByLesson[lesson.lessonId] && (
                            <div className="mt-3 rounded-md bg-[#FFF7ED] border border-[#FED7AA] p-2">
                              <p className="text-xs text-[#9A3412]">{selectedHintByLesson[lesson.lessonId]}</p>
                            </div>
                          )}
                        </Card>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {lesson.errors.map((error) => (
                        <ErrorCard
                          key={error.id}
                          type={`${errorTypeToLabel(error.errorType)}: ${error.message}`}
                          incorrect={error.wrongExample}
                          correct={error.correctExample}
                        />
                      ))}
                    </div>
                        </>
                      );
                    })()}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Motivation Message */}
          <Card className="mt-8 p-6 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💡</div>
              <div>
                <h3 className="text-xl mb-2">Sigue así</h3>
                <p className="text-white/90">
                  Has reducido tus errores en un 30% desde que empezaste. 
                  La práctica constante es la clave del éxito.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
