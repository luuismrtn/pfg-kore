import type { DayColumn } from "../types/schedule";

export const schedule: DayColumn[] = [
  {
    name: "Lunes",
    meta: "Empuje A • 4 Ejercicios",
    exercises: [
      {
        title: "Press Inclinado",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBPEtNdB4GfwazCXW5PInCfA7FmolcwJSKTiarq_8idUpP9CD8eIJxw0qs5YRDH2KMyOeRv1GdRcB3H-DDk5Mkss4S9QUTgCFsFpXJYhJFKX8bcXH9I7URpGn5U1JYXhfxzzuWZiHf2LQu4WBHyYYPvOgXZGVn0wx7YGTSQCEY2w-TMbRTpOJHenY5yOlnWZtjj2Qpb79o_RAzgzXr7I7hmMxJc0MEdxR0Y4_2W77A2AAd3dvfH363YUVhsblY8nFnf12LYeRcWzwo",
        alt: "Hombre haciendo press inclinado con mancuernas",
        tag: "GIF",
        badges: [
          {
            label: "Pecho",
            className:
              "px-2 py-0.5 rounded-full bg-[#2bee79]/10 text-[#2bee79] text-[10px] font-bold uppercase border border-[#2bee79]/20",
          },
          {
            label: "Compuesto",
            className:
              "px-2 py-0.5 rounded-full bg-[#28392f] text-[#9db9a8] text-[10px] font-bold uppercase",
          },
        ],
        stats: [
          { label: "Series", value: "4" },
          { label: "Reps", value: "8-12" },
        ],
      },
      {
        title: "Elevaciones Laterales",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBgSdauk4dEGSYR9QcFrYI8UmlrXp1M5DCoCBy2IGxPsc66Ytx9dZl41ZfT_smKa4RXIzLNtiwY7s8bMNZyTI1r5AZASQ-_NK-kQcvjFwo_sxqqPGkuG8NgUHaIJvsvbtq9HEsTtj76Xfws2jf5bbClL4HLp2tZhUmF7xaoYcNoHb5p0Xhe5wHB2fSMe7jfViP0ac_NY4C6qXS3-Vhxm-9kBOQxDGddP-y8LQ1sXnurwyLaujGQJao_Cf7-0w8oojKuvwfMsJHL6fg",
        alt: "Primer plano de elevaciones laterales con mancuernas",
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
    meta: "Tracción A • 3 Ejercicios",
    exercises: [
      {
        title: "Dominadas con Lastre",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBKalv4Z9pyxrwf4t2TjoevTKrwk0C4xogLM0mEDW6CB74MvJgLZ42Z5ZdfYfoJexx8HQ1e1Q-jhgUOUVP9yW5BH3nsFxS_TgZ-UgzryVDr9K_gECpjzcv0HJVU2A4Ng3kq196Zkr_v70Iiphr09l08mC7J6EMdp55kR8V9mYppWqiNZ0N3EQos1aSAseKPmKRwYmTNGq5tklTQb4MXjNsdyM0nYOH9L0YnDywuKCGHkAzFjsSFai9NaamIsyGtlBbDg1wOzR1ydkQ",
        alt: "Persona haciendo dominadas",
        badges: [
          {
            label: "Espalda",
            className:
              "px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase border border-purple-500/20",
          },
          {
            label: "Pesado",
            className:
              "px-2 py-0.5 rounded-full bg-[#28392f] text-[#9db9a8] text-[10px] font-bold uppercase",
          },
        ],
        stats: [
          { label: "Series", value: "3" },
          { label: "Reps", value: "6-8" },
        ],
      },
      {
        title: "Remo con Mancuernas",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBp3Y66zVIcR3Kr48YpzYiQUjll0rN0zM-_np4ge_GUAcfIweQ1OiAnpd4gSavkq0keRM3pZnuUHZpVMMMYZ8xBI81GKopJA-UNZQ-tMBWYpZ_k9A5YWBqAAuesCZsWjDI9XojBmDRCLGX8o5WR4dAs2Q3jgUKcQsO-D1qpz6vAj7I78G6PTGaXFoo6DZhRRZEPs-vb5h4zdDSLCwm81BRfbxlbeSWw-j1zfHIXSVO8TuZAc5fI0PifzVwWUjdWXcC6D47ghzNxT2g",
        alt: "Ejercicio de remo con mancuernas",
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
    meta: "Piernas • 5 Ejercicios",
    exercises: [
      {
        title: "Sentadilla con Barra",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB5uSQkXPRLr4HpL_Lf3jMCuIW6S2mkQ66dMxgEpQjuUDzNso0_Qpb_RTpqcsCulv1PGmi1uwZw_zM1SCbWjFPxq_8c2zPZyhAYqn3gOeYxiQT95AjdCjsrPrjh3mq5nv9vht-v3iWvbAdxhSmeKK6JPjaFS9MV5Ev-zEO8clzrVvG_IBc3b-vfZ067h4hkekZhu1UameodFU2upm8ItkFxkSzcRsj-49CQ3X63OLQUozXotUApESywUUx4tnjD8RmOZvDRY2kmhDw",
        alt: "Ejercicio de sentadilla con barra",
        tag: "GIF",
        badges: [
          {
            label: "Piernas",
            className:
              "px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase border border-red-500/20",
          },
          {
            label: "Compuesto",
            className:
              "px-2 py-0.5 rounded-full bg-[#28392f] text-[#9db9a8] text-[10px] font-bold uppercase",
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
    summary: true,
  },
];
