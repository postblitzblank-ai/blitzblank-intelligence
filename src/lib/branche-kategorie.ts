/**
 * Ordnet eine Firma anhand von Branche/Name deterministisch (ohne KI-Aufruf)
 * einer der Direktkunden-Kategorien zu, damit die Kartenübersicht nach
 * Branchen gruppiert werden kann. Bewusst regelbasiert statt per KI, damit
 * die Zuordnung sofort verfügbar ist und keine Anthropic-Kosten verursacht.
 */
export type Kategorie =
  | "krankenhaus"
  | "hotel"
  | "hausverwaltung"
  | "schule"
  | "oeffentlich"
  | "industrie"
  | "bahn"
  | "logistik"
  | "buero"
  | "sonstige";

const REGELN: { kategorie: Kategorie; muster: RegExp }[] = [
  { kategorie: "krankenhaus", muster: /klinik|krankenhaus|pflegeheim|reha-|rehaklinik|senioren|pflegedienst|arztpraxis|gesundheitszentrum/i },
  { kategorie: "hotel", muster: /hotel|hostel|pension|resort|gastgewerbe|gästehaus/i },
  { kategorie: "hausverwaltung", muster: /hausverwaltung|wohnungsgesellschaft|wohnungsbaugesellschaft|weg-verwaltung|immobilienverwaltung|wohnungsbau/i },
  { kategorie: "schule", muster: /schule|kita\b|kindertagesstätte|kindergarten|universität|hochschule|fachhochschule|bildungseinrichtung|campus/i },
  { kategorie: "oeffentlich", muster: /\bstadt\b|gemeinde|landkreis|behörde|amt für|ministerium|rathaus|kommune|bundesamt|landesamt|öffentliche[rn]? auftraggeber/i },
  { kategorie: "industrie", muster: /industrie|produktionswerk|fabrik|fertigung|chemiepark|maschinenbau|werksgelände/i },
  { kategorie: "bahn", muster: /deutsche bahn|db regio|db cargo|\bbahn\b|schienenverkehr|bahnhof/i },
  { kategorie: "logistik", muster: /logistik|spedition|lagerhalle|distributionszentrum|fracht|paketzentrum/i },
  { kategorie: "buero", muster: /büro|office|verwaltungsgebäude|dienstleistungszentrum|kanzlei|versicherung|bank\b|consulting/i },
];

export function brancheKategorie(branche: string | null, name: string): Kategorie {
  const text = `${branche ?? ""} ${name}`;
  for (const regel of REGELN) {
    if (regel.muster.test(text)) return regel.kategorie;
  }
  return "sonstige";
}

export const KATEGORIE_LABEL: Record<Kategorie, { label: string; icon: string }> = {
  krankenhaus: { label: "Krankenhäuser", icon: "🏥" },
  hotel: { label: "Hotels", icon: "🏨" },
  hausverwaltung: { label: "Hausverwaltungen", icon: "🏢" },
  schule: { label: "Schulen", icon: "🏫" },
  oeffentlich: { label: "Öffentliche Auftraggeber", icon: "🏛" },
  industrie: { label: "Industrie", icon: "🏭" },
  bahn: { label: "Bahn", icon: "🚆" },
  logistik: { label: "Logistik", icon: "🚛" },
  buero: { label: "Büros", icon: "🏢" },
  sonstige: { label: "Weitere Firmen", icon: "🏷" },
};

export const KATEGORIE_REIHENFOLGE: Kategorie[] = [
  "krankenhaus",
  "hotel",
  "hausverwaltung",
  "schule",
  "oeffentlich",
  "industrie",
  "bahn",
  "logistik",
  "buero",
  "sonstige",
];
