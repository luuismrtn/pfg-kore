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

function normalizeRoutineScheduleDays(routineDays: RoutineDay[]): RoutineDay[] {
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

function readRoutineSchedule(): RoutineDay[] {
  const raw = localStorage.getItem(ROUTINE_STORAGE_KEY);
  if (!raw) {
    return normalizeRoutineScheduleDays([]);
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRoutineResponse(parsed)) {
      return normalizeRoutineScheduleDays([]);
    }

    return normalizeRoutineScheduleDays(parsed.routine);
  } catch {
    return normalizeRoutineScheduleDays([]);
  }
}

function dayHasExercises(day: RoutineDay): boolean {
  return Array.isArray(day.exercises) && day.exercises.length > 0;
}

function getPreferredSelectedDay(schedule: RoutineDay[]): string {
  return schedule.find(dayHasExercises)?.day ?? schedule[0]?.day ?? "";
}

type RoutineOperationState = {
  isLoading: boolean;
  isRegeneratingDay: boolean;
  changingExerciseRef: string | null;
  changingExerciseDay: string | null;
};

const routineOperationState: RoutineOperationState = {
  isLoading: false,
  isRegeneratingDay: false,
  changingExerciseRef: null,
  changingExerciseDay: null,
};

const routineOperationListeners = new Set<
  (state: RoutineOperationState) => void
>();

function subscribeRoutineOperationState(
  listener: (state: RoutineOperationState) => void,
) {
  routineOperationListeners.add(listener);

  return () => {
    routineOperationListeners.delete(listener);
  };
}

function updateRoutineOperationState(patch: Partial<RoutineOperationState>) {
  const nextState: RoutineOperationState = {
    ...routineOperationState,
    ...patch,
  };

  const hasChanged =
    nextState.isLoading !== routineOperationState.isLoading ||
    nextState.isRegeneratingDay !== routineOperationState.isRegeneratingDay ||
    nextState.changingExerciseRef !==
      routineOperationState.changingExerciseRef ||
    nextState.changingExerciseDay !== routineOperationState.changingExerciseDay;

  if (!hasChanged) {
    return;
  }

  routineOperationState.isLoading = nextState.isLoading;
  routineOperationState.isRegeneratingDay = nextState.isRegeneratingDay;
  routineOperationState.changingExerciseRef = nextState.changingExerciseRef;
  routineOperationState.changingExerciseDay = nextState.changingExerciseDay;

  routineOperationListeners.forEach((listener) => {
    listener(routineOperationState);
  });
}

export function useRoutine() {
  const [routineSchedule, setRoutineSchedule] = useState<RoutineDay[]>(() =>
    readRoutineSchedule(),
  );
  const [isLoading, setIsLoading] = useState(
    () => routineOperationState.isLoading,
  );
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isRegeneratingDay, setIsRegeneratingDay] = useState(
    () => routineOperationState.isRegeneratingDay,
  );
  const [changingExerciseRef, setChangingExerciseRef] = useState<string | null>(
    () => routineOperationState.changingExerciseRef,
  );
  const [changingExerciseDay, setChangingExerciseDay] = useState<string | null>(
    () => routineOperationState.changingExerciseDay,
  );
  const [selectedDay, setSelectedDay] = useState("");

  const profileError = getRoutineGenerationProfileError();
  const googleApiKeyError = getGoogleApiKeyConfigurationError();
  const generateRoutineErrorMessage = profileError ?? generationError;
  const isGenerateRoutineDisabled = isLoading || Boolean(profileError);
  const hasAnyDayWithExercises = routineSchedule.some(dayHasExercises);
  const activeDay =
    routineSchedule.find((day) => day.day === selectedDay) ??
    routineSchedule.find(dayHasExercises) ??
    routineSchedule[0];

  useEffect(() => {
    setSelectedDay((currentDay) => {
      const exists = routineSchedule.some((day) => day.day === currentDay);
      return exists ? currentDay : getPreferredSelectedDay(routineSchedule);
    });
  }, [routineSchedule]);

  useEffect(
    () =>
      subscribeRoutineOperationState((state) => {
        setIsLoading(state.isLoading);
        setIsRegeneratingDay(state.isRegeneratingDay);
        setChangingExerciseRef(state.changingExerciseRef);
        setChangingExerciseDay(state.changingExerciseDay);
      }),
    [],
  );

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

    const previousSchedule = routineSchedule;
    const previousSelectedDay = selectedDay;

    setGenerationError(null);
    updateRoutineOperationState({ isLoading: true });

    try {
      ensureGoogleApiKeyConfigured();
      const routine = await generateRoutine("");
      const normalizedRoutine = normalizeRoutineScheduleDays(routine.routine);
      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routine));
      setRoutineSchedule(normalizedRoutine);
      setSelectedDay(getPreferredSelectedDay(normalizedRoutine));
      notifyRoutineGenerated();
    } catch (error) {
      const message = getOperationErrorMessage(
        error,
        "No se pudo generar la rutina.",
      );

      setRoutineSchedule(previousSchedule);
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
      updateRoutineOperationState({ isLoading: false });
    }
  };

  const handleRegenerateDay = async (dayToChange: string) => {
    if (routineSchedule.length <= 0 || isRegeneratingDay) {
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

    updateRoutineOperationState({ isRegeneratingDay: true });

    try {
      ensureGoogleApiKeyConfigured();
      const updatedRoutine = await changeRoutineDay(
        { routine: routineSchedule },
        dayToChange,
      );

      const normalizedRoutine = normalizeRoutineScheduleDays(
        updatedRoutine.routine,
      );

      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(updatedRoutine));
      setRoutineSchedule(normalizedRoutine);
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
      updateRoutineOperationState({ isRegeneratingDay: false });
    }
  };

  const handleChangeExercise = async (
    dayToChange: string,
    exerciseToChange: string,
  ) => {
    if (routineSchedule.length <= 0 || changingExerciseRef) {
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

    updateRoutineOperationState({
      changingExerciseDay: dayToChange,
      changingExerciseRef: exerciseToChange,
    });

    try {
      ensureGoogleApiKeyConfigured();
      const updatedRoutine = await changeRoutineExercise(
        { routine: routineSchedule },
        dayToChange,
        exerciseToChange,
      );

      const normalizedRoutine = normalizeRoutineScheduleDays(
        updatedRoutine.routine,
      );

      localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(updatedRoutine));
      setRoutineSchedule(normalizedRoutine);
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
      updateRoutineOperationState({
        changingExerciseRef: null,
        changingExerciseDay: null,
      });
    }
  };

  return {
    routineSchedule,
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
