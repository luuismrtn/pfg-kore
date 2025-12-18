import ExerciseCard from "./ExerciseCard";
import type { DayColumn } from "../types/schedule";

const columnVariants: Record<"default" | "muted", string> = {
  default: "bg-[#111814]/40 border border-[#28392f]",
  muted: "bg-[#111814]/20 border border-[#28392f]/50",
};

function DayColumnCard({ day }: { day: DayColumn }) {
  if (day.rest) {
    return (
      <div
        className={`w-85 flex flex-col h-full rounded-2xl ${
          columnVariants[day.variant ?? "default"]
        } backdrop-blur-sm overflow-hidden group/col`}
      >
        <div className="p-4 border-b border-[#28392f] bg-[#1c2720]/30 flex justify-between items-center sticky top-0">
          <div>
            <h3 className="text-[#9db9a8] font-bold text-lg">{day.name}</h3>
            <p className="text-[#9db9a8]/60 text-xs font-medium uppercase tracking-wider mt-0.5">
              {day.meta}
            </p>
          </div>
          <span className="material-symbols-outlined text-[#9db9a8]">
            bedtime
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar items-center justify-center">
          <div className="text-center p-6 flex flex-col items-center gap-3 opacity-60">
            <div className="size-16 rounded-full bg-[#1c2720] flex items-center justify-center text-[#9db9a8]">
              <span className="material-symbols-outlined text-[32px]">spa</span>
            </div>
            <h4 className="text-white font-bold">Día de Descanso</h4>
            <p className="text-sm text-[#9db9a8]">
              Tómalo con calma. Enfócate en estirar o cardio suave.
            </p>
            <button className="mt-2 px-4 py-2 rounded-lg bg-[#1c2720] text-[#9db9a8] hover:text-white hover:bg-[#28392f] text-xs font-bold uppercase tracking-wide transition-colors">
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
        <div className="p-4 border-b border-[#28392f] bg-[#1c2720]/50 flex justify-between items-center sticky top-0">
          <div>
            <h3 className="text-white font-bold text-lg">{day.name}</h3>
            <p className="text-[#9db9a8] text-xs font-medium uppercase tracking-wider mt-0.5">
              {day.meta}
            </p>
          </div>
          <button
            className="text-[#9db9a8] hover:text-primary transition-colors"
            aria-label={`Opciones de ${day.name}`}
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
        <div className="flex-1 p-3 flex flex-col items-center justify-center">
          <button className="px-6 py-3 rounded-full bg-[#28392f] text-white font-bold text-sm shadow-lg hover:bg-[#2bee79] hover:text-[#111814] transition-all">
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
      <div className="p-4 border-b border-[#28392f] bg-[#1c2720]/50 flex justify-between items-center sticky top-0">
        <div>
          <h3 className="text-white font-bold text-lg">{day.name}</h3>
          <p className="text-[#9db9a8] text-xs font-medium uppercase tracking-wider mt-0.5">
            {day.meta}
          </p>
        </div>
        <button
          className="text-[#9db9a8] hover:text-primary transition-colors"
          aria-label={`Opciones de ${day.name}`}
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
        {day.exercises?.map((exercise) => (
          <ExerciseCard key={exercise.title} exercise={exercise} />
        ))}

        <button className="w-full py-3 rounded-xl border border-dashed border-[#28392f] text-[#9db9a8] hover:text-white hover:border-[#2bee79]/50 hover:bg-[#1c2720] transition-all flex items-center justify-center gap-2 text-sm font-medium">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Añadir Ejercicio
        </button>
      </div>
    </div>
  );
}

export default DayColumnCard;
