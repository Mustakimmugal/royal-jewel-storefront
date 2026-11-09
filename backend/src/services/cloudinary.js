import { createHash } from "node:crypto";
import { config } from "../config.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageBytes = 5 * 1024 * 1024;

export function cloudinaryPublicIdFromUrl(imageUrl) {
  try {
    const url = new URL(imageUrl);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return "";
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== config.cloudinaryCloudName || parts[1] !== "image" || parts[2] !== "upload") return "";
    let publicIdParts = parts.slice(3);
    if (publicIdParts[0] && /^v\d+$/.test(publicIdParts[0])) publicIdParts = publicIdParts.slice(1);
    if (!publicIdParts.length) return "";
    const last = publicIdParts[publicIdParts.length - 1];
    publicIdParts[publicIdParts.length - 1] = last.replace(/\.[a-z0-9]+$/i, "");
    return publicIdParts.some((part) => !part) ? "" : publicIdParts.join("/");
  } catch {
    return "";
  }
}

export async function uploadCloudinaryImage({ fileName, mimeType, data, folder }) {
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    const error = new Error("Image uploads are not configured yet.");
    error.status = 503;
    error.code = "MEDIA_NOT_CONFIGURED";
    throw error;
  }
  if (typeof data !== "string" || !allowedMimeTypes.has(mimeType)) {
    const error = new Error("Choose a JPG, PNG, WebP, or AVIF image up to 5 MB.");
    error.status = 400;
    error.code = "INVALID_IMAGE";
    throw error;
  }
  const base64 = data.replace(/^data:[^;]+;base64,/, "");
  if (!base64 || base64.length > Math.ceil(maxImageBytes * 4 / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    const error = new Error("The selected image could not be read.");
    error.status = 400;
    error.code = "INVALID_IMAGE";
    throw error;
  }
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length || buffer.length > maxImageBytes) {
    const error = new Error("Choose an image up to 5 MB.");
    error.status = 400;
    error.code = "INVALID_IMAGE";
    throw error;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${config.cloudinaryApiSecret}`).digest("hex");
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), String(fileName || "jewellery-image").slice(0, 120));
  form.append("api_key", config.cloudinaryApiKey);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudinaryCloudName)}/image/upload`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    const error = new Error("The image service is temporarily unavailable.");
    error.status = 502;
    error.code = "MEDIA_UPLOAD_FAILED";
    throw error;
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.secure_url || !result.public_id) {
    console.error(JSON.stringify({ event: "media.upload_failed", status: response.status }));
    const error = new Error("Cloudinary could not save this image. Please try again.");
    error.status = 502;
    error.code = "MEDIA_UPLOAD_FAILED";
    throw error;
  }
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteCloudinaryImages(publicIds = []) {
  const uniquePublicIds = [...new Set(publicIds.filter((id) => typeof id === "string" && id.trim()))];
  if (!uniquePublicIds.length) return;
  if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
    const error = new Error("Image storage is not configured, so product images could not be deleted.");
    error.status = 503;
    error.code = "MEDIA_NOT_CONFIGURED";
    throw error;
  }

  for (const publicId of uniquePublicIds) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${config.cloudinaryApiSecret}`)
      .digest("hex");
    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", config.cloudinaryApiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);

    let response;
    try {
      response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudinaryCloudName)}/image/destroy`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      const error = new Error("The image service is temporarily unavailable. Product images were not deleted.");
      error.status = 502;
      error.code = "MEDIA_DELETE_FAILED";
      throw error;
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !["ok", "not found"].includes(result.result)) {
      console.error(JSON.stringify({ event: "media.delete_failed", status: response.status }));
      const error = new Error("Cloudinary could not delete the product images. Please try again.");
      error.status = 502;
      error.code = "MEDIA_DELETE_FAILED";
      throw error;
    }
  }
}
