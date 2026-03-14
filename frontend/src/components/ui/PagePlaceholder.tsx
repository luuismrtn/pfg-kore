type PagePlaceholderProps = {
  title: string;
  description?: string;
  icon?: string;
};

function PagePlaceholder({
  title,
  description,
  icon = "hourglass_empty",
}: PagePlaceholderProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center size-14 rounded-full bg-surface-800 text-muted border border-border">
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <h3 className="text-white text-xl font-bold">{title}</h3>
        {description ? (
          <p className="text-muted text-sm max-w-md mx-auto">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export default PagePlaceholder;
