import HeaderBar from "../components/layout/HeaderBar";
import PagePlaceholder from "../components/ui/PagePlaceholder";

function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <HeaderBar title="Ajustes" />
      <PagePlaceholder
        title="Ajustes"
        icon="tune"
        description="Configura notificaciones, preferencias de idioma y conexiones con dispositivos. Disponible próximamente."
      />
    </div>
  );
}

export default SettingsPage;
