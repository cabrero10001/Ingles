import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Mic, MicOff, Send, Volume2 } from 'lucide-react';
import { api } from '../services/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

type Persona = {
  key: 'BARISTA' | 'RECRUITER' | 'FOREIGN_FRIEND';
  title: string;
  description: string;
};

type SessionMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
};

export function AIConversation() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona['key'] | null>(null);
  const [mode, setMode] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackHints, setFeedbackHints] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!Ctor && window.isSecureContext);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const out = await api.get<{ personas: Persona[] }>('/ai-conversations/personas');
        if (cancelled) return;
        setPersonas(out.personas);
        setSelectedPersona(out.personas[0]?.key ?? null);
      } catch {
        // silent fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canStart = !!selectedPersona && !sessionId;

  const startSession = async () => {
    if (!selectedPersona) return;
    setLoading(true);
    try {
      const out = await api.post<{
        session: { id: string; messages: SessionMessage[] };
      }>('/ai-conversations/start', { persona: selectedPersona, mode });
      setSessionId(out.session.id);
      setMessages(out.session.messages);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (mode !== 'VOICE' || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = async () => {
    if (!sessionId || !input.trim()) return;
    const content = input.trim();
    setInput('');
    setLoading(true);
    try {
      const out = await api.post<{
        userMessage: SessionMessage;
        assistantMessage: SessionMessage;
        feedback: { totalDetected: number; frequentHints: string[] };
      }>(`/ai-conversations/${sessionId}/message`, { message: content });

      setMessages((prev) => [...prev, out.userMessage, out.assistantMessage]);
      setFeedbackHints(out.feedback.frequentHints);
      speak(out.assistantMessage.content);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor || !window.isSecureContext) {
      toast.error('Tu navegador no soporta reconocimiento de voz en esta pagina.');
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new Ctor();
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? '';
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onerror = (event: { error?: string }) => {
        setListening(false);
        if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
          toast.error('Permiso de microfono bloqueado. Habilitalo en el navegador para usar modo voz.');
          return;
        }
        if (event?.error === 'no-speech') {
          toast.error('No se detecto voz. Intenta hablar mas cerca del microfono.');
          return;
        }
        toast.error('No se pudo iniciar el reconocimiento de voz.');
      };
    }
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      setListening(false);
      toast.error('No se pudo iniciar el microfono en este momento.');
    }
  };

  const stopVoiceInput = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
  };

  const personaLabel = useMemo(() => personas.find((p) => p.key === selectedPersona)?.title ?? 'Personaje', [personas, selectedPersona]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB]/5 via-[#10B981]/5 to-[#F59E0B]/5">
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <Badge className="bg-[#DBEAFE] text-[#2563EB]">Conversación IA</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-1">
          <h2 className="text-lg text-[#1A202C] mb-3">Configurar contexto</h2>
          <div className="space-y-2 mb-4">
            {personas.map((p) => (
              <button
                key={p.key}
                type="button"
                disabled={!!sessionId}
                onClick={() => setSelectedPersona(p.key)}
                className={`w-full text-left p-3 rounded-lg border ${selectedPersona === p.key ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E5E7EB] bg-white'}`}
              >
                <p className="font-medium text-[#1A202C]">{p.title}</p>
                <p className="text-xs text-[#6B7280] mt-1">{p.description}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Button variant={mode === 'TEXT' ? 'default' : 'outline'} size="sm" onClick={() => setMode('TEXT')} disabled={!!sessionId}>Texto</Button>
            <Button variant={mode === 'VOICE' ? 'default' : 'outline'} size="sm" onClick={() => setMode('VOICE')} disabled={!!sessionId}>Voz</Button>
          </div>

          <Button onClick={startSession} disabled={!canStart || loading} className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white">
            {loading ? 'Iniciando...' : 'Iniciar conversación'}
          </Button>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-[#1A202C]">Chat con {personaLabel}</h2>
            <Badge className={mode === 'VOICE' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#F3F4F6] text-[#374151]'}>
              {mode === 'VOICE' ? 'Modo voz' : 'Modo texto'}
            </Badge>
          </div>

          <div className="h-[360px] overflow-y-auto border border-[#E5E7EB] rounded-lg p-3 bg-[#F9FAFB] mb-4 space-y-2">
            {messages.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Inicia una sesión para comenzar la práctica.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'USER' ? 'ml-auto bg-[#DBEAFE] text-[#1E3A8A]' : 'mr-auto bg-white border border-[#E5E7EB] text-[#1A202C]'}`}>
                  {m.content}
                </div>
              ))
            )}
          </div>

          {feedbackHints.length > 0 && (
            <div className="mb-3 rounded-md bg-[#FFFBEB] border border-[#FDE68A] p-3">
              <p className="text-xs text-[#92400E] mb-1">Feedback inmediato</p>
              <ul className="text-sm text-[#92400E] list-disc list-inside">
                {feedbackHints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'VOICE' ? 'Habla o escribe tu mensaje...' : 'Escribe tu mensaje...'}
              disabled={!sessionId || loading}
            />

            {mode === 'VOICE' && (
              <Button variant="outline" onClick={listening ? stopVoiceInput : startVoiceInput} disabled={!sessionId || !voiceSupported}>
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}

            <Button onClick={sendMessage} disabled={!sessionId || !input.trim() || loading} className="bg-[#2563EB] hover:bg-[#1E40AF] text-white">
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {mode === 'VOICE' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#6B7280]">
              <Volume2 className="w-4 h-4" />
              {voiceSupported
                ? 'La respuesta del personaje se lee en voz alta automaticamente.'
                : 'Tu navegador no soporta modo voz aqui. Usa modo texto o habilita permisos/micrófono.'}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
