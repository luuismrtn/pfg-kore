import { type FormEvent, useState } from "react";
import { KeyRound, Save } from "lucide-react";
import {
  getStoredGoogleApiKey,
  setStoredGoogleApiKey,
} from "@/services/api/routines";
import ApiKeyTutorial from "./ApiKeyTutorial";

type ApiKeySetupCardProps = {
  title: string;
  description: string;
  onSaved: (apiKey: string) => void;
};

function ApiKeySetupCard({
  title,
  description,
  onSaved,
}: ApiKeySetupCardProps) {
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStoredGoogleApiKey(apiKeyDraft);
    const storedApiKey = getStoredGoogleApiKey();

    if (!storedApiKey) {
      setFeedbackMessage("Introduce una Google API Key válida para continuar.");
      return;
    }

    setApiKeyDraft(storedApiKey);
    setFeedbackMessage("Google API Key guardada correctamente.");
    onSaved(storedApiKey);
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-surface-900/70 p-6 backdrop-blur-xl shadow-(--shadow-primary-15-weak)">
      <div className="mb-5">
        <h2 className="text-white text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col gap-2 text-sm text-muted">
          Google API Key
          <input
            type="text"
            value={apiKeyDraft}
            onChange={(event) => {
              setApiKeyDraft(event.target.value);
              setFeedbackMessage(null);
            }}
            placeholder="AIzaSy..."
            autoComplete="off"
            spellCheck={false}
            className="rounded-xl border border-border bg-surface-800/80 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </label>

        <button
          type="submit"
          disabled={!apiKeyDraft.trim()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-black transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} aria-hidden="true" />
          Guardar y continuar
        </button>

        {feedbackMessage ? (
          <p className="text-sm text-green-300">
            <KeyRound className="mr-1 inline" size={14} aria-hidden="true" />
            {feedbackMessage}
          </p>
        ) : null}
      </form>

      <div className="mt-6 border-t border-border/60 pt-5">
        <ApiKeyTutorial />
      </div>
    </div>
  );
}

export default ApiKeySetupCard;
