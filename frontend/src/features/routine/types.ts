export type RoutineExercise = {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  intensity: number;
  note?: string;
  badges?: string[];
};

export type RoutineDay = {
  day: string;
  exercises: RoutineExercise[];
};

export type RoutineResponse = {
  routine: RoutineDay[];
};
