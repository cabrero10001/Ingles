import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

const lessonData = {
  title: 'Variables and Data Types',
  day: 7,
  microGoal: 'Dominar 10 términos técnicos en inglés',
  vocabulary: [
    'Variable',
    'String',
    'Integer',
    'Boolean',
    'Array',
    'Object',
    'Function',
    'Parameter',
  ],
  exercise: {
    title: 'Práctica escrita',
    prompt: 'Escribe un párrafo breve (50-80 palabras) explicando qué es una variable en programación y para qué se utiliza. Usa al menos 3 de los términos del vocabulario.',
    minWords: 50,
    maxWords: 80,
  },
  activityType: 'WRITING' as 'WRITING' | 'CONVERSATION',
  conversation: {
    context: 'Simulacion breve para practicar conversacion.',
    lines: ['Partner: Hello!', 'You: Hi, nice to meet you.'],
    suggestedPhrases: ['Could you repeat that?', 'That sounds good.'],
  },
};

export function Lesson() {
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(lessonData);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'needs-improvement' | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [conversationAnswer, setConversationAnswer] = useState('');
  const [apiUnavailable, setApiUnavailable] = useState(false);

  const wordCount = answer.trim().split(/\s+/).filter(word => word.length > 0).length;
  const conversationWordCount = conversationAnswer.trim().split(/\s+/).filter(word => word.length > 0).length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const out = await api.get<{
          lesson: {
            title: string;
            dayNumber: number;
            microObjective: string;
            vocabulary: string[];
            prompt: string;
            activityType: 'WRITING' | 'CONVERSATION';
            conversation: {
              context: string;
              lines: string[];
              suggestedPhrases: string[];
            };
          };
        }>('/lessons/today');
        if (cancelled) return;
        setLesson({
          title: out.lesson.title,
          day: out.lesson.dayNumber,
          microGoal: out.lesson.microObjective,
          vocabulary: out.lesson.vocabulary,
          exercise: {
            ...lessonData.exercise,
            prompt: out.lesson.prompt,
          },
          activityType: out.lesson.activityType,
          conversation: out.lesson.conversation,
        });
      } catch {
        // Keep mock UI if API is not ready.
        setApiUnavailable(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dynamicSuggestions = useMemo(() => {
    if (tips.length === 0) return null;
    return tips.slice(0, 2);
  }, [tips]);

  const handleSubmit = async () => {
    setSubmitted(true);
    try {
      const out = await api.post<{
        score: number;
        detectedErrors: Array<{ message: string }>;
      }>('/lessons/complete', {
        userAnswer: lesson.activityType === 'CONVERSATION' ? conversationAnswer : answer,
      });

      const detectedErrors = Array.isArray((out as any).detectedErrors)
        ? (out as any).detectedErrors
        : [];
      const score = typeof (out as any).score === 'number'
        ? (out as any).score
        : typeof (out as any).lesson?.score === 'number'
          ? (out as any).lesson.score
          : null;

      setTips(detectedErrors.map((e: { message: string }) => e.message));
      if (detectedErrors.length === 0) {
        setFeedback('correct');
      } else {
        setFeedback(score !== null && score >= 85 ? 'correct' : 'needs-improvement');
      }
      setApiUnavailable(false);
    } catch {
      setSubmitted(false);
      setFeedback(null);
      setApiUnavailable(true);
      toast.error('No se pudo evaluar la leccion. Intenta de nuevo en unos segundos.');
    }
  };

  const handleContinue = () => {
    navigate('/completado');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB]/5 via-[#10B981]/5 to-[#F59E0B]/5">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <Badge className="bg-[#FEF3C7] text-[#F59E0B]">
            Día {lesson.day}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Lesson Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-[#1A202C] mb-3">{lesson.title}</h1>
          <div className="flex items-center gap-2 text-[#6B7280]">
            <span className="text-sm">Objetivo:</span>
            <span className="text-sm font-medium text-[#1A202C]">{lesson.microGoal}</span>
          </div>
          <div className="mt-2">
            <Badge className={lesson.activityType === 'CONVERSATION' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#DBEAFE] text-[#2563EB]'}>
              {lesson.activityType === 'CONVERSATION' ? 'Modo: Conversación' : 'Modo: Writing'}
            </Badge>
          </div>
        </div>

        {/* Vocabulary Section */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg text-[#1A202C] mb-4">Vocabulario clave</h3>
          <div className="flex flex-wrap gap-2">
            {lesson.vocabulary.map((word, index) => (
              <Badge
                key={index}
                className="bg-[#DBEAFE] text-[#2563EB] px-4 py-2 text-sm"
              >
                {word}
              </Badge>
            ))}
          </div>
        </Card>

        {lesson.activityType === 'WRITING' ? (
          <Card className="p-6 mb-6">
            <h3 className="text-lg text-[#1A202C] mb-2">{lesson.exercise.title}</h3>
            <p className="text-[#6B7280] mb-6">{lesson.exercise.prompt}</p>

            <div className="space-y-4">
              <Textarea
                placeholder="Escribe tu respuesta aquí..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitted}
                className="min-h-[200px] bg-[#F9FAFB] border-[#E5E7EB] resize-none"
              />

              <div className="flex items-center justify-between text-sm">
                <span className={`
                  ${wordCount < lesson.exercise.minWords ? 'text-[#EF4444]' : 
                    wordCount > lesson.exercise.maxWords ? 'text-[#F59E0B]' : 
                    'text-[#10B981]'}
                `}>
                  {wordCount} palabras
                  {wordCount < lesson.exercise.minWords && ` (mínimo ${lesson.exercise.minWords})`}
                  {wordCount > lesson.exercise.maxWords && ` (máximo ${lesson.exercise.maxWords})`}
                </span>
              </div>
            </div>

            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={wordCount < lesson.exercise.minWords || wordCount > lesson.exercise.maxWords || !answer.trim()}
                className="w-full mt-6 bg-[#2563EB] hover:bg-[#1E40AF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar respuesta
              </Button>
            ) : null}
          </Card>
        ) : (
          <Card className="p-6 mb-6 border-[#BFDBFE] bg-gradient-to-r from-[#EFF6FF] to-[#F8FAFC]">
            <h3 className="text-lg text-[#1A202C] mb-2">Simulador de conversación</h3>
            <p className="text-[#6B7280] mb-4">{lesson.conversation.context}</p>

            <div className="space-y-2 mb-4">
              {lesson.conversation.lines.map((line, i) => (
                <div key={i} className="rounded-md bg-white border border-[#E5E7EB] px-3 py-2 text-sm text-[#1A202C]">
                  {line}
                </div>
              ))}
            </div>

            <div className="mb-4">
              <p className="text-xs text-[#6B7280] mb-2">Frases sugeridas</p>
              <div className="flex flex-wrap gap-2">
                {lesson.conversation.suggestedPhrases.map((p, i) => (
                  <Badge key={i} className="bg-white text-[#2563EB] border border-[#BFDBFE]">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Escribe cómo responderías en esta conversación..."
              value={conversationAnswer}
              onChange={(e) => setConversationAnswer(e.target.value)}
              disabled={submitted}
              className="min-h-[160px] bg-white border-[#BFDBFE] resize-none"
            />

            <div className="mt-3 text-sm">
              <span className={conversationWordCount < 20 ? 'text-[#EF4444]' : 'text-[#10B981]'}>
                {conversationWordCount} palabras {conversationWordCount < 20 ? '(mínimo recomendado 20)' : ''}
              </span>
            </div>

            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={conversationWordCount < 20 || !conversationAnswer.trim()}
                className="w-full mt-6 bg-[#2563EB] hover:bg-[#1E40AF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar respuesta
              </Button>
            ) : null}
          </Card>
        )}

        {submitted && (
          <Card className="p-6 mb-6">
            {feedback === 'correct' ? (
              <div className="bg-[#D1FAE5] border-2 border-[#10B981] rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#1A202C] mb-1">¡Excelente trabajo!</h4>
                    <p className="text-sm text-[#1A202C]">
                      Tu respuesta muestra un buen entendimiento del concepto.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#FEF3C7] border-2 border-[#F59E0B] rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#1A202C] mb-1">Buen intento</h4>
                    <p className="text-sm text-[#1A202C] mb-2">Aquí hay algunas sugerencias:</p>
                    <ul className="text-sm text-[#1A202C] list-disc list-inside space-y-1">
                      {dynamicSuggestions ? (
                        dynamicSuggestions.map((s, i) => <li key={i}>{s}</li>)
                      ) : (
                        <>
                          <li>Usa mas vocabulario clave</li>
                          <li>Revisa la estructura de tus oraciones</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleContinue} className="w-full bg-[#10B981] hover:bg-[#059669] text-white">
              Continuar
            </Button>
          </Card>
        )}

        {apiUnavailable && (
          <Card className="p-4 mb-6 bg-[#FEF2F2] border-[#FECACA]">
            <p className="text-sm text-[#991B1B]">
              El servidor no devolvio la evaluacion de esta leccion. Es probable que el backend desplegado no tenga habilitadas las rutas `/api/lessons/today` y `/api/lessons/complete`.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
