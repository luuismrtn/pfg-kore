import { useState } from "react";
import {
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Key,
  FolderPlus,
  Layers,
} from "lucide-react";

export function ApiKeyTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const steps = [
    {
      num: 1,
      title: "Acceder a Google AI Studio",
      icon: <ExternalLink className="size-4 text-primary" />,
      desc: (
        <>
          Entra en{" "}
          <a
            href="https://aistudio.google.com/app/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 hover:opacity-85 transition-opacity"
          >
            Google AI Studio
            <ExternalLink className="size-3 inline" />
          </a>{" "}
          e inicia sesión con tu cuenta de Google. Este servicio es totalmente
          gratuito.
        </>
      ),
    },
    {
      num: 2,
      title: "Crear clave de API",
      icon: <Key className="size-4 text-primary" />,
      desc: 'Haz clic en el botón que dice "Create API Key" (Crear clave de API) situado en la parte superior derecha de la pantalla.',
    },
    {
      num: 3,
      title: "Seleccionar o crear un proyecto",
      icon: <Layers className="size-4 text-primary" />,
      desc: 'Se abrirá una ventana emergente. Si tienes un proyecto existente de Google Cloud, selecciónalo. Si no, haz clic en la opción "Create API key in new project" (Crear clave de API en un nuevo proyecto).',
    },
    {
      num: 4,
      title: "Configurar el nuevo proyecto",
      icon: <FolderPlus className="size-4 text-primary" />,
      desc: 'Si has elegido la opción de crear un nuevo proyecto, dale un nombre identificativo para tus rutinas (por ejemplo: "Kore Routines") y haz clic en "Create project".',
    },
    {
      num: 5,
      title: "Copiar tu clave de API",
      icon: <Key className="size-4 text-primary" />,
      desc: (
        <div className="space-y-2">
          <p>
            Una vez creado y seleccionado el proyecto en la lista, pulsa de
            nuevo en <strong>"Create API Key"</strong>. Copia el código largo
            generado.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-surface-900 border border-border p-2 mt-1 text-xs">
            <span className="text-muted">Formato esperado:</span>
            <code className="font-mono text-primary font-bold">AIzaSy...</code>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full rounded-xl border border-border bg-surface-850/60 p-4 transition-all duration-300 hover:border-primary/20">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 text-left font-semibold text-white focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="size-5 text-primary" />
          <div>
            <h4 className="text-sm font-bold">
              ¿Cómo obtener una Google API Key gratuita?
            </h4>
            <p className="text-xs text-muted font-normal">
              Sigue estos 5 pasos para crear tu clave
            </p>
          </div>
        </div>
        <div className="text-muted hover:text-white transition-colors">
          {isOpen ? (
            <ChevronUp className="size-5" />
          ) : (
            <ChevronDown className="size-5" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="mt-5 space-y-4 border-t border-border/60 pt-4">
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="group flex gap-4 rounded-xl border border-border/40 bg-surface-900/40 p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-surface-900/80"
              >
                <div className="flex flex-col items-center">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/20">
                    {step.num}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                      Paso {step.num}
                    </span>
                    <span className="size-1 rounded-full bg-border" />
                    <h5 className="text-sm font-bold text-white group-hover:text-primary transition-colors duration-200">
                      {step.title}
                    </h5>
                  </div>
                  <div className="text-xs text-muted leading-relaxed">
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs text-muted flex items-start gap-2.5">
            <span className="text-primary font-bold">Nota:</span>
            <p className="leading-relaxed">
              Google AI Studio ofrece una cuota gratuita bastante generosa para
              uso personal de sus modelos Gemini. No necesitas vincular tarjeta
              de crédito para usar la API en la aplicación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiKeyTutorial;
