import { useEffect, useState } from "react";
import type { RoutineDay, RoutineResponse } from "@/features/routine/types";
import {
  changeRoutineDay,
  changeRoutineExercise,
  ensureGoogleApiKeyConfigured,
  generateRoutine,
  getGoogleApiKeyConfigurationError,
  getRoutineGenerationProfileError,
} from "@/services/api/routines";
import {
  getOperationErrorMessage,
  notifyOperationError,
  notifyRoutineDayGenerated,
  notifyRoutineExerciseChanged,
  notifyRoutineGenerated,
} from "@/services/notifications/appNotifications";

const ROUTINE_STORAGE_KEY = "pfg-kore:chat:routine";
const PROFILE_STORAGE_KEY = "kore.user-profile.v1";
const MIN_AVAILABLE_DAYS = 1;
const MAX_AVAILABLE_DAYS = 7;
const DEFAULT_AVAILABLE_DAYS = 0;

function clampAvailableDays(value: number): number {
  return Math.min(Math.max(value, MIN_AVAILABLE_DAYS), MAX_AVAILABLE_DAYS);
}

function readProfileAvailableDays(): number {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_AVAILABLE_DAYS;
  }

  try {
    const parsed = JSON.parse(raw) as { availableDays?: unknown };
    if (typeof parsed.availableDays !== "number") {
      return DEFAULT_AVAILABLE_DAYS;
    }

    return clampAvailableDays(parsed.availableDays);
  } catch {
    return DEFAULT_AVAILABLE_DAYS;
  }
}

function normalizePanelScheduleDays(routineDays: RoutineDay[]): RoutineDay[] {
  const targetDays = Math.max(readProfileAvailableDays(), routineDays.length);
  const normalized = routineDays.slice(0, targetDays).map((day, index) => ({
    day:
      typeof day.day === "string" && day.day.trim().length > 0
        ? day.day
        : `Día ${index + 1}`,
    exercises: Array.isArray(day.exercises) ? day.exercises : [],
  }));

  for (
    let dayIndex = normalized.length + 1;
    dayIndex <= targetDays;
    dayIndex += 1
  ) {
    normalized.push({
      day: `Día ${dayIndex}`,
      exercises: [],
    });
  }

  return normalized;
}

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
    return normalizePanelScheduleDays([]);
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRoutineResponse(parsed)) {
      return normalizePanelScheduleDays([]);
    }

    return normalizePanelScheduleDays(parsed.routine);
  } catch {
    return normalizePanelScheduleDays([]);
  }
}

function dayHasExercises(day: RoutineDay): boolean {
  return Array.isArray(day.exercises) && day.exercises.length > 0;
}

function getPreferredSelectedDay(schedule: RoutineDay[]): string {
  return schedule.find(dayHasExercises)?.day ?? schedule[0]?.day ?? "";
}

export function usePanelRoutine() {
  const [panelSchedule, setPanelSchedule] = useState<RoutineDay[]>(() =>
    readPanelSchedule(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);
  const [changingExerciseRef, setChangingExerciseRef] = useState<string | null>(
    null,
  );
  const [changingExerciseDay, setChangingExerciseDay] = useState<string | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState("");

  const profileError = getRoutineGenerationProfileError();
  const googleApiKeyError = getGoogleApiKeyConfigurationError();
  const generateRoutineErrorMessage = profileError ?? generationError;
  const isGenerateRoutineDisabled = isLoading || Boolean(profileError);
  const hasAnyDayWithExercises = panelSchedule.some(dayHasExercises);
  const activeDay =
    panelSchedule.find((day) => day.day === selectedDay) ??
    panelSchedule.find(dayHasExercises) ??
    panelSchedule[0];

  useEffect(() => {
    setSelectedDay((currentDay) => {
      const exists = panelSchedule.some((day) => day.day === currentDay);
      return exists ? currentDay : getPreferredSelectedDay(panelSchedule);
    });
  }, [panelSchedule]);

  const handleGenerateRoutine = async () => {
    if (isGenerateRoutineDisabled) {
      return;
    }

    if (googleApiKeyError) {
      setGenerationError(googleApiKeyError);
      notifyOperationError(
        new Error(googleApiKeyError),
        "Configura tu Google API Key en Ajustes para generar rutinas.",
        "Google API Key no configurada",
      );
      return;
    }

    const previousSchedule = panelSchedule;
    const previousSelectedDay = selectedDay;

    setGenerationError(null);
    setIsLoading(true);

    try {
      ensureGoogleApiKeyConfigured();
      const routine = await generateRoutine("");
      const normalizedRoutine = normalizePanelScheduleDays(routine.routine);
      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routine));
      setPanelSchedule(normalizedRoutine);
      setSelectedDay(getPreferredSelectedDay(normalizedRoutine));
      notifyRoutineGenerated();
    } catch (error) {
      const message = getOperationErrorMessage(
        error,
        "No se pudo generar la rutina.",
      );

      setPanelSchedule(previousSchedule);
      setSelectedDay(
        previousSelectedDay || getPreferredSelectedDay(previousSchedule),
      );
      setGenerationError(message);
      notifyOperationError(
        error,
        "No se pudo generar la rutina.",
        "No se pudo generar la rutina",
      );
      console.error("Error generando rutina:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateDay = async (dayToChange: string) => {
    if (panelSchedule.length <= 0 || isRegeneratingDay) {
      return;
    }

    if (googleApiKeyError) {
      notifyOperationError(
        new Error(googleApiKeyError),
        "Configura tu Google API Key en Ajustes para regenerar días.",
        "Google API Key no configurada",
      );
      return;
    }

    setIsRegeneratingDay(true);

    try {
      ensureGoogleApiKeyConfigured();
      const updatedRoutine = await changeRoutineDay(
        { routine: panelSchedule },
        dayToChange,
      );

      const normalizedRoutine = normalizePanelScheduleDays(
        updatedRoutine.routine,
      );

      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(updatedRoutine));
      setPanelSchedule(normalizedRoutine);
      setSelectedDay((currentDay) => {
        const exists = normalizedRoutine.some((day) => day.day === currentDay);
        return exists ? currentDay : getPreferredSelectedDay(normalizedRoutine);
      });
      notifyRoutineDayGenerated(dayToChange);
    } catch (error) {
      notifyOperationError(
        error,
        "No se pudo generar un nuevo día.",
        "No se pudo generar el día",
      );
      console.error("Error regenerando dia de rutina:", error);
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

    if (googleApiKeyError) {
      notifyOperationError(
        new Error(googleApiKeyError),
        "Configura tu Google API Key en Ajustes para cambiar ejercicios.",
        "Google API Key no configurada",
      );
      return;
    }

    setChangingExerciseDay(dayToChange);
    setChangingExerciseRef(exerciseToChange);

    try {
      ensureGoogleApiKeyConfigured();
      const updatedRoutine = await changeRoutineExercise(
        { routine: panelSchedule },
        dayToChange,
        exerciseToChange,
      );

      const normalizedRoutine = normalizePanelScheduleDays(
        updatedRoutine.routine,
      );

      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(updatedRoutine));
      setPanelSchedule(normalizedRoutine);
      setSelectedDay((currentDay) => {
        const exists = normalizedRoutine.some((day) => day.day === currentDay);
        return exists ? currentDay : getPreferredSelectedDay(normalizedRoutine);
      });
      notifyRoutineExerciseChanged(dayToChange);
    } catch (error) {
      notifyOperationError(
        error,
        "No se pudo cambiar el ejercicio seleccionado.",
        "No se pudo cambiar el ejercicio",
      );
      console.error("Error cambiando ejercicio de rutina:", error);
    } finally {
      setChangingExerciseRef(null);
      setChangingExerciseDay(null);
    }
  };

  return {
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
  };
}
