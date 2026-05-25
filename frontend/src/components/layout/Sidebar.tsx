import type { PageKey } from "@/features/navigation/types";
import {
  Bot,
  LayoutDashboard,
  Settings,
  type LucideIcon,
  UserPen,
} from "lucide-react";

type NavItem = {
  key: PageKey;
  label: string;
  icon: LucideIcon;
};

type SidebarProps = {
  activeKey: PageKey;
  onSelect: (key: PageKey) => void;
};

const navItems: NavItem[] = [
  { key: "profile", label: "Perfil", icon: UserPen },
  { key: "chat", label: "Chat IA", icon: Bot },
  { key: "routine", label: "Rutina", icon: LayoutDashboard },
];

function Sidebar({ activeKey, onSelect }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-72 bg-surface-900 border-r border-border h-full shrink-0 z-20">
      <div className="p-6 flex items-center gap-3 mb-6">
        <div
          className="bg-center bg-no-repeat bg-cover rounded-full size-10 border border-border"
          aria-label="Logo de Kore IA"
          style={{
            backgroundImage: "url('/kore-v2.svg')",
          }}
        />
        <div className="flex flex-col">
          <h1 className="text-white text-xl font-bold leading-tight tracking-tight">
            Kore
          </h1>
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            Kore IA V1.0
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 px-4 flex-1">
        {navItems.map((item) => {
          const isActive = item.key === activeKey;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left cursor-pointer border ${
                isActive
                  ? "bg-primary/10 text-primary border-primary/20 shadow-(--shadow-primary-15-weak)"
                  : "text-muted hover:bg-surface-800 hover:text-white border-transparent"
              }`}
              type="button"
            >
              <Icon
                className={isActive ? "text-primary" : "text-current"}
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />
              <div className="flex items-center justify_between w-full">
                <p
                  className={`text-sm ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {item.label}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button
          className={`flex items-center gap-4 px-4 py-3 cursor-pointer rounded-xl w-full text-muted hover:bg-surface-800 hover:text-white transition-colors ${
            activeKey === "settings"
              ? "bg-primary/10 text-primary border border-primary/20 shadow-(--shadow-primary-15-weak)"
              : "border border-transparent"
          }`}
          onClick={() => onSelect("settings")}
          type="button"
        >
          <Settings
            className={
              activeKey === "settings" ? "text-primary" : "text-current"
            }
            size={20}
            strokeWidth={2}
            aria-hidden="true"
          />
          <p className="text-sm font-medium">Ajustes</p>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
