import { PassengerSearch } from "@/components/controller/passenger-search";
import { PageHeader } from "@/components/ui/page-header";

export default function ControllerPage() {
  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Contrôle des billets"
        subtitle="Recherchez un passager par prénom et nom."
      />
      <PassengerSearch />
    </div>
  );
}
