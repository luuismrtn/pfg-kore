import { useEffect, useState, type JSX } from "react";
import "./App.css";
import Sidebar from "@/components/layout/Sidebar";
import PanelPage from "@/pages/PanelPage";
import ChatPage from "@/pages/ChatPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import type { PageKey } from "@/features/navigation/types";

function App() {
  const [activePage, setActivePage] = useState<PageKey>("panel");

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const renderContent = () => {
    const pages: Record<PageKey, JSX.Element> = {
      profile: <ProfilePage />,
      panel: <PanelPage />,
      chat: <ChatPage />,
      settings: <SettingsPage />,
    };

    return pages[activePage];
  };

  return (
    <div className="bg-canvas dark:bg-deep font-display text-slate-100 dark:text-white overflow-hidden selection:bg-primary selection:text-contrast">
      <div className="flex h-screen w-full">
        <Sidebar activeKey={activePage} onSelect={setActivePage} />

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
