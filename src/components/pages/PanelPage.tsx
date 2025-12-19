import HeaderBar from "../HeaderBar";
import DayColumnCard from "../DayColumnCard";
import { schedule } from "../../data/schedule";

function PanelPage() {
  return (
    <div className="relative flex flex-col h-full">
      <HeaderBar
        weekLabel="Semana 4"
        phaseLabel="Hipertrofia Fase 2"
        title="Horario Semanal"
        statusLabel="Activo"
        showLayoutSwitch
        showRegenerate
      />

      <div
        className="flex-1 overflow-x-auto overflow-y-hidden p-8 scroll-smooth"
        id="kanban-container"
      >
        <div className="flex h-full gap-6 min-w-max pb-4">
          {schedule.map((day) => (
            <DayColumnCard key={day.name} day={day} />
          ))}
        </div>
      </div>

      <button
        className="absolute bottom-8 right-8 size-14 rounded-full bg-primary text-contrast shadow-[var(--shadow-primary-20-strong)] flex items-center justify-center hover:scale-110 transition-transform z-30"
        aria-label="Añadir rutina"
        type="button"
      >
        <span className="material-symbols-outlined text-[32px] icon-filled">
          add
        </span>
      </button>
    </div>
  );
}

export default PanelPage;
