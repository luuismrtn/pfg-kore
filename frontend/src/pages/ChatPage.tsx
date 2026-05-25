import {
  useChatConversation,
  MAX_CHAT_MEMORY_MESSAGES,
  MAX_USER_CHARS,
} from "@/features/chat/hooks/useChatConversation";
import HeaderBar from "@/components/layout/HeaderBar";
import ApiKeySetupCard from "@/components/ui/ApiKeySetupCard";
import { hasStoredRoutineWithExercises } from "@/features/routine/utils/storedRoutine";
import { getStoredGoogleApiKey } from "@/services/api/routines";
import { useState } from "react";
import { Bot, MessageCircle, SendHorizontal, Trash2, User } from "lucide-react";

function ChatPage() {
  const [googleApiKey, setGoogleApiKey] = useState(getStoredGoogleApiKey);
  const {
    messages,
    draft,
    setDraft,
    isResponding,
    scrollRef,
    sendMessage,
    clearConversation,
    handleKeyDown,
  } = useChatConversation();

  const hasRoutine = hasStoredRoutineWithExercises();
  const hasChatContent = messages.some((message) => message.id !== "intro");
  const shouldShowApiKeySetup = !googleApiKey && !hasRoutine && !hasChatContent;

  return (
    <div className="flex flex-col h-full">
      <HeaderBar title="Chat IA" />

      <div className={`relative flex-1 px-8 pb-8 ${shouldShowApiKeySetup ? "overflow-y-auto custom-scrollbar" : "overflow-hidden"}`}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-0 top-6 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute left-10 bottom-6 h-64 w-64 rounded-full bg-border/10 blur-3xl" />
        </div>

        {shouldShowApiKeySetup ? (
          <div className="relative flex min-h-full items-center justify-center py-6">
            <ApiKeySetupCard
              title="Configura tu Google API Key"
              description="Aún no tienes una rutina guardada. Introduce tu clave para empezar a usar el chat IA y generar tu primer plan."
              onSaved={(savedApiKey) => setGoogleApiKey(savedApiKey)}
            />
          </div>
        ) : (
          <div className="relative flex h-full flex-col gap-4 pt-4">
            <div
              ref={scrollRef}
              className="flex-1 rounded-2xl border border-border/80 bg-surface-900/70 backdrop-blur-xl p-6 overflow-y-auto custom-scrollbar"
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
                            ? "bg-primary text-black shadow-(--shadow-primary-20-strong)"
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
                    Generando respuesta...
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
                  saltos de linea. Recuerdo los últimos{" "}
                  {MAX_CHAT_MEMORY_MESSAGES} mensajes.
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
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px transition-transform cursor-pointer"
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
        )}
      </div>
    </div>
  );
}

export default ChatPage;
