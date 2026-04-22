import { RagService } from "@backend/services/ragService";

const DEFAULT_INSTANCE_KEY = "__default__";
const ragServiceInstances = new Map<string, RagService>();

function resolveInstanceKey(apiKey?: string): string {
  const normalizedApiKey = apiKey?.trim();
  return normalizedApiKey ? normalizedApiKey : DEFAULT_INSTANCE_KEY;
}

export function getRagService(apiKey?: string): RagService {
  const instanceKey = resolveInstanceKey(apiKey);
  const existingInstance = ragServiceInstances.get(instanceKey);

  if (existingInstance) {
    return existingInstance;
  }

  const nextInstance = new RagService(apiKey);
  ragServiceInstances.set(instanceKey, nextInstance);
  return nextInstance;
}
