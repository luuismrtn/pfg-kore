import type { DayColumn } from "../types/schedule";

export const schedule: DayColumn[] = [
  {
    name: "Lunes",
    meta: "Empuje",
    exercises: [
      {
        title: "Press Inclinado",
        badges: ["Pecho", "Compuesto"],
        stats: [
          { label: "Series", value: "4" },
          { label: "Reps", value: "12" },
        ],
      },
      {
        title: "Elevaciones Laterales",
        badges: ["Hombros"],
        stats: [
          { label: "Series", value: "3" },
          { label: "Reps", value: "15" },
        ],
      },
    ],
  },
  {
    name: "Martes",
    meta: "Tracción",
    exercises: [
      {
        title: "Dominadas con Lastre",
        badges: ["Espalda", "Pesado"],
        stats: [
          { label: "Series", value: "3" },
          { label: "Reps", value: "8" },
        ],
      },
      {
        title: "Remo con Mancuernas",
        badges: ["Espalda"],
        stats: [
          { label: "Series", value: "3" },
          { label: "Reps", value: "12" },
        ],
      },
    ],
  },
  {
    name: "Miércoles",
    meta: "Recuperación Activa",
    variant: "muted",
    rest: true,
  },
  {
    name: "Jueves",
    meta: "Piernas",
    exercises: [
      {
        title: "Sentadilla con Barra",
        badges: ["Piernas", "Compuesto"],
        stats: [
          { label: "Series", value: "4" },
          { label: "Reps", value: "8" },
        ],
      },
    ],
  },
  {
    name: "Viernes",
    meta: "Brazos y Abs",
    exercises: [],
  },
  {
    name: "Sábado",
    meta: "Libre",
    exercises: [],
  },
  {
    name: "Domingo",
    meta: "Libre",
    exercises: [],
  },
];
