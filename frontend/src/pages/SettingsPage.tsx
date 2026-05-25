import { KeyRound, Moon, Save, Sun, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import HeaderBar from "@/components/layout/HeaderBar";
import Skeleton from "@/components/ui/Skeleton";
import {
  getAiModels,
  getStoredGoogleApiKey,
  setStoredGoogleApiKey,
} from "@/services/api/routines";
import type { AiModelsResponse } from "@/services/api/routines";
import ApiKeyTutorial from "@/components/ui/ApiKeyTutorial";

const THEME_STORAGE_KEY = "kore.theme.v1";

type ThemeMode = "dark" | "light";

function readStoredTheme(): ThemeMode {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function AiModelsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-800/60 p-4">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="mt-3 h-5 w-full max-w-80 rounded-full" />
        <Skeleton className="mt-3 h-4 w-56 rounded-full" />
      </div>

      <div className="rounded-xl border border-border bg-surface-800/60 p-4">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="mt-3 h-5 w-full max-w-72 rounded-full" />
      </div>
    </div>
  );
}

function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [googleApiKeyDraft, setGoogleApiKeyDraft] = useState<string>(
    getStoredGoogleApiKey,
  );
  const [googleApiKeyMessage, setGoogleApiKeyMessage] = useState<string | null>(
    null,
  );
  const [aiModels, setAiModels] = useState<AiModelsResponse | null>(null);
  const [isLoadingAiModels, setIsLoadingAiModels] = useState<boolean>(true);
  const [aiModelsError, setAiModelsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAiModels = async () => {
      setIsLoadingAiModels(true);

      try {
        const models = await getAiModels();

        if (!isMounted) {
          return;
        }

        setAiModels(models);
        setAiModelsError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setAiModels(null);
        setAiModelsError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la configuración de modelos de IA.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingAiModels(false);
        }
      }
    };

    void loadAiModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleThemeChange = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    setClearMessage(null);
  };

  const handleClearAllData = () => {
    const shouldDelete = window.confirm(
      "Se eliminaran todos los datos locales de la app. Esta acción no se puede deshacer. ¿Quieres continuar?",
    );

    if (!shouldDelete) {
      return;
    }

    const currentTheme = theme;
    localStorage.clear();
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    setGoogleApiKeyDraft("");
    setGoogleApiKeyMessage(null);
    setClearMessage("Datos eliminados correctamente.");
  };

  const handleSaveGoogleApiKey = () => {
    setStoredGoogleApiKey(googleApiKeyDraft);
    setGoogleApiKeyDraft(getStoredGoogleApiKey());
    setGoogleApiKeyMessage("Google API Key guardada correctamente.");
    setClearMessage(null);
  };

  const handleClearGoogleApiKey = () => {
    setStoredGoogleApiKey("");
    setGoogleApiKeyDraft("");
    setGoogleApiKeyMessage("Google API Key eliminada.");
    setClearMessage(null);
  };

  return (
    <div className="flex flex-col h-full">
      <HeaderBar title="Ajustes" />

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <section className="rounded-2xl border border-border bg-surface-900/70 p-6 backdrop-blur-xl shadow-(--shadow-primary-15-weak)">
            <div className="mb-5">
              <h3 className="text-white text-lg font-bold">Tema</h3>
              <p className="text-muted text-sm mt-1">
                Elige como quieres ver la aplicacion.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors ${
                  theme === "light"
                    ? "border-primary/40 bg-primary/10 text-white"
                    : "border-border bg-surface-800 text-muted hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Sun size={18} aria-hidden="true" />
                  Modo claro
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors ${
                  theme === "dark"
                    ? "border-primary/40 bg-primary/10 text-white"
                    : "border-border bg-surface-800 text-muted hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Moon size={18} aria-hidden="true" />
                  Modo oscuro
                </span>
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-900/70 p-6 backdrop-blur-xl shadow-(--shadow-primary-15-weak)">
            <div className="mb-5">
              <h3 className="text-white text-lg font-bold">Modelos de IA</h3>
              <p className="text-muted text-sm mt-1">
                Modelos configurados en backend para respuestas y embeddings.
              </p>
            </div>

            {isLoadingAiModels ? (
              <AiModelsSkeleton />
            ) : aiModelsError ? (
              <p className="text-sm text-red-300">{aiModelsError}</p>
            ) : aiModels ? (
              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-border bg-surface-800/60 p-4">
                  <p className="text-muted">Modelo para respuestas</p>
                  <p className="mt-1 font-mono text-white break-all">
                    {aiModels.responseModel}
                  </p>
                  <p className="mt-2 text-muted">
                    Fallbacks:{" "}
                    {aiModels.responseModelFallbacks.length > 0
                      ? aiModels.responseModelFallbacks.join(", ")
                      : "Ninguno"}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-surface-800/60 p-4">
                  <p className="text-muted">Modelo para embeddings</p>
                  <p className="mt-1 font-mono text-white break-all">
                    {aiModels.embeddingModel}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">
                No hay información de modelos disponible.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface-900/70 p-6 backdrop-blur-xl shadow-(--shadow-primary-15-weak)">
            <div className="mb-5">
              <h3 className="text-white text-lg font-bold">Gemini API Key</h3>
              <p className="text-muted text-sm mt-1">
                Introduce tu clave para usar Google AI con tu propia cuenta.
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex flex-col gap-2 text-sm text-muted">
                Clave de API
                <input
                  type="text"
                  value={googleApiKeyDraft}
                  onChange={(event) => {
                    setGoogleApiKeyDraft(event.target.value);
                    setGoogleApiKeyMessage(null);
                  }}
                  placeholder="AIzaSy..."
                  autoComplete="off"
                  spellCheck={false}
                  className="rounded-xl border border-border bg-surface-800/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveGoogleApiKey}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-black transition-colors hover:opacity-90"
                >
                  <Save size={16} aria-hidden="true" />
                  Guardar clave
                </button>

                <button
                  type="button"
                  onClick={handleClearGoogleApiKey}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-border bg-surface-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-surface-700"
                >
                  <KeyRound size={16} aria-hidden="true" />
                  Eliminar clave
                </button>
              </div>

              {googleApiKeyMessage ? (
                <p className="text-sm text-green-300">{googleApiKeyMessage}</p>
              ) : null}

              {!googleApiKeyDraft && (
                <div className="mt-4 pt-4 border-t border-border/40 animate-fadeIn">
                  <ApiKeyTutorial />
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-900/70 p-6 backdrop-blur-xl shadow-(--shadow-primary-15-weak)">
            <div className="mb-3">
              <h3 className="text-white text-lg font-bold">
                Privacidad de datos
              </h3>
            </div>

            <ul className="list-disc pl-5 text-sm text-muted space-y-2">
              <li>
                Tus datos no se almacenan en ningun servidor externo: solo se
                guardan en este navegador (localStorage).
              </li>
              <li>
                Si cambias de navegador o de dispositivo, esos datos no estarán
                disponibles.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="mb-5">
              <h3 className="text-white text-lg font-bold">Zona de peligro</h3>
              <p className="text-muted text-sm mt-1">
                Elimina todos los datos guardados en localStorage.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearAllData}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20"
            >
              <Trash2 size={18} aria-hidden="true" />
              Eliminar todos los datos
            </button>

            {clearMessage ? (
              <p className="mt-3 text-sm text-green-300">{clearMessage}</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
