import { DriverPanel } from "@/components/driver/driver-panel";
import { PageHeader } from "@/components/ui/page-header";

export default function DriverPage() {
  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Panneau conducteur"
        subtitle="Sélectionnez une ligne et un arrêt pour déclencher l'annonce sonore."
      />
      <DriverPanel />
    </div>
  );
}
