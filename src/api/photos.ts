import { decode } from "base64-arraybuffer";
import * as Crypto from "expo-crypto";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { PHOTO_BUCKET, supabase } from "@/lib/supabase";

const MAX_EDGE = 1600;

/**
 * Shrink a picked photo to at most 1600px on its long edge, as JPEG, and
 * upload it under the poster's own folder. Returns the storage path.
 */
export async function uploadPhoto(
  userId: string,
  asset: { uri: string; width?: number; height?: number },
): Promise<string> {
  const ctx = ImageManipulator.manipulate(asset.uri);
  const w = asset.width ?? 0;
  const h = asset.height ?? 0;
  if (w > MAX_EDGE || h > MAX_EDGE) {
    ctx.resize(w >= h ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error("Couldn't read that photo.");
  const path = `${userId}/${Crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, decode(saved.base64), { contentType: "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}
