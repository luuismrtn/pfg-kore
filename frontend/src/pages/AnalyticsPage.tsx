import HeaderBar from "../components/layout/HeaderBar";
import PagePlaceholder from "../components/ui/PagePlaceholder";

function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      <HeaderBar title="Analíticas" />
      <PagePlaceholder
        title="Analíticas"
        icon="monitoring"
        description="Aquí verás métricas de progreso, cargas y adherencia. Estamos preparando visualizaciones claras y accionables."
      />
    </div>
  );
}

export default AnalyticsPage;
