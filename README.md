# Kore - Generador Inteligente de Rutinas Deportivas con IA y RAG

<div align="center">
  <img src="frontend/public/kore-v2.svg" alt="Kore Logo" width="80" height="80" style="border-radius: 20%;" />
  <p><em>Planificación deportiva inteligente impulsada por modelos generativos de Google Gemini y recuperación semántica RAG.</em></p>

  [![Vite](https://img.shields.io/badge/Vite-Rolldown-646CFF?logo=vite&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React-19.2-20232A?logo=react&logoColor=61DAFB)](#)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css&logoColor=white)](#)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](#)
  [![Docker](https://img.shields.io/badge/Docker-Compatible-2496ED?logo=docker&logoColor=white)](#)
</div>

---

## 📖 Descripción del Proyecto

**Kore (pfg-kore)** es una plataforma Web moderna para la generación y gestión personalizada de rutinas de entrenamiento físico. La aplicación utiliza un motor híbrido de inteligencia artificial que combina:

1. **Generación Aumentada por Recuperación (RAG)**: Búsqueda vectorial semántica sobre un corpus estructurado de ejercicios físicos para proveer contexto fiel a la IA, eliminando alucinaciones y garantizando rutinas técnicamente coherentes.
2. **Modelos Generativos Avanzados**: Integración directa con la API de Google GenAI (`gemini-3.5-flash`) para estructurar, adaptar y redactar las rutinas.
3. **Comprensión del Lenguaje Natural**: Interpretación de comandos y consultas mediante un servicio conversacional para permitir modificaciones fluidas de las rutinas generadas mediante un chat interactivo.

Este software ha sido diseñado como un **Proyecto de Fin de Grado (PFG)**, priorizando el desacoplamiento, la modularidad de sus componentes y la facilidad de despliegue mediante Docker.

---

## ✨ Características Principales

*   **Generador Paramétrico**: Personalización basada en modalidad deportiva (musculación, running, cardio funcional...), nivel, días semanales y equipamiento disponible.
*   **Asistente Conversacional**: Chat en vivo que permite editar rutinas al vuelo (ej: *"Cambia las sentadillas por prensa hoy"*, *"Añade un día de cardio"*, *"Regenera el día de empuje"*).
*   **Generador de PDFs**: Exportación instantánea de la rutina a documentos PDF limpios y profesionales utilizando `pdfkit`.
*   **UI Moderna e Interactiva**: Interfaz desarrollada con React 19, Tailwind CSS y componentes de alta calidad.
*   **Containerización Integrada**: Preparado para levantarse en cualquier sistema operativo en segundos con Docker Compose.

---

## 📂 Estructura del Repositorio

El proyecto sigue una arquitectura monorepo simplificada:

```text
pfg-kore/
├── backend/                # API en Node.js y Express + TypeScript
│   ├── src/
│   │   ├── controllers/    # Controladores para generación de rutinas, chat y PDF
│   │   ├── data/           # Base de datos de ejercicios
│   │   ├── routes/         # Endpoints REST expuestos (/api/routines)
│   │   ├── services/       # Clientes de IA y RAG
│   │   └── server.ts       # Punto de entrada de Express
│   ├── Dockerfile          # Dockerfile para entorno de producción backend
│   ├── .npmrc              # Configuración de npm para backend
│   ├── tsconfig.json       # Configuración de TypeScript para backend
│   └── package.json        # Dependencias del backend
├── frontend/               # Interfaz web en React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizables de UI
│   │   ├── features/       # Módulos funcionales (chat, routine, profile)
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── services/       # Servicios de la aplicación
│   │   ├── App.tsx         # Componente raíz de la aplicación
│   │   └── main.tsx        # Punto de entrada del frontend
│   ├── Dockerfile          # Dockerfile con Nginx para servir el frontend
│   ├── index.html          # HTML principal del frontend
│   ├── tailwind.config.ts  # Configuración de Tailwind CSS
│   ├── vite.config.ts      # Configuración de Vite
│   └── package.json        # Dependencias del frontend
├── api/                    # Funciones Serverless adaptadas para despliegue en Vercel
├── docker-compose.yml      # Configuración multi-contenedor para desarrollo/producción
└── .env.example            # Plantilla de variables de entorno para desarrollo local
```

---

## 🛠️ Instalación y Configuración Local

### 1. Prerrequisitos
Asegúrate de tener instalado en tu máquina:
*   [Node.js](https://nodejs.org/) (v20 o superior recomendado)
*   [Bun](https://bun.sh/) (opcional, para una instalación más rápida en el frontend)
*   [Docker](https://www.docker.com/) (opcional, para ejecución con contenedores)

### 2. Variables de Entorno
Copia la plantilla de variables de entorno en la raíz del proyecto y completa los campos necesarios:
```bash
cp .env.example .env
```

### 3. Instalación de Dependencias

*   **Instalar dependencias del Backend**:
    ```bash
    cd backend
    npm install
    cd ..
    ```
*   **Instalar dependencias del Frontend**:
    ```bash
    cd frontend
    bun install  # O bien: npm install
    cd ..
    ```

---

## 👌 Ejecutar la Aplicación

### Método A: Ejecución Local Directa (Desarrollo)

Puedes iniciar ambos servidores por separado para depurar y tener recarga rápida (HMR):

1.  **Iniciar Backend** (en una terminal):
    ```bash
    cd backend
    npm run dev
    ```
    El servidor escuchará en: `http://localhost:3000`

2.  **Iniciar Frontend** (en otra terminal):
    ```bash
    cd frontend
    bun run dev  # O bien: npm run dev
    ```
    La aplicación web se abrirá en: `http://localhost:5173`

---

### Método B: Ejecución con Docker Compose (Recomendado)

Si deseas probar la aplicación de forma unificada tal y como correría en producción:

```bash
docker-compose up --build
```

Esto compilará y levantará:
*   **Frontend**: Accesible en `http://localhost:8080` (servido eficientemente con Nginx).
*   **Backend**: Accesible en `http://localhost:3000`.

Para detener los servicios:
```bash
docker-compose down
```

---

## 🔗 Resumen de la API de Rutinas

El backend expone las siguientes rutas bajo `/api/routines`:

| Endpoint | Método | Descripción |
| :--- | :--- | :--- |
| `/modalidades` | `GET` | Obtiene las modalidades de entrenamiento soportadas. |
| `/ai-models` | `GET` | Lista los modelos generativos de Google Gemini disponibles. |
| `/generate` | `POST` | Genera una rutina completa según parámetros del usuario. |
| `/change-day` | `POST` | Cambia de día una sesión de entrenamiento completa. |
| `/cambiar-ejercicio-rutina` | `POST` | Intercambia un ejercicio específico por una alternativa válida. |
| `/add-day` | `POST` | Incorpora un nuevo día de entrenamiento a una rutina existente. |
| `/chat-intent` | `POST` | Procesa y clasifica intenciones de chat para modificar la rutina. |
| `/export-pdf` | `POST` | Exporta e inicia la descarga en PDF de la rutina especificada. |

---

## 🤝 Contribuciones y Comunidad

Si deseas colaborar con el proyecto, corregir errores o añadir nuevas funcionalidades:

1.  Lee nuestra [Guía de Contribución](CONTRIBUTING.md) para conocer las convenciones de código y Git.
2.  Asegúrate de cumplir nuestro [Código de Conducta](CODE_OF_CONDUCT.md).
3.  Utiliza las plantillas de GitHub provistas para abrir cualquier Issue o Pull Request.

---

## 📄 Licencia

Por favor, consulta la licencia en el archivo `LICENSE`.
