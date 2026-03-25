import { useState } from "react";
import HeaderBar from "@/components/layout/HeaderBar";
import DayColumnCard from "@/components/schedule/DayColumnCard";
import type { RoutineDay, RoutineResponse } from "@/features/routine/types";
import {
  changeRoutineDay,
  changeRoutineExercise,
  generateRoutine,
} from "@/services/api/routinesApi";

const ROUTINE_STORAGE_KEY = "pfg-kore:chat:routine";

function isRoutineResponse(value: unknown): value is RoutineResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybeRoutine = value as Partial<RoutineResponse>;
  return Array.isArray(maybeRoutine.routine);
}

function readPanelSchedule(): RoutineDay[] {
  const raw = localStorage.getItem(ROUTINE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRoutineResponse(parsed)) {
      return [];
    }

    return parsed.routine.length > 0 ? parsed.routine : [];
  } catch {
    return [];
  }
}

function PanelPage() {
  const [panelSchedule, setPanelSchedule] = useState<RoutineDay[]>(() =>
    readPanelSchedule(),
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);
  const [changingExerciseRef, setChangingExerciseRef] = useState<string | null>(
    null,
  );
  const [changingExerciseDay, setChangingExerciseDay] = useState<string | null>(
    null,
  );

  const [selectedDay, setSelectedDay] = useState("");
  const activeDay =
    panelSchedule.find((day) => day.day === selectedDay) ?? panelSchedule[0];

  const handleGenerateRoutine = async () => {
    setIsLoading(true);
    try {
      setPanelSchedule([]);
      const routine = await generateRoutine("");
      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routine));
      setPanelSchedule(routine.routine);
      setSelectedDay(routine.routine[0]?.day ?? "");
    } catch (err) {
      console.error("Error generando rutina:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateDay = async (dayToChange: string) => {
    if (panelSchedule.length <= 0 || isRegeneratingDay) {
      return;
    }

    setIsRegeneratingDay(true);
    try {
      const updatedRoutine = await changeRoutineDay(
        { routine: panelSchedule },
        dayToChange,
      );

      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(updatedRoutine));
      setPanelSchedule(updatedRoutine.routine);
      setSelectedDay((currentDay) => {
        const exists = updatedRoutine.routine.some(
          (day) => day.day === currentDay,
        );
        return exists ? currentDay : (updatedRoutine.routine[0]?.day ?? "");
      });
    } catch (err) {
      console.error("Error regenerando dia de rutina:", err);
    } finally {
      setIsRegeneratingDay(false);
    }
  };

  const handleChangeExercise = async (
    dayToChange: string,
    exerciseToChange: string,
  ) => {
    if (panelSchedule.length <= 0 || changingExerciseRef) {
      return;
    }

    setChangingExerciseDay(dayToChange);
    setChangingExerciseRef(exerciseToChange);
    try {
      const updatedRoutine = await changeRoutineExercise(
        { routine: panelSchedule },
        dayToChange,
        exerciseToChange,
      );

      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(updatedRoutine));
      setPanelSchedule(updatedRoutine.routine);
      setSelectedDay((currentDay) => {
        const exists = updatedRoutine.routine.some(
          (day) => day.day === currentDay,
        );
        return exists ? currentDay : (updatedRoutine.routine[0]?.day ?? "");
      });
    } catch (err) {
      console.error("Error cambiando ejercicio de rutina:", err);
    } finally {
      setChangingExerciseRef(null);
      setChangingExerciseDay(null);
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <HeaderBar
        title="Horario Semanal"
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-contrast cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerateRoutine}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            <span
              className={`material-symbols-outlined text-base leading-none ${
                isLoading ? "animate-spin" : ""
              }`}
              aria-hidden="true"
            >
              autorenew
            </span>
            {isLoading ? "Generando..." : "Generar Nueva Rutina"}
          </button>
        }
      />

      <div className="flex-1 overflow-hidden p-8">
        {panelSchedule.length <= 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
            <div className="size-16 rounded-full bg-surface-800 flex items-center justify-center text-muted">
              <span className="material-symbols-outlined text-[32px]">
                calendar_month
              </span>
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
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-contrast cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleGenerateRoutine}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              <span
                className={`material-symbols-outlined text-base leading-none ${
                  isLoading ? "animate-spin" : ""
                }`}
                aria-hidden="true"
              >
                autorenew
              </span>
              {isLoading ? "Generando..." : "Generar Rutina"}
            </button>
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
                              ? "bg-primary text-contrast"
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
                {activeDay ? (
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
