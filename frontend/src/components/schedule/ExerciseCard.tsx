import type { RoutineExercise } from "@/features/routine/types";
import Skeleton from "@/components/ui/Skeleton";
import { RefreshCw } from "lucide-react";

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
  Pectoral: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  "Empuje Horizontal": "bg-green-500/10 text-green-400 border border-green-500/20",
  "Pectoral Superior": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  Tríceps: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  "Extensión de Codo": "bg-red-500/10 text-red-400 border border-red-500/20",
  "Hombro Posterior": "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  "Tracción Horizontal": "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  Calistenia: "bg-pink-500/10 text-pink-400 border border-pink-500/20",
  "Dominante de Cadera": "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  "Empuje Vertical": "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  "Flexión de Tronco": "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  "Zona Lumbar": "bg-yellow-700/10 text-yellow-700 border border-yellow-700/20",

};

const getBadgeClassName = (label: string) => {
  const labelClass = badgeClassByLabel[label] ?? "bg-border text-muted";
  return `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${labelClass}`;
};

export function ExerciseCardSkeleton() {
  return (
    <article className="relative flex flex-col gap-3 rounded-xl bg-surface-800/90 border border-border p-4 shadow-(--shadow-primary-20-soft)">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-2/3 rounded-full" />
        </div>

        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-16 rounded-lg" />
    </article>
  );
}

type ExerciseCardProps = {
  exercise: RoutineExercise;
  onChangeExercise?: () => void;
  isChangingExercise?: boolean;
};

type ExerciseMetricCardProps = {
  label: string;
  value: string;
  tooltip: string;
};

function ExerciseMetricCard({
  label,
  value,
  tooltip,
}: ExerciseMetricCardProps) {
  return (
    <div
      className="group relative rounded-lg border border-border bg-surface-900/70 px-2 py-2 text-center"
      tabIndex={0}
      aria-label={`${label}: ${value}. ${tooltip}`}
    >
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-44 -translate-x-1/2 rounded-md border border-border bg-surface-900 px-2 py-1 text-xs leading-tight text-muted opacity-0 shadow-(--shadow-primary-15-weak) transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100">
        {tooltip}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-border" />
      </div>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function ExerciseCard({
  exercise,
  onChangeExercise,
  isChangingExercise = false,
}: ExerciseCardProps) {
  if (isChangingExercise) {
    return <ExerciseCardSkeleton />;
  }

  const safeIntensity = Number.isFinite(exercise.intensity)
    ? Math.min(Math.max(Math.round(exercise.intensity), 1), 10)
    : 7;

  return (
    <article className="relative flex flex-col gap-3 rounded-xl bg-surface-800/90 border border-border p-4 shadow-(--shadow-primary-20-soft) transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-white font-bold leading-tight text-[15px]">
            {exercise.name}
          </h4>
        </div>
        <button
          type="button"
          onClick={onChangeExercise}
          disabled={!onChangeExercise || isChangingExercise}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-900/70 px-2 py-1 text-[11px] font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary/50 hover:text-primary transition-colors"
          aria-busy={isChangingExercise}
        >
          <RefreshCw
            className={isChangingExercise ? "animate-spin" : ""}
            size={14}
            strokeWidth={2.5}
            aria-hidden="true"
          />
          {isChangingExercise ? "Cambiando..." : "Cambiar"}
        </button>
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ExerciseMetricCard
          label="Series"
          value={String(exercise.sets)}
          tooltip="Bloques de trabajo total para este ejercicio."
        />
        <ExerciseMetricCard
          label="Reps"
          value={exercise.reps}
          tooltip="Repeticiones por serie. Si pone FALLO, realiza las máximas posibles con buena técnica."
        />
        <ExerciseMetricCard
          label="Descanso"
          value={`${exercise.restSeconds}s`}
          tooltip="Tiempo de descanso entre series antes de empezar la siguiente."
        />
        <ExerciseMetricCard
          label="Intensidad"
          value={`${safeIntensity}/10`}
          tooltip="Escala de esfuerzo del 1 al 10: 10 es ir al fallo y 1 es esfuerzo muy suave."
        />
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
