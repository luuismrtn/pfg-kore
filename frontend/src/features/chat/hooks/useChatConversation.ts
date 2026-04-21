import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChatMessage } from "@/features/chat/types";
import type { RoutineResponse } from "@/features/routine/types";
import type { ChatContextMessage } from "@/services/api/routines/types";
import {
  addRoutineDay,
  changeRoutineDay,
  changeRoutineExercise,
  generateRoutine,
  interpretChatIntent,
} from "@/services/api/routines";
import {
  notifyOperationError,
  notifyRoutineDayAdded,
  notifyRoutineDayGenerated,
  notifyRoutineExerciseChanged,
  notifyRoutineGenerated,
} from "@/services/notifications/appNotifications";

const seedMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Hola, soy tu coach virtual. Aquí podrás escribirme lo que necesites y te ayudaré para que logres tener tu rutina perfecta.",
};

export const MAX_USER_CHARS = 1000;
export const MAX_CHAT_MEMORY_MESSAGES = 20;
const CHAT_STORAGE_KEY = "pfg-kore:chat:messages";
const ROUTINE_STORAGE_KEY = "pfg-kore:chat:routine";
const CHAT_PENDING_STORAGE_KEY = "pfg-kore:chat:pending";
const CHAT_SYNC_EVENT = "pfg-kore:chat:sync";

function trimMessagesToLimit(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_CHAT_MEMORY_MESSAGES) {
    return messages;
  }

  const hasSeed = messages.some((message) => message.id === seedMessage.id);

  if (!hasSeed) {
    return messages.slice(-MAX_CHAT_MEMORY_MESSAGES);
  }

  const nonSeedMessages = messages.filter(
    (message) => message.id !== seedMessage.id,
  );

  return [
    seedMessage,
    ...nonSeedMessages.slice(-(MAX_CHAT_MEMORY_MESSAGES - 1)),
  ];
}

function buildChatHistory(messages: ChatMessage[]): ChatContextMessage[] {
  return trimMessagesToLimit(messages).map(({ role, content }) => ({
    role,
    content,
  }));
}

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
        return trimMessagesToLimit(validMessages);
      }
    }
  } catch {}

  return [seedMessage];
}

function appendStoredMessage(message: ChatMessage): void {
  const messages = readStoredMessages();
  const alreadyExists = messages.some((stored) => stored.id === message.id);

  if (alreadyExists) {
    return;
  }

  const nextMessages = trimMessagesToLimit([...messages, message]);
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(nextMessages));
}

function readStoredPendingRequest(): boolean {
  return localStorage.getItem(CHAT_PENDING_STORAGE_KEY) === "1";
}

function emitChatSync(sourceId?: string): void {
  window.dispatchEvent(
    new CustomEvent(CHAT_SYNC_EVENT, {
      detail: { sourceId },
    }),
  );
}

function setStoredPendingRequest(isPending: boolean, sourceId?: string): void {
  if (isPending) {
    localStorage.setItem(CHAT_PENDING_STORAGE_KEY, "1");
  } else {
    localStorage.removeItem(CHAT_PENDING_STORAGE_KEY);
  }

  emitChatSync(sourceId);
}

export function useChatConversation() {
  const instanceIdRef = useRef(crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>(readStoredMessages);
  const [draft, setDraft] = useState("");
  const [isResponding, setIsResponding] = useState(() =>
    readStoredPendingRequest(),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const boundedMessages = trimMessagesToLimit(messages);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(boundedMessages));

    if (boundedMessages.length !== messages.length) {
      setMessages(boundedMessages);
    }
  }, [messages]);

  useEffect(() => {
    const syncFromStorage = () => {
      setMessages(readStoredMessages());
      setIsResponding(readStoredPendingRequest());
    };

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key !== CHAT_STORAGE_KEY &&
        event.key !== CHAT_PENDING_STORAGE_KEY
      ) {
        return;
      }

      syncFromStorage();
    };

    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ sourceId?: string }>;
      if (customEvent.detail?.sourceId === instanceIdRef.current) {
        return;
      }

      syncFromStorage();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CHAT_SYNC_EVENT, handleSync as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CHAT_SYNC_EVENT, handleSync as EventListener);
    };
  }, []);

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

    appendStoredMessage(userMessage);
    setMessages((prev) => trimMessagesToLimit([...prev, userMessage]));
    setDraft("");
    setStoredPendingRequest(true, instanceIdRef.current);
    setIsResponding(true);

    try {
      const currentRoutine = readStoredRoutine();
      const chatHistory = buildChatHistory([...messages, userMessage]);
      const intent = await interpretChatIntent(
        text,
        currentRoutine ?? undefined,
        chatHistory,
      );

      let routine: RoutineResponse | null = null;
      let assistantReply = intent.responseText;
      let notifySuccess: (() => void) | null = null;

      if (intent.action === "create_routine") {
        routine = await generateRoutine(text);
        notifySuccess = () => notifyRoutineGenerated();
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
        notifySuccess = () => notifyRoutineDayGenerated(intent.dayToChange!);
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
        notifySuccess = () => notifyRoutineExerciseChanged(intent.dayToChange!);
        assistantReply =
          "He cambiado el ejercicio que me pediste. Revisa el panel para ver la actualización.";
      } else if (intent.action === "add_day") {
        if (!currentRoutine) {
          throw new Error(
            "No hay una rutina cargada para añadir un día. Pídeme primero crear una rutina.",
          );
        }

        routine = await addRoutineDay(currentRoutine, text);
        notifySuccess = () => notifyRoutineDayAdded();
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

        notifySuccess?.();
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantReply,
      };

      if (requestVersionRef.current === requestVersion) {
        appendStoredMessage(assistantMessage);
        setMessages((prev) => trimMessagesToLimit([...prev, assistantMessage]));
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
        appendStoredMessage(assistantMessage);
        setMessages((prev) => trimMessagesToLimit([...prev, assistantMessage]));
        notifyOperationError(
          error,
          "No se pudo procesar tu solicitud con la IA.",
          "No se pudo completar la solicitud",
        );
      }
    } finally {
      if (requestVersionRef.current === requestVersion) {
        setStoredPendingRequest(false, instanceIdRef.current);
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
    setStoredPendingRequest(false, instanceIdRef.current);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return {
    messages,
    draft,
    setDraft,
    isResponding,
    scrollRef,
    sendMessage,
    clearConversation,
    handleKeyDown,
  };
}
