import type { RoutineExercise } from "@/features/routine/types";

const badgeClassByLabel: Record<string, string> = {
  Pecho: "bg-primary/10 text-primary border border-primary/20",
  Hombros: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  Bíceps: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  Cuádriceps: "bg-green-500/10 text-green-400 border border-green-500/20",
  Glúteos: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  Espalda: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  Piernas: "bg-red-500/10 text-red-400 border border-red-500/20",
  Compuesto: "bg-border text-muted",
  Pesado: "bg-border text-muted",
  Lumbares: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  Isquiotibiales: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  Antebrazos: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  Core: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  Trapecios: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  Cuello: "bg-yellow-700/10 text-yellow-700 border border-yellow-700/20",
  Braquial: "bg-green-700/10 text-green-700 border border-green-700/20",
  Resistencia: "bg-blue-700/10 text-blue-700 border border-blue-700/20",
  "Espalda Baja": "bg-red-700/10 text-red-700 border border-red-700/20",
  Aislamiento: "bg-purple-700/10 text-purple-700 border border-purple-700/20",
  Estabilidad: "bg-indigo-700/10 text-indigo-700 border border-indigo-700/20",
  Flexores: "bg-pink-700/10 text-pink-700 border border-pink-700/20",
};

const getBadgeClassName = (label: string) => {
  const labelClass = badgeClassByLabel[label] ?? "bg-border text-muted";
  return `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${labelClass}`;
};

function ExerciseCard({ exercise }: { exercise: RoutineExercise }) {
  return (
    <article className="relative flex flex-col gap-3 rounded-xl bg-surface-800/90 border border-border p-4 shadow-(--shadow-primary-20-soft) transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-white font-bold leading-tight text-[15px]">
            {exercise.name}
          </h4>
        </div>
      </div>

      {exercise.badges && exercise.badges.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {exercise.badges.map((badge) => (
            <span
              key={`${exercise.name}-${badge}`}
              className={getBadgeClassName(badge)}
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface-900/70 px-2 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Series
          </p>
          <p className="text-sm font-bold text-white">{exercise.sets}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-900/70 px-2 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted">Reps</p>
          <p className="text-sm font-bold text-white">{exercise.reps}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-900/70 px-2 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Descanso
          </p>
          <p className="text-sm font-bold text-white">
            {exercise.restSeconds}s
          </p>
        </div>
      </div>

      {exercise.note ? (
        <div className="rounded-lg border border-border bg-surface-900/70 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted mb-1">
            Nota
          </p>
          <p className="text-sm text-white/90 leading-relaxed">
            {exercise.note}
          </p>
        </div>
      ) : null}

      {!exercise.badges?.length ? (
        <span className="w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold bg-border text-muted">
          Sin etiquetas
        </span>
      ) : null}
    </article>
  );
}

export default ExerciseCard;
