import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import HeaderBar from "@/components/layout/HeaderBar";
import { generateRutina } from "@/services/api/rutinasApi";
import type { ChatMessage, PerfilUsuario, RutinaResponse } from "@/types/chat";

const seedMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Hola, soy tu coach virtual. Aquí podrás escribirme lo que necesites y te ayudaré para que logres tener tu rutina perfecta.",
};

const MAX_USER_CHARS = 1000;

function toPerfilUsuario(text: string): PerfilUsuario {
  try {
    const parsed = JSON.parse(text) as Partial<PerfilUsuario>;
    if (
      typeof parsed.objetivo === "string" &&
      typeof parsed.nivel === "string"
    ) {
      return {
        objetivo: parsed.objetivo,
        nivel: parsed.nivel,
        lesiones: Array.isArray(parsed.lesiones) ? parsed.lesiones : [],
        equipamiento:
          Array.isArray(parsed.equipamiento) && parsed.equipamiento.length > 0
            ? parsed.equipamiento
            : ["Peso Corporal"],
        dias_semana:
          typeof parsed.dias_semana === "number" && parsed.dias_semana > 0
            ? Math.min(parsed.dias_semana, 7)
            : 3,
      };
    }
  } catch {
    // Si no es JSON, se usará el mensaje como objetivo libre.
  }

  return {
    objetivo: text,
    nivel: "intermedio",
    lesiones: [],
    equipamiento: ["Peso Corporal"],
    dias_semana: 3,
  };
}

function formatRutina(rutina: RutinaResponse): string {
  if (!Array.isArray(rutina.rutina) || rutina.rutina.length === 0) {
    return "La IA respondió sin una rutina válida.";
  }

  return rutina.rutina
    .map((dia, dayIndex) => {
      const ejercicios = dia.ejercicios
        .map((ej, exerciseIndex) => {
          const nota = ej.nota ? ` | Nota: ${ej.nota}` : "";
          return `${dayIndex + 1}.${exerciseIndex + 1} ${ej.nombre} (${ej.series}x${ej.repeticiones}, descanso ${ej.descanso_segundos}s)${nota}`;
        })
        .join("\n");

      return `${dia.dia}\n${ejercicios}`;
    })
    .join("\n\n");
}

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([seedMessage]);
  const [draft, setDraft] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!draft.trim() || isResponding) {
      return;
    }

    let text = draft.trim();

    if (text.length > MAX_USER_CHARS) {
      text = text.slice(0, MAX_USER_CHARS);
    }
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setIsResponding(true);

    try {
      const rutina = await generateRutina(text);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: formatRutina(rutina),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? `Error al conectar con el backend: ${error.message}`
            : "Error al conectar con el backend.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsResponding(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <HeaderBar title="Chat IA" />

      <div className="relative flex-1 px-8 pb-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-6 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute left-10 bottom-6 h-64 w-64 rounded-full bg-border/10 blur-3xl" />
        </div>

        <div className="relative flex h-full flex-col gap-4 pt-4">
          <div
            ref={scrollRef}
            className="flex-1 rounded-2xl border border-border/80 bg-surface-900/70 backdrop-blur-xl shadow-(--shadow-primary-15-weak) p-6 overflow-y-auto custom-scrollbar"
          >
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser ? (
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary border border-primary/30">
                        <span className="material-symbols-outlined">
                          smart_toy
                        </span>
                      </div>
                    ) : null}

                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap wrap-break-word ${
                        isUser
                          ? "bg-primary text-contrast shadow-(--shadow-primary-20-strong)"
                          : "bg-surface-800/80 text-white border border-border"
                      }`}
                    >
                      {message.content}
                    </div>

                    {isUser ? (
                      <div className="flex size-10 items-center justify-center rounded-full bg-surface-800 text-white border border-border">
                        <span className="material-symbols-outlined icon-filled">
                          person
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {isResponding ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <div className="size-2 animate-pulse rounded-full bg-primary" />
                  Escribiendo...
                </div>
              ) : null}
            </div>
          </div>

          <form
            onSubmit={sendMessage}
            className="rounded-2xl border border-border bg-surface-900/80 backdrop-blur-xl shadow-(--shadow-primary-20-soft) p-4"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-muted">
                <span className="material-symbols-outlined text-base text-primary">
                  chat
                </span>
                Escribe tu mensaje. Pulsa Enter para enviar o Shift+Enter para
                saltos de linea.
              </div>

              <div className="flex gap-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe tu duda o la parte del plan que quieres ajustar"
                  maxLength={MAX_USER_CHARS}
                  className="min-h-24 flex-1 resize-none rounded-xl bg-surface-800/80 px-4 py-3 text-sm text-white border border-border focus:outline-none focus:ring-2 focus:ring-primary/60 custom-scrollbar"
                />

                <button
                  type="submit"
                  disabled={!draft.trim() || isResponding}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-contrast font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-(--shadow-primary-20-strong) hover:-translate-y-px transition-transform"
                  aria-label="Enviar mensaje"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>

              <div className="flex justify-end text-[11px] text-muted px-1">
                {draft.length}/{MAX_USER_CHARS} caracteres
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
