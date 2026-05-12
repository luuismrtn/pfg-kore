import HeaderBar from "@/components/layout/HeaderBar";
import DayColumnCard from "@/components/schedule/DayColumnCard";
import ApiKeySetupCard from "@/components/ui/ApiKeySetupCard";
import Skeleton from "@/components/ui/Skeleton";
import { usePanelRoutine } from "@/features/routine/hooks/usePanelRoutine";
import {
  exportRoutinePdf,
  getProfile,
  getStoredGoogleApiKey,
} from "@/services/api/routines";
import { notifyOperationError } from "@/services/notifications/appNotifications";
import { CalendarDays, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

function RoutinePanelSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-full">
      <aside className="flex flex-col gap-4 bg-surface-900/60 border border-border rounded-2xl p-5 h-full backdrop-blur-md shadow-(--shadow-primary-20-soft)">
        <Skeleton className="h-4 w-24 rounded-full" />

        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-800/40 px-4 py-3"
            >
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-full" />
              </div>

              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </aside>

      <section className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col rounded-2xl backdrop-blur-sm overflow-hidden shadow-(--shadow-primary-20-soft) border border-border bg-surface-900/60">
          <div className="shrink-0 p-4 border-b border-border bg-surface-800/50 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>

            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="p-3 pr-2 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <article
                  key={index}
                  className="flex flex-col gap-3 rounded-xl bg-surface-800/90 border border-border p-4 shadow-(--shadow-primary-20-soft)"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="h-3 w-1/2 rounded-full" />
                    </div>

                    <Skeleton className="h-7 w-20 rounded-lg" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 3 }).map((_, metricIndex) => (
                      <Skeleton key={metricIndex} className="h-16 rounded-lg" />
                    ))}
                  </div>

                  <Skeleton className="h-16 rounded-lg" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PanelPage() {
  const [googleApiKey, setGoogleApiKey] = useState(getStoredGoogleApiKey);
  const [isDownloading, setIsDownloading] = useState(false);
  const {
    panelSchedule,
    selectedDay,
    setSelectedDay,
    activeDay,
    hasAnyDayWithExercises,
    generateRoutineErrorMessage,
    isGenerateRoutineDisabled,
    isLoading,
    isRegeneratingDay,
    changingExerciseRef,
    changingExerciseDay,
    handleGenerateRoutine,
    handleRegenerateDay,
    handleChangeExercise,
  } = usePanelRoutine();
  const shouldShowApiKeySetup = !googleApiKey && !hasAnyDayWithExercises;

  const handleDownloadRoutine = async () => {
    if (isDownloading || !hasAnyDayWithExercises) {
      return;
    }

    setIsDownloading(true);

    try {
      const profile = getProfile();
      const blob = await exportRoutinePdf({
        routine: { routine: panelSchedule },
        profile: {
          ...profile,
          text: JSON.stringify(profile),
        },
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rutina-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      notifyOperationError(
        error,
        "No se pudo descargar el PDF.",
        "Descarga fallida",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <HeaderBar
        title="Horario Semanal"
        action={
          shouldShowApiKeySetup ? null : (
            <div className="flex items-center gap-2">
              {hasAnyDayWithExercises ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-800/60 px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleDownloadRoutine}
                  disabled={isDownloading}
                  aria-busy={isDownloading}
                >
                  <Download size={18} strokeWidth={2.4} aria-hidden="true" />
                  {isDownloading ? "Descargando..." : "Descargar PDF"}
                </button>
              ) : null}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:text-black text-white"
                onClick={handleGenerateRoutine}
                disabled={isGenerateRoutineDisabled}
                aria-busy={isLoading}
              >
                <RefreshCw
                  className={isLoading ? "animate-spin" : ""}
                  size={20}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                {isLoading ? "Generando..." : "Generar Nueva Rutina"}
              </button>
            </div>
          )
        }
      />

      <div className="flex-1 overflow-hidden p-8">
        {shouldShowApiKeySetup ? (
          <div className="flex h-full items-center justify-center pb-8">
            <ApiKeySetupCard
              title="Configura tu Google API Key"
              description="Aún no hay una rutina en tu panel. Introduce tu clave para poder generar tu primer plan de entrenamiento."
              onSaved={(savedApiKey) => setGoogleApiKey(savedApiKey)}
            />
          </div>
        ) : isLoading ? (
          <RoutinePanelSkeleton />
        ) : !hasAnyDayWithExercises ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
            <div className="size-16 rounded-full bg-surface-800 flex items-center justify-center text-muted">
              <CalendarDays size={32} strokeWidth={2} aria-hidden="true" />
            </div>
            <h2 className="text-white font-bold text-lg">
              No hay rutina generada
            </h2>
            <p className="text-muted text-sm max-w-md">
              Genera tu rutina personalizada en la sección de Chat IA para verla
              aquí
            </p>
            <p className="text-muted text-sm max-w-md">
              o haz click en este botón.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGenerateRoutine}
              disabled={isGenerateRoutineDisabled}
              aria-busy={isLoading}
            >
              <RefreshCw
                className={isLoading ? "animate-spin" : ""}
                size={20}
                strokeWidth={2.5}
                aria-hidden="true"
              />
              {isLoading ? "Generando..." : "Generar Rutina"}
            </button>
            {generateRoutineErrorMessage ? (
              <p className="mb-4 text-sm text-red-300">
                {generateRoutineErrorMessage}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-full">
              <aside className="flex flex-col gap-4 bg-surface-900/60 border border-border rounded-2xl p-5 h-full backdrop-blur-md shadow-(--shadow-primary-20-soft)">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                    Días
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {panelSchedule.map((day) => {
                    const exerciseCount = day.exercises?.length ?? 0;
                    const isActive = day.day === selectedDay;

                    return (
                      <button
                        key={day.day}
                        type="button"
                        onClick={() => setSelectedDay(day.day)}
                        className={`group relative flex items-center justify-between gap-3 cursor-pointer rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                          isActive
                            ? "border-primary/60 bg-primary/10 text-white shadow-(--shadow-primary-20-soft)"
                            : "border-border bg-surface-800/40 text-muted hover:text-white hover:border-primary/40 hover:bg-surface-800/70"
                        }`}
                        aria-pressed={isActive}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {day.day}
                          </span>
                        </div>
                        <span
                          className={`min-w-12 text-center text-xs font-bold px-2 py-1 rounded-full ${
                            isActive
                              ? "bg-primary dark:text-black"
                              : "bg-surface-900 text-muted"
                          }`}
                        >
                          {exerciseCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </aside>
              <section className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
                {activeDay && activeDay.exercises.length > 0 ? (
                  <DayColumnCard
                    day={activeDay.day}
                    exercises={activeDay.exercises}
                    onRegenerateDay={handleRegenerateDay}
                    isRegeneratingDay={isRegeneratingDay}
                    onChangeExercise={handleChangeExercise}
                    changingExerciseRef={
                      changingExerciseDay === activeDay.day
                        ? changingExerciseRef
                        : null
                    }
                  />
                ) : activeDay && activeDay.exercises.length == 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
                    <div className="size-16 rounded-full bg-surface-800 flex items-center justify-center text-muted">
                      <CalendarDays
                        size={32}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                    <h2 className="text-white font-bold text-lg">
                      No hay ejercicios para este día
                    </h2>
                    <p className="text-muted text-sm max-w-md">
                      Puedes regenerar este día para obtener nuevos ejercicios o
                      cambiar ejercicios específicos usando los botones
                      correspondientes.
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (!activeDay) return;
                        void handleRegenerateDay(activeDay.day);
                      }}
                      disabled={
                        isGenerateRoutineDisabled ||
                        isRegeneratingDay ||
                        !activeDay
                      }
                      aria-busy={isRegeneratingDay}
                    >
                      <RefreshCw
                        className={isRegeneratingDay ? "animate-spin" : ""}
                        size={20}
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                      {isRegeneratingDay ? "Generando..." : "Generar Nuevo Día"}
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PanelPage;
