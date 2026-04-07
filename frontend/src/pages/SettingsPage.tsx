import { Moon, Sun, Trash2 } from "lucide-react";
import { useState } from "react";
import HeaderBar from "@/components/layout/HeaderBar";

const THEME_STORAGE_KEY = "kore.theme.v1";

type ThemeMode = "dark" | "light";

function readStoredTheme(): ThemeMode {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);
  const [clearMessage, setClearMessage] = useState<string | null>(null);

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
    setClearMessage("Datos eliminados correctamente.");
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
