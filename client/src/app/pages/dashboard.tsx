import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ProgressCard } from '../components/progress-card';
import { LessonCard } from '../components/lesson-card';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Target, TrendingUp, AlertCircle, ChevronRight, Trophy, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/auth/AuthContext';

// Mock data
const userData = {
  name: 'Alex',
  currentDay: 7,
  totalDays: 30,
  streak: 7,
  goal: 'Sin objetivo',
};

const todayLesson = {
  title: 'Variables and Data Types',
  description: 'Lección personalizada para tu objetivo',
  duration: '15 min',
  microGoal: 'Dominar 10 términos técnicos en inglés',
};

const commonErrors = [
  { type: 'Preposiciones', count: 8 },
  { type: 'Tiempos verbales', count: 5 },
  { type: 'Artículos', count: 3 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [me, setMe] = useState(userData);
  const [today, setToday] = useState(todayLesson);
  const [topErrors, setTopErrors] = useState(commonErrors);
  const [challengeStats, setChallengeStats] = useState({
    totalPoints: 0,
    correctCount: 0,
    answeredCount: 0,
  });
  const [previewLesson, setPreviewLesson] = useState<null | {
    title: string;
    description: string;
    duration: string;
    summary: string;
  }>(null);

  const goalLabel = useMemo(() => {
    const g = auth.user?.currentGoal;
    const map: Record<string, string> = {
      TRAVEL: 'Viajar',
      JOB_INTERVIEW: 'Entrevistas laborales',
      IT: 'Programación / IT',
      BUSINESS: 'Negocios',
      DAILY_CONVERSATION: 'Conversación diaria',
      GAMING: 'Gaming',
    };
    return g ? map[g] ?? g : me.goal;
  }, [auth.user?.currentGoal, me.goal]);

  const lessonDescriptionByGoal = useMemo(() => {
    const g = auth.user?.currentGoal;
    const map: Record<string, string> = {
      TRAVEL: 'Practica frases utiles para viajar',
      JOB_INTERVIEW: 'Mejora tus respuestas para entrevistas',
      IT: 'Aprende ingles tecnico para tecnologia',
      BUSINESS: 'Refuerza comunicacion profesional',
      DAILY_CONVERSATION: 'Practica ingles para situaciones cotidianas',
      GAMING: 'Mejora comunicacion en partidas online',
    };
    return g ? map[g] ?? 'Lección personalizada para tu objetivo' : 'Lección personalizada para tu objetivo';
  }, [auth.user?.currentGoal]);

  const nextLessons = useMemo(() => {
    const g = auth.user?.currentGoal;
    const map: Record<string, Array<{ title: string; description: string; duration: string; summary: string }>> = {
      TRAVEL: [
        {
          title: 'At the Airport',
          description: 'Frases para check-in y abordaje',
          duration: '15 min',
          summary: 'Practicaras dialogos cortos en aeropuerto: preguntar por puerta de embarque, confirmar equipaje y resolver situaciones comunes de viaje con vocabulario funcional.',
        },
        {
          title: 'Hotel Check-in',
          description: 'Expresiones para reservas y servicios',
          duration: '20 min',
          summary: 'Vas a trabajar expresiones de recepcion: reservar habitacion, pedir cambios y hacer solicitudes de servicio de forma natural y clara.',
        },
      ],
      JOB_INTERVIEW: [
        {
          title: 'Tell Me About Yourself',
          description: 'Estructura una respuesta clara y natural',
          duration: '20 min',
          summary: 'Construiras una presentacion profesional breve con estructura inicio-desarrollo-cierre para responder con confianza en entrevistas.',
        },
        {
          title: 'Strengths and Weaknesses',
          description: 'Habla de tu perfil con confianza',
          duration: '15 min',
          summary: 'Aprenderas a expresar fortalezas con ejemplos reales y debilidades bien enfocadas en mejora continua sin afectar tu perfil.',
        },
      ],
      IT: [
        {
          title: 'Functions and Methods',
          description: 'Vocabulario para funciones en programación',
          duration: '20 min',
          summary: 'Reforzaras vocabulario tecnico de funciones, parametros y retorno para explicar logica de codigo en contextos reales de trabajo.',
        },
        {
          title: 'Code Reviews',
          description: 'Expresiones para revisar código en equipo',
          duration: '15 min',
          summary: 'Practicaras frases para dar feedback de codigo, sugerir mejoras y comentar errores de forma colaborativa y profesional.',
        },
      ],
      BUSINESS: [
        {
          title: 'Meeting Updates',
          description: 'Lenguaje para reportes en reuniones',
          duration: '15 min',
          summary: 'Usaras estructuras para presentar avances, bloqueos y proximos pasos en reuniones con tono ejecutivo y mensajes concretos.',
        },
        {
          title: 'Professional Emails',
          description: 'Redacta correos claros y profesionales',
          duration: '20 min',
          summary: 'Vas a redactar correos de seguimiento y solicitud con una estructura profesional, claridad en objetivos y cierre efectivo.',
        },
      ],
      DAILY_CONVERSATION: [
        {
          title: 'Small Talk in Daily Life',
          description: 'Frases naturales para conversaciones cotidianas',
          duration: '15 min',
          summary: 'Practicaras preguntas y respuestas cortas para conversaciones casuales: clima, rutina, gustos y situaciones comunes del dia a dia.',
        },
        {
          title: 'Making Plans',
          description: 'Invitar, aceptar y proponer planes',
          duration: '15 min',
          summary: 'Aprenderas expresiones para invitar, proponer horarios y confirmar planes de forma natural en ingles conversacional.',
        },
      ],
      GAMING: [
        {
          title: 'Team Callouts',
          description: 'Comunicación rápida durante partidas',
          duration: '15 min',
          summary: 'Entrenaras frases rapidas para posicion, peligro y apoyo en partida, mejorando la comunicacion en tiempo real con tu equipo.',
        },
        {
          title: 'Strategy and Roles',
          description: 'Coordina roles y objetivos del equipo',
          duration: '20 min',
          summary: 'Vas a practicar vocabulario para asignar roles, coordinar objetivos y definir jugadas antes y durante la partida.',
        },
      ],
    };
    return g ? map[g] ?? [] : [];
  }, [auth.user?.currentGoal]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await api.get<{ user: { name: string; currentDay: number; streak: number; currentGoal: string | null } }>('/me');
        const lessonRes = await api.get<{ lesson: { title: string; microObjective: string } }>('/lessons/today');
        const errorsRes = await api.get<{ errors: Array<{ errorType: string; count: number }> }>('/errors/top');
        const challengeStatsRes = await api.get<{
          stats: { totalPoints: number; correctCount: number; answeredCount: number };
        }>('/challenges/stats');

        const goalMap: Record<string, string> = {
          TRAVEL: 'Viajar',
          JOB_INTERVIEW: 'Entrevistas laborales',
          IT: 'Programación / IT',
          BUSINESS: 'Negocios',
          DAILY_CONVERSATION: 'Conversación diaria',
          GAMING: 'Gaming',
        };

        if (cancelled) return;
        setMe((prev) => ({
          ...prev,
          name: meRes.user.name,
          currentDay: meRes.user.currentDay,
          streak: meRes.user.streak,
          goal: meRes.user.currentGoal ? (goalMap[meRes.user.currentGoal] ?? meRes.user.currentGoal) : 'Sin objetivo',
        }));
        setToday((prev) => ({
          ...prev,
          title: lessonRes.lesson.title,
          description: lessonDescriptionByGoal,
          microGoal: lessonRes.lesson.microObjective,
        }));
        setTopErrors(
          errorsRes.errors.map((e) => ({
            type:
              e.errorType === 'PREPOSITION'
                ? 'Preposiciones'
                : e.errorType === 'TENSE'
                  ? 'Tiempos verbales'
                  : e.errorType === 'ARTICLE'
                    ? 'Artículos'
                    : e.errorType === 'WORD_ORDER'
                      ? 'Orden de oración'
                      : e.errorType === 'SPELLING'
                        ? 'Ortografía'
                        : 'Otros',
            count: e.count,
          })),
        );
        setChallengeStats(challengeStatsRes.stats);
      } catch {
        // Keep mock UI if API is not ready.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lessonDescriptionByGoal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB]/5 via-[#10B981]/5 to-[#F59E0B]/5">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center text-white text-xl font-bold">
              L
            </div>
            <h1 className="text-xl text-[#1A202C]">LinguaPath</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/errores')}>
              Mis errores
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-10 h-10 bg-[#F3F4F6] rounded-full flex items-center justify-center text-[#1A202C] font-medium hover:bg-[#E5E7EB] transition-colors"
                  aria-label="Abrir menu de usuario"
                >
                  {(auth.user?.name ?? me.name)[0]}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="truncate">{auth.user?.name ?? me.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async () => {
                    await auth.logout();
                    navigate('/');
                  }}
                >
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h2 className="text-3xl text-[#1A202C] mb-2">
            Hola, {auth.user?.name ?? me.name} 👋
          </h2>
          <p className="text-lg text-[#6B7280]">
            ¡Sigues en racha! Continúa con tu lección de hoy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ProgressCard
              day={auth.user?.currentDay ?? me.currentDay}
              totalDays={me.totalDays}
              streak={auth.user?.streak ?? me.streak}
            />
          </div>

          {/* Goal Card */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#6B7280] mb-3">
                <Target className="w-5 h-5" />
                <span className="text-sm">Tu objetivo</span>
              </div>
              <h3 className="text-xl text-[#1A202C] mb-2">{goalLabel}</h3>
              <p className="text-sm text-[#6B7280]">
                Contenido personalizado para tu meta
              </p>
            </div>
            <Badge className="bg-[#DBEAFE] text-[#2563EB] mt-4 w-fit">
              Activo
            </Badge>
          </Card>
        </div>

        {/* Today's Lesson */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl text-[#1A202C]">Lección de hoy</h3>
            <Badge className="bg-[#FEF3C7] text-[#F59E0B]">
              Día {auth.user?.currentDay ?? me.currentDay}
            </Badge>
          </div>

          <Card className="p-6 bg-gradient-to-r from-[#10B981] to-[#059669] text-white mb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-2xl mb-2">{today.title}</h4>
                <p className="text-white/90 mb-3">{today.description}</p>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <TrendingUp className="w-4 h-4" />
                  <span>{today.microGoal}</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/leccion')}
              className="bg-white text-[#10B981] hover:bg-white/90 w-full sm:w-auto"
            >
              Empezar lección
            </Button>
          </Card>

          <Card className="relative overflow-hidden p-5 border-[#DBEAFE] bg-gradient-to-r from-[#EEF4FF] via-[#F6FBFF] to-[#ECFDF5]">
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-[#2563EB]/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 left-10 w-24 h-24 bg-[#10B981]/10 rounded-full blur-2xl" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/80 border border-[#BFDBFE] mb-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs text-[#1E40AF]">Interactivo</span>
                </div>
                <h4 className="text-lg text-[#1A202C] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#2563EB]" />
                  Reto diario
                </h4>
                <p className="text-sm text-[#4B5563]">Una pregunta rapida de opcion multiple para practicar comprension.</p>
                <p className="text-sm text-[#2563EB] mt-1 font-medium">
                  Semana: {challengeStats.totalPoints} pts · {challengeStats.correctCount}/{challengeStats.answeredCount} acertados
                </p>
              </div>
              <Button
                onClick={() => navigate('/reto-diario')}
                className="bg-[#2563EB] hover:bg-[#1E40AF] text-white transition-all duration-300 hover:translate-y-[-1px] hover:shadow-lg"
              >
                Ir al reto
              </Button>
            </div>
          </Card>

          <Card className="p-5 border-[#FDE68A] bg-gradient-to-r from-[#FFFBEB] to-[#FFF7ED]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="text-lg text-[#1A202C]">Conversaciones con IA</h4>
                <p className="text-sm text-[#6B7280]">Practica en contexto real con barista, reclutador o amigo extranjero.</p>
              </div>
              <Button onClick={() => navigate('/conversacion-ia')} className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
                Iniciar chat
              </Button>
            </div>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Common Errors Preview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-[#1A202C]">Errores frecuentes</h3>
              <button
                onClick={() => navigate('/errores')}
                className="text-sm text-[#2563EB] hover:underline flex items-center gap-1"
              >
                Ver todos
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Card className="p-5">
              {topErrors.length > 0 ? (
                <div className="space-y-3">
                  {topErrors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                        <span className="text-[#1A202C]">{error.type}</span>
                      </div>
                      <Badge className="bg-[#FEF3C7] text-[#F59E0B]">
                        {error.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md bg-[#FFFBEB] border border-[#FDE68A] p-3">
                  <p className="text-sm text-[#92400E]">Aun no tienes errores registrados. Completa una leccion para ver tu analisis.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Next Lessons */}
          <div>
            <h3 className="text-xl text-[#1A202C] mb-4">Próximas lecciones</h3>
            <div className="space-y-3">
              {nextLessons.length > 0 ? (
                nextLessons.map((lesson, index) => (
                  <LessonCard
                    key={index}
                    title={lesson.title}
                    description={lesson.description}
                    duration={lesson.duration}
                    onClick={() => setPreviewLesson(lesson)}
                  />
                ))
              ) : (
                <Card className="p-4">
                  <p className="text-sm text-[#6B7280]">Selecciona un objetivo para ver tus próximas lecciones.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={!!previewLesson} onOpenChange={(open) => !open && setPreviewLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewLesson?.title}</DialogTitle>
            <DialogDescription>{previewLesson?.duration}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-[#4B5563]">{previewLesson?.summary}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
