import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.js";
import { deleteCloudinaryImages, uploadCloudinaryImage } from "../services/cloudinary.js";

const router = Router();

router.post("/", authenticate, requirePermission("products:write"), async (req, res) => {
  try {
    const image = await uploadCloudinaryImage({ ...req.body, folder: "royal-jewellers/products" });
    return res.status(201).json({ image });
  } catch (error) {
    console.error(JSON.stringify({ event: "media.upload_failed", code: error.code || "MEDIA_UPLOAD_FAILED" }));
    return res.status(error.status || 502).json({ error: { code: error.code || "MEDIA_UPLOAD_FAILED", message: error.message || "The image service is temporarily unavailable." } });
  }
});

router.delete("/cleanup", authenticate, requirePermission("products:write"), async (req, res) => {
  try {
    const publicIds = req.body?.publicIds;
    if (!Array.isArray(publicIds) || publicIds.length > 4 || publicIds.some((id) => typeof id !== "string" || id.length > 255)) {
      return res.status(400).json({ error: { code: "INVALID_IMAGE_LIST", message: "The uploaded image list is invalid." } });
    }
    await deleteCloudinaryImages(publicIds);
    return res.status(204).end();
  } catch (error) {
    console.error(JSON.stringify({ event: "media.cleanup_failed", code: error.code || "MEDIA_DELETE_FAILED" }));
    return res.status(error.status || 502).json({ error: { code: error.code || "MEDIA_DELETE_FAILED", message: error.message || "The image service is temporarily unavailable." } });
  }
});

export default router;
