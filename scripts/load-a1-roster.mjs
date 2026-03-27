import {
  createSupabaseServiceClient,
  getActiveSeasonId,
  importRoster,
  loadEnvFile
} from "./roster-import-utils.mjs";

const rawRoster = [
  { number: 1, name: "GUACARAN, Jesus", birthDate: "31/03/1994", nationality: "VENEZOLANO" },
  { number: 2, name: "GRIMOLIZZI, Juan", birthDate: "20/07/1995", nationality: "ARGENTINO" },
  { number: 3, name: "HERNANDEZ, Carlos", birthDate: "14/05/2000", nationality: "VENEZOLANO" },
  { number: 4, name: "SUCRE, Edwin", birthDate: "06/10/1996", nationality: "VENEZOLANO" },
  { number: 5, name: "GIANNOCCARO, Francisco", birthDate: "31/05/1994", nationality: "VENEZOLANO" },
  { number: 6, name: "DIAZ, David", birthDate: "05/05/1990", nationality: "VENEZOLANO" },
  { number: 7, name: "CORZO, Luvis", birthDate: "29/01/1992", nationality: "ARGENTINO" },
  { number: 8, name: "ACEVEDO, Alberto", birthDate: "24/02/1995", nationality: "VENEZOLANO" },
  { number: 9, name: "CHENA, Noel", birthDate: "18/04/2000", nationality: "ARGENTINO" },
  { number: 10, name: "HERNANDEZ, Oswaldo", birthDate: "27/04/1990", nationality: "VENEZOLANO" },
  { number: 11, name: "DOMINGUINI, Luis", birthDate: "20/01/1999", nationality: "ARGENTINO" },
  { number: 12, name: "FELIZ, Carlos", birthDate: "01/10/1996", nationality: "DOMINICANO" },
  { number: 13, name: "MARIN, Armando", birthDate: "11/05/1989", nationality: "ARGENTINO" },
  { number: 14, name: "CISNEROS, Eliecer", birthDate: "06/03/1984", nationality: "VENEZOLANO" }
];

await loadEnvFile();

const supabase = createSupabaseServiceClient();
const seasonId = await getActiveSeasonId(supabase);
const dryRun = process.argv.includes("--dry-run");

const results = await importRoster({
  supabase,
  seasonId,
  squadId: "a1",
  players: rawRoster,
  dryRun
});

console.log(
  `${dryRun ? "Validated" : "Imported"} ${results.length} A1 players for ${seasonId}.`
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
