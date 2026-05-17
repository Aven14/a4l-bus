export type StopDef = {
  id: string;
  name: string;
  slug: string;
  audioPath: string;
};

export type LineDef = {
  number: number;
  name: string;
  color: string;
  stops: StopDef[];
};

/** Predefined transport network — audio files in /public/audio */
export const TRANSPORT_LINES: LineDef[] = [
  {
    number: 1,
    name: "Ligne 1 — Kavala Centre",
    color: "#E63946",
    stops: [
      { id: "l1-s1", name: "Kavala Centre", slug: "kavala-center", audioPath: "/audio/line1/kavala-center.mp3" },
      { id: "l1-s2", name: "Hôpital", slug: "hospital", audioPath: "/audio/line1/hospital.mp3" },
      { id: "l1-s3", name: "Place du Marché", slug: "market-square", audioPath: "/audio/line1/market-square.mp3" },
      { id: "l1-s4", name: "Terminus Nord", slug: "terminus", audioPath: "/audio/line1/terminus.mp3" },
    ],
  },
  {
    number: 2,
    name: "Ligne 2 — Athira Express",
    color: "#457B9D",
    stops: [
      { id: "l2-s1", name: "Gare Athira", slug: "athira-station", audioPath: "/audio/line2/athira-station.mp3" },
      { id: "l2-s2", name: "Port", slug: "harbor", audioPath: "/audio/line2/harbor.mp3" },
      { id: "l2-s3", name: "Zone Industrielle", slug: "industrial", audioPath: "/audio/line2/industrial.mp3" },
      { id: "l2-s4", name: "Aéroport", slug: "airport", audioPath: "/audio/line2/airport.mp3" },
    ],
  },
  {
    number: 3,
    name: "Ligne 3 — Pyrgos Urbain",
    color: "#2A9D8F",
    stops: [
      { id: "l3-s1", name: "Mairie Pyrgos", slug: "town-hall", audioPath: "/audio/line3/town-hall.mp3" },
      { id: "l3-s2", name: "Université", slug: "university", audioPath: "/audio/line3/university.mp3" },
      { id: "l3-s3", name: "Stade", slug: "stadium", audioPath: "/audio/line3/stadium.mp3" },
      { id: "l3-s4", name: "Terminus Sud", slug: "south-terminus", audioPath: "/audio/line3/south-terminus.mp3" },
    ],
  },
  {
    number: 4,
    name: "Ligne 4 — Sofia Littoral",
    color: "#F4A261",
    stops: [
      { id: "l4-s1", name: "Plage Sofia", slug: "beach", audioPath: "/audio/line4/beach.mp3" },
      { id: "l4-s2", name: "Centre-ville", slug: "downtown", audioPath: "/audio/line4/downtown.mp3" },
      { id: "l4-s3", name: "Camping", slug: "campsite", audioPath: "/audio/line4/campsite.mp3" },
      { id: "l4-s4", name: "Phare", slug: "lighthouse", audioPath: "/audio/line4/lighthouse.mp3" },
    ],
  },
  {
    number: 5,
    name: "Ligne 5 — Agios Dionysios",
    color: "#9B5DE5",
    stops: [
      { id: "l5-s1", name: "Église", slug: "church", audioPath: "/audio/line5/church.mp3" },
      { id: "l5-s2", name: "Vignoble", slug: "vineyard", audioPath: "/audio/line5/vineyard.mp3" },
      { id: "l5-s3", name: "Colline", slug: "hill", audioPath: "/audio/line5/hill.mp3" },
      { id: "l5-s4", name: "Monastère", slug: "monastery", audioPath: "/audio/line5/monastery.mp3" },
    ],
  },
  {
    number: 6,
    name: "Ligne 6 — Neochori Rural",
    color: "#06D6A0",
    stops: [
      { id: "l6-s1", name: "Ferme", slug: "farm", audioPath: "/audio/line6/farm.mp3" },
      { id: "l6-s2", name: "Forêt", slug: "forest", audioPath: "/audio/line6/forest.mp3" },
      { id: "l6-s3", name: "Lac", slug: "lake", audioPath: "/audio/line6/lake.mp3" },
      { id: "l6-s4", name: "Village", slug: "village", audioPath: "/audio/line6/village.mp3" },
    ],
  },
];

export const CHIME_PATH = "/audio/sfx/chime.mp3";

export const RADIO_TRACKS = [
  { id: "track-1", title: "CTB Radio — Ligne urbaine", src: "/audio/music/track1.mp3" },
  { id: "track-2", title: "CTB Radio — Circulation", src: "/audio/music/track2.mp3" },
  { id: "track-3", title: "CTB Radio — Réseau nuit", src: "/audio/music/track3.mp3" },
];

export type TicketType = "Single Trip" | "Day Pass" | "Week Pass";

export const TICKET_TYPES: { value: TicketType; label: string; hours: number }[] = [
  { value: "Single Trip", label: "Trajet unique", hours: 2 },
  { value: "Day Pass", label: "Pass journée", hours: 24 },
  { value: "Week Pass", label: "Pass semaine", hours: 24 * 7 },
];

export function getLineByNumber(num: number) {
  return TRANSPORT_LINES.find((l) => l.number === num);
}

export function getExpirationDate(ticketType: TicketType): Date {
  const hours = TICKET_TYPES.find((t) => t.value === ticketType)?.hours ?? 2;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
