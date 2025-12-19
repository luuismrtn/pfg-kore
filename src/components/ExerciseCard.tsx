import type { Exercise } from "../types/schedule";

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl bg-surface-800 border border-border p-3 hover:border-primary/50 hover:shadow-[var(--shadow-primary-20-soft)] hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity"
          style={{ backgroundImage: `url(${exercise.image})` }}
          role="img"
          aria-label={exercise.alt}
        />
        {exercise.tag ? (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
            {exercise.tag}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <h4 className="text-white font-bold leading-tight">
            {exercise.title}
          </h4>
          <button
            className="text-muted hover:text-white"
            aria-label="Opciones de ejercicio"
          >
            <span className="material-symbols-outlined text-[18px]">
              more_vert
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {exercise.badges.map((badge) => (
            <span
              key={`${exercise.title}-${badge.label}`}
              className={badge.className}
            >
              {badge.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 p-2 rounded-lg bg-surface-900 border border-border">
          {exercise.stats.map((stat) => (
            <div
              className="flex flex-col"
              key={`${exercise.title}-${stat.label}`}
            >
              <span className="text-muted text-[10px]">{stat.label}</span>
              <span className="text-white font-mono text-sm font-bold">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-contrast transition-all opacity-0 group-hover:opacity-100"
        aria-label={`Iniciar ${exercise.title}`}
      >
        <span className="material-symbols-outlined text-[16px] icon-filled">
          play_arrow
        </span>
        Iniciar
      </button>
    </div>
  );
}

export default ExerciseCard;
