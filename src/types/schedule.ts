export type Badge = {
  label: string;
  className: string;
};

export type Stat = {
  label: string;
  value: string;
};

export type Exercise = {
  title: string;
  badges: Badge[];
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
