export type UserGender = "mujer" | "hombre" | "otro" | "prefiero no decirlo";

export type UserProfileForm = {
  name: string;
  weightKg: number | "";
  heightCm: number | "";
  age: number | "";
  gender: UserGender;
  sport: string;
  injuries: string[];
  availableDays: number;
  averageDurationMinutes: number;
  equipment: string[];
  level: string;
};
