import { useMemo, useState } from "react";
import HeaderBar from "../HeaderBar";
import DayColumnCard from "../DayColumnCard";
import { schedule } from "../../data/schedule";

const weekdayNames = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function PanelPage() {
  const defaultSelectedDay = useMemo(() => {
    const todayName = weekdayNames[new Date().getDay() - 1];
    return schedule.some((day) => day.name === todayName)
      ? todayName
      : schedule[0]?.name ?? "";
  }, []);

  const [selectedDay, setSelectedDay] = useState(defaultSelectedDay);
  const activeDay =
    schedule.find((day) => day.name === selectedDay) ?? schedule[0];

  return (
    <div className="relative flex flex-col h-full">
      <HeaderBar title="Horario Semanal" />

      <div className="flex-1 overflow-hidden p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 h-full">
          <aside className="flex flex-col gap-4 bg-surface-900/60 border border-border rounded-2xl p-5 h-full backdrop-blur-md shadow-(--shadow-primary-20-soft)">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                Días
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {schedule.map((day) => {
                const exerciseCount = day.exercises?.length ?? 0;
                const isActive = day.name === selectedDay;

                return (
                  <button
                    key={day.name}
                    type="button"
                    onClick={() => setSelectedDay(day.name)}
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
                      <span className="text-sm font-semibold">{day.name}</span>
                      <span className="text-[11px] uppercase tracking-wider text-muted/70">
                        {day.meta}
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

          <section className="flex flex-col gap-4 h-full overflow-y-auto">
            {activeDay ? (
              <DayColumnCard
                day={activeDay}
              />
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

export default PanelPage;
