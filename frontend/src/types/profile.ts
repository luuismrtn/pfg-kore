export type UserProfileForm = {
  name: string;
  weightKg: number | "";
  heightCm: number | "";
  sport: string;
  injuries: string[];
  availableDays: number;
  averageDurationMinutes: number;
  equipment: string[];
};
