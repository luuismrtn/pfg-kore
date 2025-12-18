import { useEffect, useState, type JSX } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import PanelPage from "./components/pages/PanelPage";
import ChatPage from "./components/pages/ChatPage";
import AnalyticsPage from "./components/pages/AnalyticsPage";
import SettingsPage from "./components/pages/SettingsPage";

type PageKey = "panel" | "chat" | "analytics" | "settings";

function App() {
  const [activePage, setActivePage] = useState<PageKey>("panel");

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const renderContent = () => {
    const pages: Record<PageKey, JSX.Element> = {
      panel: <PanelPage />,
      chat: <ChatPage />,
      analytics: <AnalyticsPage />,
      settings: <SettingsPage />,
    };

    return pages[activePage];
  };

  return (
    <div className="bg-[#f6f8f7] dark:bg-[#102217] font-display text-slate-900 dark:text-white overflow-hidden selection:bg-primary selection:text-[#102217]">
      <div className="flex h-screen w-full">
        <Sidebar
          activeKey={activePage}
          onSelect={(key) => setActivePage(key as PageKey)}
        />

        <main className="flex-1 flex flex-col h-full bg-[#f6f8f7] dark:bg-[#102217] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-125 h-125 bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-125 h-125 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />

          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
