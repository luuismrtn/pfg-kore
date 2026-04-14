import {
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import HeaderBar from "@/components/layout/HeaderBar";
import type { UserProfileForm } from "@/features/profile/types";
import { getAvailableSportOptions } from "@/services/api/routines";
import { notifyProfileUpdated } from "@/services/notifications/appNotifications";

const PROFILE_STORAGE_KEY = "kore.user-profile.v1";

const DEFAULT_SPORT_OPTIONS = [
  "Musculación",
  "Calistenia",
  "Running",
  "Movilidad",
  "Cardio Funcional",
];

const equipmentOptions = [
  "Mancuernas y Pesas Libres",
  "Barras y Discos",
  "Banco de musculacion",
  "Máquinas de gimnasio",
  "Estructuras de Calistenia",
  "Accesorios",
];

const injuryOptions = [
  "Hombro",
  "Codo",
  "Muñeca",
  "Cervical",
  "Espalda baja",
  "Cadera",
  "Rodilla",
  "Tobillo",
];

const levelOptions = ["Principiante", "Intermedio", "Avanzado"];

type WizardStepId = "name" | "body" | "training" | "schedule" | "limits";

type WizardStep = {
  id: WizardStepId;
  title: string;
  subtitle: string;
};

const wizardSteps: WizardStep[] = [
  {
    id: "name",
    title: "Empezamos por ti",
    subtitle: "Vamos a guardar como quieres que te llamemos.",
  },
  {
    id: "body",
    title: "Datos físicos",
    subtitle: "Peso y altura para ajustar volumen e intensidad.",
  },
  {
    id: "training",
    title: "Contexto deportivo",
    subtitle: "Deporte principal y nivel actual.",
  },
  {
    id: "schedule",
    title: "Tu disponibilidad",
    subtitle: "Días y duración de cada entrenamiento.",
  },
  {
    id: "limits",
    title: "Material y lesiones",
    subtitle: "Con esto filtramos ejercicios no adecuados.",
  },
];

const defaultProfile: UserProfileForm = {
  name: "",
  weightKg: "",
  heightCm: "",
  sport: "Musculación",
  equipment: [],
  injuries: [],
  availableDays: 3,
  averageDurationMinutes: 60,
  level: "Principiante",
};

function toValidProfile(value: unknown): UserProfileForm | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<UserProfileForm>;

  const equipment = Array.isArray(candidate.equipment)
    ? candidate.equipment.filter((x) => typeof x === "string")
    : null;
  const injuries = Array.isArray(candidate.injuries)
    ? candidate.injuries.filter((x) => typeof x === "string")
    : null;

  return {
    name: typeof candidate.name === "string" ? candidate.name : "",
    weightKg:
      typeof candidate.weightKg === "number" || candidate.weightKg === ""
        ? candidate.weightKg
        : "",
    heightCm:
      typeof candidate.heightCm === "number" || candidate.heightCm === ""
        ? candidate.heightCm
        : "",
    sport:
      typeof candidate.sport === "string" && candidate.sport.length > 0
        ? candidate.sport
        : "Musculación",
    equipment: equipment || [],
    injuries: injuries || [],
    level:
      typeof candidate.level === "string" && candidate.level.length > 0
        ? candidate.level
        : "Principiante",
    availableDays: Math.min(Math.max(candidate.availableDays || 1, 1), 7),
    averageDurationMinutes: Math.min(
      Math.max(candidate.averageDurationMinutes || 60, 20),
      240,
    ),
  };
}

export function getProfile() {
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as unknown;
      return toValidProfile(parsed) ?? defaultProfile;
    } catch {
      console.error(
        "Failed to parse user profile from localStorage. Falling back to default profile.",
      );
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }

  return defaultProfile;
}

function hasCompleteProfileData(profile: UserProfileForm): boolean {
  return (
    typeof profile.weightKg === "number" &&
    profile.weightKg >= 30 &&
    profile.weightKg <= 250 &&
    typeof profile.heightCm === "number" &&
    profile.heightCm >= 120 &&
    profile.heightCm <= 230 &&
    typeof profile.sport === "string" &&
    profile.sport.trim().length > 0 &&
    typeof profile.level === "string" &&
    profile.level.trim().length > 0 &&
    Number.isFinite(profile.availableDays) &&
    profile.availableDays >= 1 &&
    profile.availableDays <= 7 &&
    Number.isFinite(profile.averageDurationMinutes) &&
    profile.averageDurationMinutes >= 20 &&
    profile.averageDurationMinutes <= 240 &&
    Array.isArray(profile.equipment) &&
    Array.isArray(profile.injuries)
  );
}

function ProfilePage() {
  const [form, setForm] = useState<UserProfileForm>(defaultProfile);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showWizard, setShowWizard] = useState(false);
  const [sportOptions, setSportOptions] = useState(DEFAULT_SPORT_OPTIONS);

  useEffect(() => {
    const profile = getProfile();
    setForm(profile);
    setShowWizard(!hasCompleteProfileData(profile));
  }, []);

  useEffect(() => {
    let isActive = true;

    void getAvailableSportOptions().then((options: string[]) => {
      if (!isActive) {
        return;
      }

      const nextOptions = options.length > 0 ? options : DEFAULT_SPORT_OPTIONS;

      setSportOptions(nextOptions);
      setForm((current) => {
        const currentSport = current.sport.trim();
        if (currentSport.length > 0 && nextOptions.includes(currentSport)) {
          return current;
        }

        return {
          ...current,
          sport: nextOptions[0] ?? current.sport,
        };
      });
    });

    return () => {
      isActive = false;
    };
  }, []);

  const bmi = useMemo(() => {
    if (
      typeof form.weightKg !== "number" ||
      typeof form.heightCm !== "number"
    ) {
      return null;
    }

    const heightMeters = form.heightCm / 100;
    if (heightMeters <= 0) {
      return null;
    }

    return (form.weightKg / (heightMeters * heightMeters)).toFixed(1);
  }, [form.heightCm, form.weightKg]);

  const getRangeProgressStyle = (
    value: number,
    min: number,
    max: number,
  ): CSSProperties => {
    const range = max - min;
    if (range <= 0) {
      return { "--range-progress": "0%" } as CSSProperties;
    }

    const rawProgress = ((value - min) / range) * 100;
    const progress = Math.min(100, Math.max(0, rawProgress));
    return { "--range-progress": `${progress}%` } as CSSProperties;
  };

  const currentStep = wizardSteps[stepIndex];
  const progressPercentage =
    ((stepIndex + 1) / Math.max(wizardSteps.length, 1)) * 100;

  const handleNumberInput = (
    field: "weightKg" | "heightCm",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;

    if (value === "") {
      setForm((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  const toggleSelection = (field: "equipment" | "injuries", value: string) => {
    setForm((prev) => {
      const values = prev[field];
      const hasValue = values.includes(value);
      return {
        ...prev,
        [field]: hasValue
          ? values.filter((item) => item !== value)
          : [...values, value],
      } as UserProfileForm;
    });
  };

  const goToStep = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= wizardSteps.length) {
      return;
    }

    setDirection(targetIndex > stepIndex ? 1 : -1);
    setStepIndex(targetIndex);
  };

  const isProfileValidForSave =
    typeof form.weightKg === "number" &&
    form.weightKg >= 30 &&
    form.weightKg <= 250 &&
    typeof form.heightCm === "number" &&
    form.heightCm >= 120 &&
    form.heightCm <= 230 &&
    form.availableDays >= 1 &&
    form.availableDays <= 7 &&
    form.averageDurationMinutes >= 20 &&
    form.averageDurationMinutes <= 240;

  const canProceed = (() => {
    switch (currentStep.id) {
      case "body":
        return (
          typeof form.weightKg === "number" &&
          form.weightKg >= 30 &&
          form.weightKg <= 250 &&
          typeof form.heightCm === "number" &&
          form.heightCm >= 120 &&
          form.heightCm <= 230
        );
      case "schedule":
        return (
          form.availableDays >= 1 &&
          form.availableDays <= 7 &&
          form.averageDurationMinutes >= 20 &&
          form.averageDurationMinutes <= 240
        );
      default:
        return true;
    }
  })();

  const handleSaveProfile = () => {
    if (!isProfileValidForSave) {
      return;
    }

    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(form));

    notifyProfileUpdated();

    if (showWizard) {
      setShowWizard(false);
    }
  };

  const handleClassicSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSaveProfile();
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case "name":
        return (
          <div className="space-y-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">
                ¿Como te llamas?
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, name: event.target.value }));
                }}
                placeholder="Ejemplo: Luis"
                className="rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <p className="text-sm text-muted">
              Si lo dejas vacío, usaremos un saludo genérico en los
              entrenamientos. Siempre puedes cambiarlo luego.
            </p>
          </div>
        );

      case "body":
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Peso (kg)</span>
              <input
                type="number"
                min={30}
                max={250}
                step="0.1"
                value={form.weightKg}
                onChange={(event) => handleNumberInput("weightKg", event)}
                placeholder="72.5"
                className="rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">
                Altura (cm)
              </span>
              <input
                type="number"
                min={120}
                max={230}
                step="1"
                value={form.heightCm}
                onChange={(event) => handleNumberInput("heightCm", event)}
                placeholder="178"
                className="rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
              />
            </label>

            <div className="md:col-span-2 rounded-xl border border-border bg-surface-800/80 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted">
                IMC estimado
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {bmi ?? "Completa peso y altura"}
              </p>
            </div>
          </div>
        );

      case "training":
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">
                Deporte principal
              </span>
              <select
                value={form.sport}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, sport: event.target.value }));
                }}
                className="rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {sportOptions.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">Nivel</span>
              <select
                value={form.level}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, level: event.target.value }));
                }}
                className="rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {levelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          </div>
        );

      case "schedule":
        return (
          <div className="space-y-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">
                Dias disponibles por semana
              </span>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={form.availableDays}
                style={getRangeProgressStyle(form.availableDays, 1, 7)}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    availableDays: Number(event.target.value),
                  }));
                }}
                className="kore-range accent-primary cursor-pointer"
              />
              <span className="text-sm text-white">
                {form.availableDays} dias disponibles
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-white">
                Duracion media por entreno
              </span>
              <input
                type="range"
                min={20}
                max={240}
                step={5}
                value={form.averageDurationMinutes}
                style={getRangeProgressStyle(
                  form.averageDurationMinutes,
                  20,
                  240,
                )}
                onChange={(event) => {
                  setForm((prev) => ({
                    ...prev,
                    averageDurationMinutes: Number(event.target.value),
                  }));
                }}
                className="kore-range accent-primary cursor-pointer"
              />
              <span className="text-sm text-white">
                {form.averageDurationMinutes} minutos
              </span>
            </label>
          </div>
        );

      case "limits":
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-white">
                Equipamiento disponible
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {equipmentOptions.map((item) => {
                  const selected = form.equipment.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleSelection("equipment", item)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition cursor-pointer ${
                        selected
                          ? "border-primary/70 bg-primary/20 text-white"
                          : "border-border bg-surface-800 text-muted hover:border-primary/40 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Lesiones</p>
              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                {injuryOptions.map((part) => {
                  const selected = form.injuries.includes(part);
                  return (
                    <button
                      key={part}
                      type="button"
                      onClick={() => toggleSelection("injuries", part)}
                      className={`rounded-xl border px-3 py-2 text-sm transition cursor-pointer ${
                        selected
                          ? "border-primary/70 bg-primary/20 text-white"
                          : "border-border bg-surface-800 text-muted hover:border-primary/40 hover:text-white"
                      }`}
                    >
                      {part}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showWizard) {
    return (
      <div className="flex h-full flex-col">
        <HeaderBar title="Perfil Deportivo" />

        <div className="relative flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-border/30 blur-3xl" />
          </div>

          <div className="relative mx-auto w-full max-w-4xl">
            <section className="rounded-2xl border border-border bg-surface-900/75 p-6 shadow-(--shadow-primary-20-soft) backdrop-blur-xl">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">
                    Paso {stepIndex + 1} de {wizardSteps.length}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-white">
                    {currentStep.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {currentStep.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-800">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="mt-8 overflow-hidden">
                <div
                  key={`${currentStep.id}-${direction}`}
                  className={`profile-step-anim ${
                    direction > 0
                      ? "profile-step-enter-right"
                      : "profile-step-enter-left"
                  }`}
                >
                  {renderStep()}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => goToStep(stepIndex - 1)}
                  disabled={stepIndex === 0}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer hover:border-primary/50"
                >
                  Anterior
                </button>

                {stepIndex < wizardSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => goToStep(stepIndex + 1)}
                    disabled={!canProceed}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={!canProceed}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    Finalizar y guardar
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <HeaderBar title="Perfil Deportivo" />

      <div className="relative flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-border/30 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.7fr_1fr]">
          <section className="rounded-2xl border border-border bg-surface-900/75 p-6 shadow-(--shadow-primary-20-soft) backdrop-blur-xl">
            <div className="rounded-2xl border border-primary/25 b p-5">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary/90 uppercase">
                Perfil deportivo
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">
                Ajusta tu configuración
              </h3>
              <p className="mt-2 text-sm text-muted">
                Cambia tus datos, disponibilidad y limitaciones para
                personalizar mejor tus rutinas.
              </p>
            </div>

            <form
              className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2"
              onSubmit={handleClassicSubmit}
            >
              <div className="md:col-span-2 rounded-2xl border border-border bg-surface-800/65 p-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Datos personales
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="flex flex-col gap-2 md:col-span-3">
                    <span className="text-sm font-medium text-white">
                      Nombre (opcional)
                    </span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }));
                      }}
                      placeholder="Ejemplo: Luis"
                      className="rounded-xl border border-border bg-surface-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">
                      Peso (kg)
                    </span>
                    <input
                      type="number"
                      min={30}
                      max={250}
                      step="0.1"
                      value={form.weightKg}
                      onChange={(event) => handleNumberInput("weightKg", event)}
                      placeholder="72.5"
                      required
                      className="rounded-xl border border-border bg-surface-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">
                      Altura (cm)
                    </span>
                    <input
                      type="number"
                      min={120}
                      max={230}
                      step="1"
                      value={form.heightCm}
                      onChange={(event) => handleNumberInput("heightCm", event)}
                      placeholder="178"
                      required
                      className="rounded-xl border border-border bg-surface-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
                    />
                  </label>

                  <div className="rounded-xl border border-primary/25 bg-primary/12 px-4 py-3">
                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                      IMC
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {bmi ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-800/65 p-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Contexto deportivo
                </p>
                <label className="mt-3 flex flex-col gap-2">
                  <select
                    value={form.sport}
                    onChange={(event) => {
                      setForm((prev) => ({
                        ...prev,
                        sport: event.target.value,
                      }));
                    }}
                    className="rounded-xl border border-border bg-surface-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    {sportOptions.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-border bg-surface-800/65 p-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Nivel actual
                </p>
                <label className="mt-3 flex flex-col gap-2">
                  <select
                    value={form.level}
                    onChange={(event) => {
                      setForm((prev) => ({
                        ...prev,
                        level: event.target.value,
                      }));
                    }}
                    className="rounded-xl border border-border bg-surface-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-border bg-surface-800/65 p-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Disponibilidad
                </p>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">
                      Dias disponibles por semana
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={7}
                      step={1}
                      value={form.availableDays}
                      style={getRangeProgressStyle(form.availableDays, 1, 7)}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          availableDays: Number(event.target.value),
                        }));
                      }}
                      className="kore-range accent-primary cursor-pointer"
                    />
                    <span className="inline-flex w-fit rounded-full border border-primary/35 bg-primary/18 px-3 py-1 text-xs font-semibold text-primary">
                      {form.availableDays} dias
                    </span>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-white">
                      Duracion media por entreno (min)
                    </span>
                    <input
                      type="number"
                      min={20}
                      max={240}
                      step={5}
                      value={form.averageDurationMinutes}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          averageDurationMinutes: Number(event.target.value),
                        }));
                      }}
                      className="rounded-xl border border-border bg-surface-900 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
                    />
                  </label>
                </div>
              </div>

              <fieldset className="md:col-span-2 rounded-2xl border border-border bg-surface-800/65 p-4">
                <p className="px-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Equipamiento disponible
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {equipmentOptions.map((item) => {
                    const checked = form.equipment.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleSelection("equipment", item)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition cursor-pointer ${
                          checked
                            ? "border-primary/70 bg-primary/20 text-white"
                            : "border-border bg-surface-900 text-muted hover:border-primary/40 hover:text-white"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="md:col-span-2 rounded-2xl border border-border bg-surface-800/65 p-4">
                <p className="px-1 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                  Lesiones
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {injuryOptions.map((part) => {
                    const checked = form.injuries.includes(part);
                    return (
                      <button
                        key={part}
                        type="button"
                        onClick={() => toggleSelection("injuries", part)}
                        className={`rounded-xl border px-3 py-2 text-sm transition cursor-pointer ${
                          checked
                            ? "border-primary/70 bg-primary/20 text-white"
                            : "border-border bg-surface-900 text-muted hover:border-primary/40 hover:text-white"
                        }`}
                      >
                        {part}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="md:col-span-2 mt-1 flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-black transition hover:brightness-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isProfileValidForSave}
                >
                  Guardar perfil
                </button>
                {!isProfileValidForSave ? (
                  <span className="text-sm text-amber-300">
                    Completa peso y altura con valores validos.
                  </span>
                ) : null}
              </div>
            </form>
          </section>

          <aside className="h-fit rounded-2xl border border-border bg-surface-900/65 p-6 shadow-(--shadow-primary-15-weak) backdrop-blur-md">
            <h3 className="text-lg font-bold text-white">Resumen rápido</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">Nombre</p>
                <p className="mt-1 font-semibold text-white">
                  {form.name.trim() ? form.name : "No proporcionado"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">Deporte / Nivel</p>
                <p className="mt-1 font-semibold text-white">
                  {form.sport} - {form.level}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">Disponibilidad</p>
                <p className="mt-1 font-semibold text-white">
                  {form.availableDays} dias x {form.averageDurationMinutes} min
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">Lesiones</p>
                <p className="mt-1 font-semibold text-white">
                  {form.injuries.length > 0
                    ? form.injuries.join(", ")
                    : "Ninguna"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">IMC estimado</p>
                <p className="mt-1 font-semibold text-white">
                  {bmi ?? "Completa peso y altura"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface-800/50 px-4 py-3 text-sm text-muted">
              Edita cualquier dato y guarda cuando quieras.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
