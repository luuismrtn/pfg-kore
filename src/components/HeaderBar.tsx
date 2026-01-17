type HeaderBarProps = {
  title: string;
  weekLabel?: string;
  phaseLabel?: string;
  statusLabel?: string;
  showLayoutSwitch?: boolean;
  showRegenerate?: boolean;
};

function HeaderBar({ title }: HeaderBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-900/80 backdrop-blur-md px-8 py-5 sticky top-0 z-10">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <h2 className="text-white text-2xl font-bold leading-tight tracking-tight">
            {title}
          </h2>
        </div>
      </div>
    </header>
  );
}

export default HeaderBar;
