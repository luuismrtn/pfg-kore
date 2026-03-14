import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import HeaderBar from "@/components/layout/HeaderBar";
import type { UserProfileForm } from "@/types/profile";

const PROFILE_STORAGE_KEY = "kore.user-profile.v1";

const sportOptions = ["Musculacion", "Running", "Calistenia"];

const equipmentOptions = [
  "Peso Corporal",
  "Mancuernas",
  "Barra",
  "Banda elástica",
  "Kettlebell",
  "Máquina",
  "Cinta de correr",
  "Bicicleta estática",
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

const defaultProfile: UserProfileForm = {
  name: "",
  weightKg: "",
  heightCm: "",
  sport: "Musculacion",
  equipment: [],
  injuries: [],
  availableDays: 3,
  averageDurationMinutes: 60,
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
    name: candidate.name || "",
    weightKg: candidate.weightKg || "",
    heightCm: candidate.heightCm || "",
    sport: candidate.sport || "Musculacion",
    equipment: equipment || [],
    injuries: injuries || [],
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
      return JSON.parse(stored) as UserProfileForm;
    } catch {
      console.error(
        "Error al parsear el perfil de usuario desde localStorage. Se usará un perfil por defecto.",
      );
      localStorage.removeItem(PROFILE_STORAGE_KEY);
    }
  }
}

function ProfilePage() {
  const [form, setForm] = useState<UserProfileForm>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const rawProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!rawProfile) {
      return;
    }

    try {
      const parsedProfile = JSON.parse(rawProfile) as unknown;
      const validProfile = toValidProfile(parsedProfile);
      if (validProfile) {
        setForm(validProfile);
      }
    } catch {
      // Si el contenido del storage no es JSON valido, ignoramos y usamos defaults.
    }
  }, []);

  const imc = useMemo(() => {
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

  const handleNumberInput = (
    field: "weightKg" | "heightCm",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setSaved(false);

    if (value === "") {
      setForm((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    const numericValue = Number(value);
    setForm((prev) => ({
      ...prev,
      [field]: Number.isNaN(numericValue) ? "" : numericValue,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(form));
    setSaved(true);
  };

  return (
    <div className="flex flex-col h-full">
      <HeaderBar title="Perfil Deportivo" />

      <div className="relative flex-1 px-8 py-6 overflow-y-auto custom-scrollbar">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-4 h-72 w-72 rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-border/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-border bg-surface-900/75 p-6 shadow-(--shadow-primary-20-soft) backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white">
              Datos base del usuario
            </h3>
            <p className="mt-1 text-sm text-muted">
              Esta informacion se usara para personalizar recomendaciones y
              rutinas.
            </p>

            <form
              className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={handleSubmit}
            >
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-white">
                  Nombre (opcional)
                </span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => {
                    setSaved(false);
                    setForm((prev) => ({ ...prev, name: event.target.value }));
                  }}
                  placeholder="Ejemplo: Luis"
                  className="rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
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
                  required
                  className="rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-white">
                  Deporte principal
                </span>
                <select
                  value={form.sport}
                  onChange={(event) => {
                    setSaved(false);
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

              <fieldset className="flex flex-col gap-2 md:col-span-2">
                <legend className="text-sm font-medium text-white">
                  Equipamiento disponible
                </legend>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {equipmentOptions.map((item) => {
                    const checked = form.equipment.includes(item);
                    return (
                      <label
                        key={item}
                        className="inline-flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSaved(false);
                            setForm((prev) => {
                              const has = prev.equipment.includes(item);
                              return {
                                ...prev,
                                equipment: has
                                  ? prev.equipment.filter((e) => e !== item)
                                  : [...prev.equipment, item],
                              } as UserProfileForm;
                            });
                          }}
                          className="accent-primary"
                        />
                        <span className="text-sm text-white">{item}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-2 md:col-span-2">
                <legend className="text-sm font-medium text-white">
                  Lesiones / Problemas en
                </legend>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {injuryOptions.map((part) => {
                    const checked = form.injuries.includes(part);
                    return (
                      <label
                        key={part}
                        className="inline-flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSaved(false);
                            setForm((prev) => {
                              const has = prev.injuries.includes(part);
                              return {
                                ...prev,
                                injuries: has
                                  ? prev.injuries.filter((e) => e !== part)
                                  : [...prev.injuries, part],
                              } as UserProfileForm;
                            });
                          }}
                          className="accent-primary"
                        />
                        <span className="text-sm text-white">{part}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

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
                  onChange={(event) => {
                    setSaved(false);
                    setForm((prev) => ({
                      ...prev,
                      availableDays: Number(event.target.value),
                    }));
                  }}
                  className="accent-primary cursor-pointer"
                />
                <span className="text-xs text-muted">
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
                    setSaved(false);
                    setForm((prev) => ({
                      ...prev,
                      averageDurationMinutes: Number(event.target.value),
                    }));
                  }}
                  className="rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
                />
              </label>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-contrast cursor-pointer"
                >
                  Guardar perfil
                </button>
                {saved ? (
                  <span className="text-sm text-emerald-400">
                    Perfil actualizado.
                  </span>
                ) : null}
              </div>
            </form>
          </section>

          <aside className="rounded-2xl border border-border bg-surface-900/65 p-6 shadow-(--shadow-primary-15-weak) backdrop-blur-md h-fit">
            <h3 className="text-lg font-bold text-white">Resumen rapido</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">Nombre</p>
                <p className="mt-1 font-semibold text-white">
                  {form.name.trim() || "Sin nombre"}
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
                <p className="text-muted">Deporte</p>
                <p className="mt-1 font-semibold text-white">{form.sport}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">Equipamiento</p>
                <p className="mt-1 font-semibold text-white">
                  {form.equipment.join(", ") || "Sin equipamiento"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">Disponibilidad</p>
                <p className="mt-1 font-semibold text-white">
                  {form.availableDays} dias por semana
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">Duracion media</p>
                <p className="mt-1 font-semibold text-white">
                  {form.averageDurationMinutes} min
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-800/70 px-4 py-3">
                <p className="text-muted">IMC estimado</p>
                <p className="mt-1 font-semibold text-white">
                  {imc ?? "Completa peso y altura"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
