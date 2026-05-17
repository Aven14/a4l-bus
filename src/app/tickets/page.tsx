import { TicketForm } from "@/components/tickets/ticket-form";
import { PageHeader } from "@/components/ui/page-header";

export default function TicketsPage() {
  return (
    <div className="page-enter mx-auto max-w-6xl px-4">
      <PageHeader
        title="Émission de billets"
        subtitle="Créez un titre de transport pour un passager."
      />
      <TicketForm />
    </div>
  );
}
