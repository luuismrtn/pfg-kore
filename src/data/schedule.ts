import type { DayColumn } from "../types/schedule";

export const schedule: DayColumn[] = [
  {
    name: "Lunes",
    meta: "Empuje",
    exercises: [
      {
        title: "Press Inclinado",
        badges: [
          {
            label: "Pecho",
            className:
              "px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20",
          },
          {
            label: "Compuesto",
            className:
              "px-2 py-0.5 rounded-full bg-border text-muted text-[10px] font-bold uppercase",
          },
        ],
        stats: [
          { label: "Series", value: "4" },
          { label: "Reps", value: "8-12" },
        ],
      },
      {
        title: "Elevaciones Laterales",
        badges: [
          {
            label: "Hombros",
            className:
              "px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20",
          },
        ],
        stats: [
          { label: "Series", value: "3" },
          { label: "Reps", value: "12-15" },
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
        badges: [
          {
            label: "Espalda",
            className:
              "px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase border border-purple-500/20",
          },
          {
            label: "Pesado",
            className:
              "px-2 py-0.5 rounded-full bg-border text-muted text-[10px] font-bold uppercase",
          },
        ],
        stats: [
          { label: "Series", value: "3" },
          { label: "Reps", value: "6-8" },
        ],
      },
      {
        title: "Remo con Mancuernas",
        badges: [
          {
            label: "Espalda",
            className:
              "px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase border border-purple-500/20",
          },
        ],
        stats: [
          { label: "Series", value: "3" },
          { label: "Reps", value: "10-12" },
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
        badges: [
          {
            label: "Piernas",
            className:
              "px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase border border-red-500/20",
          },
          {
            label: "Compuesto",
            className:
              "px-2 py-0.5 rounded-full bg-border text-muted text-[10px] font-bold uppercase",
          },
        ],
        stats: [
          { label: "Series", value: "4" },
          { label: "Reps", value: "5-8" },
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
