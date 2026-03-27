type NotFoundPageProps = {
  onGoHome: () => void;
};

function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  return (
    <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-12 h-64 w-64 rounded-full bg-emerald-200/8 blur-3xl" />

      <section className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-surface-900/75 p-8 shadow-(--shadow-primary-20-soft) backdrop-blur-xl md:p-12">
        <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 select-none text-[8rem] leading-none font-black tracking-tight text-primary/10 md:text-[10rem]">
          404
        </div>

        <div className="relative text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Error de navegación
          </p>
          <h1 className="mt-20 text-4xl font-black text-white md:text-6xl">
            Esta página no existe
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted md:text-base">
            La ruta que intentaste abrir no corresponde a ninguna sección de la
            aplicación.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-contrast transition hover:-translate-y-0.5 hover:brightness-105 cursor-pointer"
          >
            Ir al panel
          </button>
        </div>
      </section>
    </div>
  );
}

export default NotFoundPage;
