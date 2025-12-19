import ExerciseCard from "./ExerciseCard";
import type { DayColumn } from "../types/schedule";

const columnVariants: Record<"default" | "muted", string> = {
  default: "bg-surface-900/40 border border-border",
  muted: "bg-surface-900/20 border border-border/50",
};

function DayColumnCard({ day }: { day: DayColumn }) {
  if (day.rest) {
    return (
      <div
        className={`w-85 flex flex-col h-full rounded-2xl ${
          columnVariants[day.variant ?? "default"]
        } backdrop-blur-sm overflow-hidden group/col`}
      >
        <div className="p-4 border-b border-border bg-surface-800/30 flex justify-between items-center sticky top-0">
          <div>
            <h3 className="text-muted font-bold text-lg">{day.name}</h3>
            <p className="text-muted/60 text-xs font-medium uppercase tracking-wider mt-0.5">
              {day.meta}
            </p>
          </div>
          <span className="material-symbols-outlined text-muted">bedtime</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar items-center justify-center">
          <div className="text-center p-6 flex flex-col items-center gap-3 opacity-60">
            <div className="size-16 rounded-full bg-surface-800 flex items-center justify-center text-muted">
              <span className="material-symbols-outlined text-[32px]">spa</span>
            </div>
            <h4 className="text-white font-bold">Día de Descanso</h4>
            <p className="text-sm text-muted">
              Tómalo con calma. Enfócate en estirar o cardio suave.
            </p>
            <button className="mt-2 px-4 py-2 rounded-lg bg-surface-800 text-muted hover:text-white hover:bg-border text-xs font-bold uppercase tracking-wide transition-colors">
              Registrar Cardio
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (day.summary) {
    return (
      <div
        className={`w-85 flex flex-col h-full rounded-2xl ${
          columnVariants[day.variant ?? "default"]
        } backdrop-blur-sm overflow-hidden group/col opacity-60 hover:opacity-100 transition-opacity`}
      >
        <div className="p-4 border-b border-border bg-surface-800/50 flex justify-between items-center sticky top-0">
          <div>
            <h3 className="text-white font-bold text-lg">{day.name}</h3>
            <p className="text-muted text-xs font-medium uppercase tracking-wider mt-0.5">
              {day.meta}
            </p>
          </div>
          <button
            className="text-muted hover:text-primary transition-colors"
            aria-label={`Opciones de ${day.name}`}
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
        <div className="flex-1 p-3 flex flex-col items-center justify-center">
          <button className="px-6 py-3 rounded-full bg-border text-white font-bold text-sm shadow-lg hover:bg-primary hover:text-contrast transition-all">
            Ver Rutina
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-85 flex flex-col h-full rounded-2xl ${
        columnVariants[day.variant ?? "default"]
      } backdrop-blur-sm overflow-hidden group/col`}
    >
      <div className="p-4 border-b border-border bg-surface-800/50 flex justify_between items-center sticky top-0">
        <div>
          <h3 className="text-white font-bold text-lg">{day.name}</h3>
          <p className="text-muted text-xs font-medium uppercase tracking-wider mt-0.5">
            {day.meta}
          </p>
        </div>
        <button
          className="text-muted hover:text-primary transition-colors"
          aria-label={`Opciones de ${day.name}`}
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
        {day.exercises?.map((exercise) => (
          <ExerciseCard key={exercise.title} exercise={exercise} />
        ))}

        <button className="w-full py-3 rounded-xl border border-dashed border-border text-muted hover:text-white hover:border-primary/50 hover:bg-surface-800 transition-all flex items-center justify-center gap-2 text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Añadir Ejercicio
        </button>
      </div>
    </div>
  );
}

export default DayColumnCard;
