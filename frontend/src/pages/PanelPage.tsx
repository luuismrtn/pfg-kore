import { useState } from "react";
import HeaderBar from "@/components/layout/HeaderBar";
import DayColumnCard from "@/components/schedule/DayColumnCard";
import type { DiaRutina, RutinaResponse } from "@/types/chat";
import { generateRutina } from "@/services/api/rutinasApi";

const ROUTINE_STORAGE_KEY = "pfg-kore:chat:rutina";

function isRutinaResponse(value: unknown): value is RutinaResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const maybeRutina = value as Partial<RutinaResponse>;
  return Array.isArray(maybeRutina.rutina);
}

function readPanelSchedule(): DiaRutina[] {
  const raw = localStorage.getItem(ROUTINE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRutinaResponse(parsed)) {
      return [];
    }

    return parsed.rutina.length > 0 ? parsed.rutina : [];
  } catch {
    return [];
  }
}

function PanelPage() {
  const [panelSchedule, setPanelSchedule] = useState<DiaRutina[]>(() =>
    readPanelSchedule(),
  );

  const [isLoading, setIsLoading] = useState(false);

  const [selectedDay, setSelectedDay] = useState("");
  const activeDay =
    panelSchedule.find((day) => day.dia === selectedDay) ?? panelSchedule[0];

  return (
    <div className="relative flex flex-col h-full">
      <HeaderBar title="Horario Semanal" />

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
              aquí.
            </p>
            <p className="text-muted text-sm max-w-md">
              O haz click en este botón.
            </p>
            <button
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-contrast cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const rutina = await generateRutina("");
                  localStorage.setItem(
                    ROUTINE_STORAGE_KEY,
                    JSON.stringify(rutina),
                  );
                  setPanelSchedule(rutina.rutina);
                  setSelectedDay(rutina.rutina[0]?.dia ?? "");
                } catch (err) {
                  console.error("Error generando rutina:", err);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              aria-busy={isLoading}
            >
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
                    const exerciseCount = day.ejercicios?.length ?? 0;
                    const isActive = day.dia === selectedDay;

                    return (
                      <button
                        key={day.dia}
                        type="button"
                        onClick={() => setSelectedDay(day.dia)}
                        className={`group relative flex items-center justify-between gap-3 cursor-pointer rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                          isActive
                            ? "border-primary/60 bg-primary/10 text-white shadow-(--shadow-primary-20-soft)"
                            : "border-border bg-surface-800/40 text-muted hover:text-white hover:border-primary/40 hover:bg-surface-800/70"
                        }`}
                        aria-pressed={isActive}
                      >
                        <span
                          className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full transition-all ${
                            isActive ? "bg-primary" : "bg-transparent"
                          }`}
                          aria-hidden="true"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {day.dia}
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
                    dia={activeDay.dia}
                    ejercicios={activeDay.ejercicios}
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
