import ExerciseCard from "./ExerciseCard";
import type { DayColumn } from "../../types/schedule";

const columnVariants: Record<"default" | "muted", string> = {
  default: "bg-surface-900/40 border border-border",
  muted: "bg-surface-900/20 border border-border/50",
};

type DayColumnCardProps = {
  day: DayColumn;
};

function DayColumnCard({ day }: DayColumnCardProps) {
  if (day.rest) {
    return (
      <div
        className={`flex flex-col rounded-2xl ${
          columnVariants[day.variant ?? "default"]
        } backdrop-blur-sm overflow-hidden group/col transition-all duration-300 shadow-(--shadow-primary-20-soft)`}
      >
        <button className="p-4 border-b border-border bg-surface-800/30 flex justify-between items-center text-left">
          <div>
            <h3 className="text-muted font-bold text-lg">{day.name}</h3>
            <p className="text-muted/60 text-xs font-medium uppercase tracking-wider mt-0.5">
              {day.meta}
            </p>
          </div>
          <span className="material-symbols-outlined text-muted">bedtime</span>
        </button>
        <div className="transition-all duration-300 max-h-none opacity-100">
          <div className="p-3 flex flex-col gap-3 items-center justify-center">
            <div className="text-center p-6 flex flex-col items-center gap-3 opacity-60">
              <div className="size-16 rounded-full bg-surface-800 flex items-center justify-center text-muted">
                <span className="material-symbols-outlined text-[32px]">
                  spa
                </span>
              </div>
              <h4 className="text-white font-bold">Día de Descanso</h4>
              <p className="text-sm text-muted">
                Tómalo con calma. Enfócate en estirar o cardio suave.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!day.exercises || day.exercises.length === 0) {
    return (
      <div
        className={`flex flex-col rounded-2xl ${
          columnVariants[day.variant ?? "default"]
        } backdrop-blur-sm overflow-hidden group/col transition-all duration-300 shadow-(--shadow-primary-20-soft)`}
      >
        <button className="p-4 border-b border-border bg-surface-800/50 flex justify-between items-center text-left">
          <div>
            <h3 className="text-white font-bold text-lg">{day.name}</h3>
            <p className="text-muted text-xs font-medium uppercase tracking-wider mt-0.5">
              {day.meta}
            </p>
          </div>
          <span className="material-symbols-outlined text-muted">
            water_bottle_large
          </span>
        </button>

        <div className="transition-all duration-300 max-h-none opacity-100">
          <div className="p-4 flex flex-col items-center justify-center gap-3 text-center">
            <div className="size-12 rounded-full bg-surface-800 flex items-center justify-center text-muted">
              <span className="material-symbols-outlined text-[24px]">
                exercise
              </span>
            </div>
            <div>
              <h4 className="text-white font-bold">Sin ejercicios</h4>
              <p className="text-sm text-muted">
                Añade tu primera rutina para este día.
              </p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-surface-800 cursor-pointer text-muted hover:text-white hover:bg-border text-xs font-bold uppercase tracking-wide transition-colors">
              Añadir Ejercicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col rounded-2xl ${
        columnVariants[day.variant ?? "default"]
      } backdrop-blur-sm overflow-hidden group/col transition-all duration-300 shadow-(--shadow-primary-20-soft)`}
    >
      <button className="p-4 border-b border-border bg-surface-800/50 flex justify-between items-center text-left">
        <div>
          <h3 className="text-white font-bold text-lg">{day.name}</h3>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mt-0.5">
            {day.meta}
          </p>
        </div>
        <span className="material-symbols-outlined text-muted">
          fitness_center
        </span>
      </button>

      <div className="transition-all duration-300 max-h-none opacity-100">
        <div className="p-3 flex flex-col gap-3">
          {day.exercises?.map((exercise) => (
            <ExerciseCard key={exercise.title} exercise={exercise} />
          ))}

          <button className="w-full py-3 rounded-xl border border-dashed cursor-pointer border-border text-muted hover:text-white hover:border-primary/50 hover:bg-surface-800 transition-all flex items-center justify-center gap-2 text-sm font-medium">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Añadir Ejercicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default DayColumnCard;
