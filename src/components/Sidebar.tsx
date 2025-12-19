type NavItem = {
  key: string;
  label: string;
  icon: string;
};

type SidebarProps = {
  activeKey: string;
  onSelect: (key: string) => void;
};

const navItems: NavItem[] = [
  { key: "chat", label: "Chat IA", icon: "smart_toy" },
  { key: "panel", label: "Panel", icon: "dashboard" },
  { key: "analytics", label: "Analíticas", icon: "analytics" },
];

function Sidebar({ activeKey, onSelect }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-72 bg-surface-900 border-r border-border h-full shrink-0 z-20">
      <div className="p-6 flex items-center gap-3 mb-6">
        <div
          className="bg-center bg-no-repeat bg-cover rounded-full size-10 border border-border"
          aria-label="Logo de Kore IA"
          style={{
            backgroundImage: "url('/kore.svg')",
          }}
        />
        <div className="flex flex-col">
          <h1 className="text-white text-xl font-bold leading-tight tracking-tight">
            Kore
          </h1>
          <p className="text-muted text-xs font-medium tracking-wide uppercase">
            Kore IA V0.0
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 px-4 flex-1">
        {navItems.map((item) => {
          const isActive = item.key === activeKey;
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
              <span
                className={`material-symbols-outlined ${
                  isActive ? "icon-filled" : ""
                }`}
              >
                {item.icon}
              </span>
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
          <span
            className={`material-symbols-outlined ${
              activeKey === "settings" ? "icon-filled" : ""
            }`}
          >
            settings
          </span>
          <p className="text-sm font-medium">Ajustes</p>
        </button>

        <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 px-2">
          <div
            className="bg-center bg-no-repeat bg-cover rounded-full size-10 border border-primary/30"
            aria-label="Foto de perfil de usuario"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4I-Xucv9nuvU4hwL6SIZa2zLHGDRFMEaf1hZzU271pz65Bjgy7a-VPAgI8OHMsF5k0bpWTTyt2nlfEiQsPSFDksdrOfPBoCl-Uhhs2hS_AbSM_ZS_F6ZJIxnwzoeEtrn1YhrRPQ597wqu8iQvKxpyr84cM6hCsnO_ZiV1yySJebTu4CpF2LrF4m_nZPr9zazcy3Trvcy8HqITto5WJlU7YR-7VSSVtsLMZfPj9P0LQGDueuFYUciekHBUSru9Ra9wCiBF0CzZkNo')",
            }}
          />
          <div className="flex flex-col">
            <p className="text-white text-sm font-bold">Invitado</p>
            <p className="text-muted text-xs">Acceso limitado</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
