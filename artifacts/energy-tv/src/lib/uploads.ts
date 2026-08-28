import { supabase } from "@/lib/supabase";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15MB

function extOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "bin";
}

async function uploadToBucket(bucket: string, userId: string, file: File): Promise<string> {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extOf(file.name)}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Avatar must be an image");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Avatar must be under 5MB");
  return uploadToBucket("avatars", userId, file);
}

export async function uploadBanner(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Banner must be an image");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Banner must be under 5MB");
  return uploadToBucket("banners", userId, file);
}

export interface UploadedAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export async function uploadForumAttachment(userId: string, file: File): Promise<UploadedAttachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) throw new Error(`${file.name} is over the 15MB limit`);
  const url = await uploadToBucket("forum-attachments", userId, file);
  return { url, name: file.name, type: file.type, size: file.size };
}
