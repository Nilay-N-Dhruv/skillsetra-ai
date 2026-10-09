import { getSupabase } from "./auth";

const RULES = {
  avatars: { types: ["image/png", "image/jpeg", "image/webp"], max: 2 * 1024 * 1024, name: "avatar", label: "photo (PNG, JPEG or WebP, up to 2 MB)" },
  resumes: { types: ["application/pdf"], max: 5 * 1024 * 1024, name: "resume.pdf", label: "resume (PDF, up to 5 MB)" },
};

// Real file types start with fixed "magic" bytes, so a renamed .exe is caught.
async function magicOk(file) {
  const b = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  if (file.type === "image/png") return hex.startsWith("89504e47");
  if (file.type === "image/jpeg") return hex.startsWith("ffd8ff");
  if (file.type === "image/webp") return hex.startsWith("52494646") && hex.slice(16, 24) === "57454250";
  if (file.type === "application/pdf") return hex.startsWith("25504446");
  return false;
}

export async function uploadFile(bucket, file, uid) {
  const rule = RULES[bucket];
  if (!rule.types.includes(file.type) || file.size > rule.max || !(await magicOk(file)))
    throw new Error(`Choose a valid ${rule.label}.`);
  const sb = getSupabase();
  const { error } = await sb.storage.from(bucket).upload(`${uid}/${rule.name}`, file, { upsert: true, contentType: file.type });
  if (error) throw new Error("The upload failed. Please try again.");
}

export async function signedUrl(bucket, path) {
  const { data, error } = await getSupabase().storage.from(bucket).createSignedUrl(path, 3600);
  if (error) throw new Error("Could not open the file.");
  return data.signedUrl;
}

export async function removeFile(bucket, uid) {
  const { error } = await getSupabase().storage.from(bucket).remove([`${uid}/${RULES[bucket].name}`]);
  if (error) throw new Error("Could not remove the file.");
}