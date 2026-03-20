import ExerciseCard from "./ExerciseCard";
import type { RoutineDay } from "@/features/routine/types";

type DayColumnCardProps = RoutineDay & {
  onRegenerateDay?: (day: string) => void;
  isRegeneratingDay?: boolean;
  onChangeExercise?: (day: string, exerciseToChange: string) => void;
  changingExerciseRef?: string | null;
};

function DayColumnCard({
  day,
  exercises,
  onRegenerateDay,
  isRegeneratingDay = false,
  onChangeExercise,
  changingExerciseRef = null,
}: DayColumnCardProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl backdrop-blur-sm overflow-hidden group/col transition-all duration-300 shadow-(--shadow-primary-20-soft)">
      <div className="shrink-0 p-4 border-b border-border bg-surface-800/50 flex justify-between items-center text-left">
        <h3 className="text-white font-bold text-lg">{day}</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRegenerateDay?.(day)}
            disabled={!onRegenerateDay || isRegeneratingDay}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-900/70 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/50 hover:text-primary transition-colors"
            aria-busy={isRegeneratingDay}
          >
            <span
              className={`material-symbols-outlined text-sm leading-none ${
                isRegeneratingDay ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            >
              autorenew
            </span>
            {isRegeneratingDay ? "Regenerando..." : "Cambiar rutina del dia"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-3 pr-2 flex flex-col gap-3">
          {exercises.map((exercise, index) => {
            const exerciseRef = String(index + 1);

            return (
              <ExerciseCard
                key={`${exercise.exerciseId}-${exercise.name}-${index}`}
                exercise={exercise}
                onChangeExercise={
                  onChangeExercise
                    ? () => onChangeExercise(day, exerciseRef)
                    : undefined
                }
                isChangingExercise={changingExerciseRef === exerciseRef}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DayColumnCard;
