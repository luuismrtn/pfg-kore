import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ChatMessage } from "@/features/chat/types";
import type { RoutineResponse } from "@/features/routine/types";
import {
  addRoutineDay,
  changeRoutineDay,
  changeRoutineExercise,
  generateRoutine,
  interpretChatIntent,
} from "@/services/api/routines";

const seedMessage: ChatMessage = {
  id: "intro",
  role: "assistant",
  content:
    "Hola, soy tu coach virtual. Aquí podrás escribirme lo que necesites y te ayudaré para que logres tener tu rutina perfecta.",
};

export const MAX_USER_CHARS = 1000;
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

export function useChatConversation() {
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
      const intent = await interpretChatIntent(text, currentRoutine ?? undefined);

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

        routine = await changeRoutineDay(currentRoutine, intent.dayToChange, text);
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
          error instanceof Error ? error.message : "No se pudo generar la rutina.",
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