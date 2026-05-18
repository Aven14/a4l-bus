import { notFound } from "next/navigation";
import { getActiveLineWithTracking } from "@/actions/lines";
import { updateTrackingPosition } from "@/actions/tracking";
import { LiveTrackingDashboard } from "@/components/driver/live-tracking-dashboard";
import { PageHeader } from "@/components/ui/page-header";

type Props = { params: Promise<{ lineId: string }> };

export default async function LineTrackingPage({ params }: Props) {
  const { lineId } = await params;
  
  // Extraire le numéro de ligne depuis le slug (ex: "l1" -> 1)
  const lineNumber = parseInt(lineId.replace("l", ""), 10);
  if (isNaN(lineNumber)) notFound();
  
  const data = await getActiveLineWithTracking(lineNumber);
  if (!data) notFound();

  const handleUpdatePosition = async (stopId: string) => {
    "use server";
    await updateTrackingPosition(data.shiftId, stopId);
  };

  return (
    <div className="page-enter mx-auto max-w-3xl px-4">
      <PageHeader
        title="Suivi en direct"
        subtitle={`Ligne ${data.line.number} · Position du chauffeur`}
      />
      <LiveTrackingDashboard
        line={data.line}
        currentStopId={null}
        destinationStopId={null}
        onUpdatePosition={handleUpdatePosition}
      />
    </div>
  );
}
