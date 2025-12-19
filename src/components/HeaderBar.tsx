type HeaderBarProps = {
  title: string;
  weekLabel?: string;
  phaseLabel?: string;
  statusLabel?: string;
  showLayoutSwitch?: boolean;
  showRegenerate?: boolean;
};

function HeaderBar({
  title,
  weekLabel,
  phaseLabel,
  statusLabel,
  showLayoutSwitch = false,
  showRegenerate = false,
}: HeaderBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-900/80 backdrop-blur-md px-8 py-5 sticky top-0 z-10">
      <div className="flex flex-col gap-1">
        {(weekLabel || phaseLabel) && (
          <div className="flex items-center gap-3 text-muted text-sm font-medium">
            {weekLabel ? <span>{weekLabel}</span> : null}
            {weekLabel && phaseLabel ? (
              <span className="size-1 rounded-full bg-border" />
            ) : null}
            {phaseLabel ? <span>{phaseLabel}</span> : null}
          </div>
        )}
        <div className="flex items-center gap-4">
          <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">
            {title}
          </h2>
          {statusLabel ? (
            <div className="px-2 py-0.5 rounded-md border border-primary/30 bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase">
              {statusLabel}
            </div>
          ) : null}
        </div>
      </div>

      {(showLayoutSwitch || showRegenerate) && (
        <div className="flex items-center gap-4">
          {showLayoutSwitch ? (
            <div className="flex bg-surface-800 rounded-full p-1 border border-border">
              <button className="px-4 py-1.5 rounded-full bg-border text-white text-sm font-medium shadow-sm">
                Lista
              </button>
              <button className="px-4 py-1.5 rounded-full text-muted hover:text-white text-sm font-medium transition-colors">
                Calendario
              </button>
            </div>
          ) : null}
          {showRegenerate ? (
            <button className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-primary text-contrast text-sm font-bold hover:bg-white transition-colors shadow-[var(--shadow-primary-15-strong)]">
              <span className="material-symbols-outlined text-[20px]">
                autorenew
              </span>
              <span>Regenerar Plan</span>
            </button>
          ) : null}
        </div>
      )}
    </header>
  );
}

export default HeaderBar;
