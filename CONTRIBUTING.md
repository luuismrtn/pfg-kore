# Guía de Contribución a pfg-kore

¡Muchas gracias por tu interés en contribuir a **pfg-kore**! Este proyecto es un sistema inteligente de generación y planificación de rutinas deportivas asistido por IA (Google Gemini) y RAG.

Para mantener la calidad del código y asegurar una colaboración fluida, te pedimos que sigas las siguientes directrices.

---

## 📋 Tabla de Contenidos
1. [Código de Conducta](#-código-de-conducta)
2. [¿Cómo puedo contribuir?](#-cómo-puedo-contribuir)
   - [Reportar Errores (Bugs)](#reportar-errores-bugs)
   - [Proponer Nuevas Funcionalidades](#proponer-nuevas-funcionalidades)
   - [Enviar Cambios de Código (Pull Requests)](#enviar-cambios-de-código-pull-requests)
3. [Flujo de Desarrollo Local](#-flujo-de-desarrollo-local)
   - [Prerrequisitos](#prerrequisitos)
   - [Instalación y Configuración](#instalación-y-configuración)
   - [Ejecutar en Desarrollo](#ejecutar-en-desarrollo)
   - [Uso de Docker Compose](#uso-de-docker-compose)
4. [Convenciones de Código y Estilo](#-convenciones-de-código-y-estilo)
   - [Git y Ramas](#git-y-ramas)
   - [Mensajes de Commit](#mensajes-de-commit)
   - [Linting y Formateo](#linting-y-formateo)

---

## Código de Conducta

Al participar en este proyecto, te comprometes a seguir nuestro [Código de Conducta](CODE_OF_CONDUCT.md) para garantizar un entorno respetuoso y acogedor para todos.

---

## ¿Cómo puedo contribuir?

### Reportar Errores (Bugs)
Si encuentras un error, abre una incidencia (Issue) en GitHub utilizando nuestra plantilla de **Reporte de Fallos**. Por favor, incluye:
- Una descripción clara y concisa del problema.
- Pasos detallados para reproducir el fallo.
- Comportamiento esperado vs. comportamiento real.
- Capturas de pantalla o fragmentos de logs si es aplicable.

### Proponer Nuevas Funcionalidades
¡Las sugerencias de nuevas características son bienvenidas! Abre una incidencia utilizando la plantilla de **Propuesta de Características** detallando:
- El objetivo o caso de uso de la nueva funcionalidad.
- Una propuesta de cómo debería interactuar el usuario o cómo debería estructurarse.
- Cualquier alternativa que hayas considerado.

### Enviar Cambios de Código (Pull Requests)
1. Haz un **Fork** de este repositorio.
2. Crea una rama para tus cambios a partir de la rama principal (`main`).
3. Realiza tus modificaciones respetando las guías de estilo.
4. Asegúrate de que el código compila y pasa el linter (`npm run lint`).
5. Abre un **Pull Request** apuntando a la rama `main` del repositorio original, utilizando la plantilla de Pull Request provista.

---

## Flujo de Desarrollo Local

### Prerrequisitos
- **Node.js** (versión 20 o superior recomendado)
- **Bun** (opcional, el frontend utiliza un archivo `bun.lock` por defecto para optimizar dependencias, pero puedes utilizar `npm` también).
- **Docker** y **Docker Compose** (opcional, para levantar toda la arquitectura de manera unificada).

### Instalación y Configuración
1. Clona el repositorio:
   ```bash
   git clone https://github.com/luuismrtn/pfg-kore.git
   cd pfg-kore
   ```

2. Configura las variables de entorno. Copia el archivo `.env.example` como `.env` en la raíz del proyecto y completa las claves necesarias (ej. `GOOGLE_API_KEY`, `LUIS_API_KEY`):
   ```bash
   cp .env.example .env
   ```

3. Instala las dependencias de ambos servicios:
   - **Backend**:
     ```bash
     cd backend
     npm install
     cd ..
     ```
   - **Frontend**:
     ```bash
     cd frontend
     bun install  # O alternativamente: npm install
     cd ..
     ```

### Ejecutar en Desarrollo

Puedes ejecutar el frontend y el backend de forma independiente en terminales separadas:

- **Iniciar Backend**:
  ```bash
  cd backend
  npm run dev
  ```
  El servidor backend estará disponible en `http://localhost:3000`.

- **Iniciar Frontend**:
  ```bash
  cd frontend
  bun run dev  # O alternativamente: npm run dev
  ```
  La aplicación web estará disponible en `http://localhost:5173` (o el puerto indicado por Vite).

### Uso de Docker Compose
Para simplificar la ejecución local de todo el sistema de una sola vez, puedes utilizar Docker Compose:
```bash
docker-compose up --build
```
Esto levantará:
- El backend en `http://localhost:3000`.
- El frontend (servido mediante Nginx) en `http://localhost:8080`.

---

## Convenciones de Código y Estilo

### Git y Ramas
Utiliza nombres descriptivos en inglés o español para tus ramas:
- `feat/nombre-de-la-funcionalidad` para nuevas características.
- `fix/nombre-del-bug` para correcciones de errores.
- `docs/nombre-del-documento` para cambios en la documentación.
- `refactor/nombre-del-cambio` para reestructuraciones de código sin cambios funcionales.

### Mensajes de Commit
Recomendamos seguir las convenciones de **Commits Semánticos** (`Conventional Commits`):
- `feat: agregar exportación de PDF de rutinas`
- `fix: solucionar desalineación en el chat en pantallas móviles`
- `docs: actualizar instrucciones de instalación en README`
- `style: formatear archivos con prettier`

### Linting y Formateo
- El código TypeScript debe compilar sin errores en modo estricto.
- Asegúrate de ejecutar el linter antes de realizar el commit:
  ```bash
  # En frontend
  npm run lint
  ```
- No dejes console logs innecesarios (`console.log`) en código de producción, salvo logs estructurados o de depuración necesarios en el backend.
