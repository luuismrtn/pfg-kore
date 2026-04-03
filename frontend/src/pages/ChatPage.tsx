import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import HeaderBar from "@/components/layout/HeaderBar";
import {
  addRoutineDay,
  changeRoutineDay,
  changeRoutineExercise,
  generateRoutine,
  interpretChatIntent,
} from "@/services/api/routinesApi";
import type { ChatMessage } from "@/features/chat/types";
import type { RoutineResponse } from "@/features/routine/types";
import { Bot, MessageCircle, SendHorizontal, Trash2, User } from "lucide-react";

const seedMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Hola, soy tu coach virtual. Aquí podrás escribirme lo que necesites y te ayudaré para que logres tener tu rutina perfecta.",
};

const MAX_USER_CHARS = 1000;
const CHAT_STORAGE_KEY = "pfg-kore:chat:messages";
const ROUTINE_STORAGE_KEY = "pfg-kore:chat:routine";

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Partial<ChatMessage>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

function isRoutineResponse(value: unknown): value is RoutineResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybeRoutine = value as Partial<RoutineResponse>;
  return Array.isArray(maybeRoutine.routine);
}

function readStoredRoutine(): RoutineResponse | null {
  const raw = localStorage.getItem(ROUTINE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isRoutineResponse(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readStoredMessages(): ChatMessage[] {
  const raw = localStorage.getItem(CHAT_STORAGE_KEY);
  if (!raw) {
    return [seedMessage];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const validMessages = parsed.filter(isChatMessage);
      if (validMessages.length > 0) {
        return validMessages;
      }
    }
  } catch {
    // Fall back to seed data when local storage is corrupted.
  }

  return [seedMessage];
}

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(readStoredMessages);
  const [draft, setDraft] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
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

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setIsResponding(true);

    try {
      const currentRoutine = readStoredRoutine();
      const intent = await interpretChatIntent(
        text,
        currentRoutine ?? undefined,
      );

      let routine: RoutineResponse | null = null;
      let assistantReply = intent.responseText;

      if (intent.action === "create_routine") {
        routine = await generateRoutine(text);
        assistantReply =
          "¡Ya tienes tu rutina personalizada en tu panel! \nSi necesitas que te la ajuste o tienes alguna duda, no dudes en escribirme.";
      } else if (intent.action === "change_day") {
        if (!currentRoutine) {
          throw new Error(
            "No hay una rutina cargada para cambiar un día. Pídeme primero crear una rutina.",
          );
        }

        if (!intent.dayToChange) {
          throw new Error(
            "No he podido identificar qué día quieres cambiar. Indícame el día (por ejemplo, Día 2).",
          );
        }

        routine = await changeRoutineDay(
          currentRoutine,
          intent.dayToChange,
          text,
        );
        assistantReply =
          "He cambiado el día que me pediste. Puedes ver la rutina actualizada en el panel.";
      } else if (intent.action === "change_exercise") {
        if (!currentRoutine) {
          throw new Error(
            "No hay una rutina cargada para cambiar ejercicios. Pídeme primero crear una rutina.",
          );
        }

        if (!intent.dayToChange || !intent.exerciseToChange) {
          throw new Error(
            "No he podido identificar el día o el ejercicio a cambiar. Indícame ambos datos.",
          );
        }

        routine = await changeRoutineExercise(
          currentRoutine,
          intent.dayToChange,
          intent.exerciseToChange,
          text,
        );
        assistantReply =
          "He cambiado el ejercicio que me pediste. Revisa el panel para ver la actualización.";
      } else if (intent.action === "add_day") {
        if (!currentRoutine) {
          throw new Error(
            "No hay una rutina cargada para añadir un día. Pídeme primero crear una rutina.",
          );
        }

        routine = await addRoutineDay(currentRoutine, text);
        assistantReply =
          "He añadido un día más a tu rutina. Ya puedes verlo en tu panel.";
      } else {
        assistantReply =
          intent.responseText ||
          "No he entendido del todo tu duda. ¿Me la puedes reformular?";
      }

      if (requestVersionRef.current === requestVersion) {
        if (routine) {
          localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routine));
        }
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantReply,
      };
      if (requestVersionRef.current === requestVersion) {
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "No se pudo generar la rutina.",
      };
      if (requestVersionRef.current === requestVersion) {
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } finally {
      if (requestVersionRef.current === requestVersion) {
        setIsResponding(false);
      }
    }
  };

  const clearConversation = () => {
    requestVersionRef.current += 1;
    setMessages([seedMessage]);
    setDraft("");
    setIsResponding(false);
    localStorage.removeItem(CHAT_STORAGE_KEY);
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
                        <Bot size={18} strokeWidth={2} aria-hidden="true" />
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
                        <User size={18} strokeWidth={2} aria-hidden="true" />
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
                <MessageCircle
                  className="text-primary"
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
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

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={!draft.trim() || isResponding}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-contrast font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-(--shadow-primary-20-strong) hover:-translate-y-px transition-transform"
                    aria-label="Enviar mensaje"
                  >
                    <SendHorizontal
                      size={18}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={clearConversation}
                    disabled={isResponding}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-800/90 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px transition-transform cursor-pointer"
                    aria-label="Nueva conversacion"
                    title="Nueva conversacion"
                  >
                    <Trash2 size={18} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
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
