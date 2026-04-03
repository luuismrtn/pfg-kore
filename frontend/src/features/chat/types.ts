export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ChatIntentAction =
  | "create_routine"
  | "change_exercise"
  | "change_day"
  | "add_day"
  | "question";

export type ChatIntentResponse = {
  action: ChatIntentAction;
  responseText: string;
  dayToChange?: string;
  exerciseToChange?: string;
};
