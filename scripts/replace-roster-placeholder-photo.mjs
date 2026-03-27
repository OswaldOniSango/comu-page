import {
  createSupabaseServiceClient,
  loadEnvFile
} from "./roster-import-utils.mjs";

const OLD_PHOTO =
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80";
const NEW_PHOTO =
  "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=900&q=80";

await loadEnvFile();

const supabase = createSupabaseServiceClient();

const { data, error } = await supabase
  .from("players")
  .update({ photo_url: NEW_PHOTO })
  .eq("photo_url", OLD_PHOTO)
  .select("id, first_name, last_name, slug");

if (error) {
  throw error;
}

console.log(`Updated ${data.length} players to the baseball placeholder image.`);
console.table(
  data.map((item) => ({
    player: `${item.last_name}, ${item.first_name}`,
    slug: item.slug
  }))
);
