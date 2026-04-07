import { useEffect, useState, type JSX } from "react";
import "./App.css";
import Sidebar from "@/components/layout/Sidebar";
import PanelPage from "@/pages/PanelPage";
import ChatPage from "@/pages/ChatPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import type { PageKey } from "@/features/navigation/types";

const THEME_STORAGE_KEY = "kore.theme.v1";

type ThemeMode = "dark" | "light";

const pageRoutes: Record<PageKey, string> = {
  profile: "/profile",
  panel: "/panel",
  chat: "/chat",
  settings: "/settings",
};

function readStoredTheme(): ThemeMode {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" ? "light" : "dark";
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

function App() {
  const [activePage, setActivePage] = useState<PageKey | null>(null);

  useEffect(() => {
    const initialTheme = readStoredTheme();
    localStorage.setItem(THEME_STORAGE_KEY, initialTheme);
    applyTheme(initialTheme);

    const syncFromLocation = () => {
      setActivePage(resolvePageFromPath(window.location.pathname));
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);

    return () => {
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, []);

  const handleSelectPage = (key: PageKey) => {
    setActivePage(key);

    const targetRoute = pageRoutes[key];
    if (window.location.pathname !== targetRoute) {
      window.history.pushState({}, "", targetRoute);
    }
  };

  const renderContent = () => {
    const pages: Record<PageKey, JSX.Element> = {
      profile: <ProfilePage />,
      panel: <PanelPage />,
      chat: <ChatPage />,
      settings: <SettingsPage />,
    };

    return activePage ? pages[activePage] : null;
  };

  if (!activePage) {
    return (
      <div className="bg-canvas dark:bg-deep font-display text-contrast overflow-hidden selection:bg-primary selection:text-contrast">
        <div className="flex h-screen w-full">
          <main className="flex-1 flex flex-col h-full bg-canvas dark:bg-deep relative overflow-hidden">
            <div className="absolute top-0 right-0 w-125 h-125 bg-primary/4 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-125 h-125 bg-border/6 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

            <NotFoundPage onGoHome={() => handleSelectPage("panel")} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-canvas dark:bg-deep font-display text-contrast overflow-hidden selection:bg-primary selection:text-contrast">
      <div className="flex h-screen w-full">
        <Sidebar activeKey={activePage} onSelect={handleSelectPage} />

        <main className="flex-1 flex flex-col h-full bg-canvas dark:bg-deep relative overflow-hidden">
          <div className="absolute top-0 right-0 w-125 h-125 bg-primary/4 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-125 h-125 bg-border/6 rounded-full blur-[120px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
