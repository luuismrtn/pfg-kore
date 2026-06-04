import { useEffect, useState, useSyncExternalStore, type JSX } from "react";
import { Toaster } from "sileo";
import "./App.css";
import Sidebar from "@/components/layout/Sidebar";
import RoutinePage from "@/pages/RoutinePage";
import ChatPage from "@/pages/ChatPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import type { PageKey } from "@/features/navigation/types";

const THEME_STORAGE_KEY = "kore.theme.v1";

type ThemeMode = "dark" | "light";

const pageRoutes: Record<PageKey, string> = {
  profile: "/profile",
  routine: "/rutina",
  chat: "/chat",
  settings: "/settings",
};

function readStoredTheme(): ThemeMode {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function resolvePageFromPath(pathname: string): PageKey | null {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (normalizedPath === "/") {
    return "profile";
  }

  const matched = (Object.entries(pageRoutes) as Array<[PageKey, string]>).find(
    ([, route]) => route === normalizedPath,
  );

  return matched?.[0] ?? null;
}

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("popstate", callback);
  };
}

function getSnapshot(): PageKey | null {
  return resolvePageFromPath(window.location.pathname);
}

interface ActivePageContentProps {
  activePage: PageKey;
}

function ActivePageContent({ activePage }: ActivePageContentProps) {
  switch (activePage) {
    case "profile":
      return <ProfilePage />;
    case "routine":
      return <RoutinePage />;
    case "chat":
      return <ChatPage />;
    case "settings":
      return <SettingsPage />;
    default:
      return null;
  }
}

function App() {
  const activePage = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(() => {
    const initialTheme = readStoredTheme();
    localStorage.setItem(THEME_STORAGE_KEY, initialTheme);
    applyTheme(initialTheme);
  }, []);

  const handleSelectPage = (key: PageKey) => {
    const targetRoute = pageRoutes[key];
    if (window.location.pathname !== targetRoute) {
      window.history.pushState({}, "", targetRoute);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  if (!activePage) {
    return (
      <>
        <Toaster
          position="top-center"
          options={{
            autopilot: false,
            fill: readStoredTheme() === "light" ? "white" : "black",
          }}
        />
        <div className="bg-canvas dark:bg-deep font-display text-contrast overflow-hidden selection:bg-primary selection:text-contrast">
          <div className="flex h-screen w-full">
            <main className="flex-1 flex flex-col h-full bg-canvas dark:bg-deep relative overflow-hidden">
              <div className="absolute top-0 right-0 size-125 bg-primary/4 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 size-125 bg-border/6 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

              <NotFoundPage onGoHome={() => handleSelectPage("routine")} />
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        options={{
          autopilot: false,
          fill: readStoredTheme() === "light" ? "white" : "black",
          styles: {
            description: "text-center!"
          },
        }}
      />
      <div className="bg-canvas dark:bg-deep font-display text-contrast overflow-hidden selection:bg-primary selection:text-contrast">
        <div className="flex h-screen w-full">
          <Sidebar activeKey={activePage} onSelect={handleSelectPage} />

          <main className="flex-1 flex flex-col h-full bg-canvas dark:bg-deep relative overflow-hidden">
            <div className="absolute top-0 right-0 size-125 bg-primary/4 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 size-125 bg-border/6 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

            <ActivePageContent activePage={activePage} />
          </main>
        </div>
      </div>
    </>
  );
}

export default App;
