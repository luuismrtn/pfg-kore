import ExerciseCard from "./ExerciseCard";
import type { DiaRutina } from "@/types/chat";

function DayColumnCard({ dia, ejercicios }: DiaRutina) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl backdrop-blur-sm overflow-hidden group/col transition-all duration-300 shadow-(--shadow-primary-20-soft)">
      <div className="shrink-0 p-4 border-b border-border bg-surface-800/50 flex justify-between items-center text-left">
        <div>
          <h3 className="text-white font-bold text-lg">{dia}</h3>
        </div>
        <span className="material-symbols-outlined text-muted">
          fitness_center
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-3 pr-2 flex flex-col gap-3">
          {ejercicios.map((exercise) => (
            <ExerciseCard key={exercise.nombre} exercise={exercise} />
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
