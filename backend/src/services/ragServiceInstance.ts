import { RagService } from "@backend/services/ragService";

let ragServiceInstance: RagService | null = null;

export function getRagService(): RagService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RagService();
  }

  return ragServiceInstance;
}