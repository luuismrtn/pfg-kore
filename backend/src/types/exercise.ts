export interface FilteredExercise {
  id: string;
  name: string;
  modalidad?: string;
  muscleGroup: string;
  mechanicType: string;
  movementPattern: string;
}

export interface ExerciseRecord {
  id: string;
  nombre: string;
  modalidad?: string;
  nivel_dificultad?: string;
  equipamiento?: string[];
  lesiones_prohibidas?: string[];
  atributos_especificos?: {
    grupo_muscular?: string;
    tipo_mecanica?: string;
    patron_movimiento?: string;
  };
}
