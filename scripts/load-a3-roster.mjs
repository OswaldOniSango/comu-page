import {
  createSupabaseServiceClient,
  getActiveSeasonId,
  importRoster,
  loadEnvFile
} from "./roster-import-utils.mjs";

const rawRoster = [
  { number: 1, name: "REGO, Pablo", birthDate: "27/02/1986", nationality: "ARGENTINO" },
  { number: 2, name: "MASSO, Franco", birthDate: "21/08/1996", nationality: "ARGENTINO" },
  { number: 3, name: "HERZIG, Gerardo", birthDate: "30/11/1973", nationality: "ARGENTINO" },
  { number: 4, name: "KRIGER, Gustavo", birthDate: "26/04/1973", nationality: "ARGENTINO" },
  { number: 5, name: "BENBASSAT, Cipriano", birthDate: "14/01/2010", nationality: "ARGENTINO" },
  { number: 6, name: "MISTRIH, Nahim", birthDate: "25/10/1993", nationality: "ARGENTINO" },
  { number: 7, name: "SOLER, Agustin", birthDate: "22/02/1989", nationality: "ARGENTINO" },
  { number: 8, name: "CASTI?EIRA, Gabriel", birthDate: "24/08/1996", nationality: "ARGENTINO" },
  { number: 9, name: "CARDOZO, Pablo", birthDate: "12/09/1997", nationality: "ARGENTINO" },
  { number: 10, name: "DE BARROS, Oscar", birthDate: "14/05/1989", nationality: "VENEZOLANO" },
  { number: 11, name: "PI?A, Jean", birthDate: "16/03/1983", nationality: "VENEZOLANO" },
  { number: 12, name: "VASQUEZ, Jose", birthDate: "02/03/1993", nationality: "VENEZOLANO" },
  { number: 13, name: "FERNANDEZ Jonathan", birthDate: "01/05/1996", nationality: "ARGENTINO" },
  { number: 14, name: "VILLARROEL Rafael", birthDate: "30/05/1995", nationality: "VENEZOLANO" },
  { number: 15, name: "GOMEZ Maximiliano", birthDate: "18/07/1989", nationality: "ARGENTINO" },
  { number: 16, name: "BRACHO Joel", birthDate: "03/02/1993", nationality: "VENEZOLANO" },
  { number: 17, name: "DAZA Omar", birthDate: "25/05/1997", nationality: "ARGENTINO" },
  { number: 18, name: "TORRES Michael", birthDate: "21/02/1997", nationality: "VENEZOLANO" },
  { number: 19, name: "MORILLO LUIS", birthDate: "14/05/1995", nationality: "VENEZOLANO" },
  { number: 20, name: "COMAS Breidy", birthDate: "06/09/2007", nationality: "DOMINICANA" }
];

await loadEnvFile();

const supabase = createSupabaseServiceClient();
const seasonId = await getActiveSeasonId(supabase);
const dryRun = process.argv.includes("--dry-run");

const results = await importRoster({
  supabase,
  seasonId,
  squadId: "a3",
  players: rawRoster,
  dryRun
});

console.log(
  `${dryRun ? "Validated" : "Imported"} ${results.length} A3 players for ${seasonId}.`
);
console.table(
  results.map((item) => ({
    number: item.jerseyNumber,
    player: `${item.lastName}, ${item.firstName}`,
    slug: item.slug
  }))
);
console.log(
  "Birth date and nationality were preserved in the source list, but the current schema does not store those fields yet."
);
