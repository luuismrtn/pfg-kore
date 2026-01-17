import type { Exercise } from "../types/schedule";

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="relative flex flex-col gap-3 rounded-xl bg-surface-800 border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-bold leading-tight">
              {exercise.title}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {exercise.badges.map((badge) => (
              <span
                key={`${exercise.title}-${badge.label}`}
                className={badge.className}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <button className="text-muted" aria-label="Opciones de ejercicio">
          <span className="material-symbols-outlined text-[18px]">
            more_vert
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-900 border border-border px-3 py-2">
        {exercise.stats.map((stat) => (
          <div
            className="flex flex-col gap-1"
            key={`${exercise.title}-${stat.label}`}
          >
            <span className="text-muted text-[11px] uppercase tracking-wider">
              {stat.label}
            </span>
            <span className="text-white text-lg font-bold">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExerciseCard;
