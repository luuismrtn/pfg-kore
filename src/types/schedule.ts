
export type Stat = {
  label: string;
  value: string;
};

export type Exercise = {
  title: string;
  badges: string[];
  stats: Stat[];
};

export type DayColumn = {
  name: string;
  meta: string;
  variant?: "default" | "muted";
  exercises?: Exercise[];
  rest?: boolean;
  summary?: boolean;
};
