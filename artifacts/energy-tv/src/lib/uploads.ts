import { supabase } from "@/lib/supabase";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_RECORDING_BYTES = 25 * 1024 * 1024; // 25MB — a few minutes of webm audio

function extOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "bin";
}

async function uploadToBucket(bucket: string, userId: string, file: File | Blob, ext: string): Promise<string> {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  return path;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Avatar must be an image");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Avatar must be under 5MB");
  const path = await uploadToBucket("avatars", userId, file, extOf(file.name));
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadBanner(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Banner must be an image");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Banner must be under 5MB");
  const path = await uploadToBucket("banners", userId, file, extOf(file.name));
  const { data } = supabase.storage.from("banners").getPublicUrl(path);
  return data.publicUrl;
}

export interface UploadedAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export async function uploadForumAttachment(userId: string, file: File): Promise<UploadedAttachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(`${file.name} is over the 15MB limit`);
  const path = await uploadToBucket("forum-attachments", userId, file, extOf(file.name));
  const { data } = supabase.storage.from("forum-attachments").getPublicUrl(path);
  return { url: data.publicUrl, name: file.name, type: file.type, size: file.size };
}

/**
 * Studio recordings go in a PRIVATE bucket (unlike the others above) — this
 * returns the storage path, not a public URL. Get a playable URL with
 * getStudioRecordingUrl() below, which mints a short-lived signed URL.
 */
export async function uploadStudioRecording(userId: string, blob: Blob): Promise<string> {
  if (blob.size > MAX_RECORDING_BYTES) throw new Error("Recording is too long/large (25MB max)");
  return uploadToBucket("studio-recordings", userId, blob, "webm");
}

export async function getStudioRecordingUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("studio-recordings")
    .createSignedUrl(path, 60 * 60); // 1 hour
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteStudioRecording(path: string): Promise<void> {
  await supabase.storage.from("studio-recordings").remove([path]);
}
