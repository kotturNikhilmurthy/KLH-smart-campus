import fs from "fs";
import path from "path";
import multer from "multer";

const uploadsRoot = path.resolve("uploads");
const lostFoundDir = path.join(uploadsRoot, "lost-found");

if (!fs.existsSync(lostFoundDir)) {
  fs.mkdirSync(lostFoundDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, lostFoundDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeExt = ext?.toLowerCase() || "";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  },
});

const imageFileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image uploads are allowed"));
    return;
  }
  cb(null, true);
};

export const uploadLostFoundImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("image");

export const LOST_FOUND_UPLOAD_BASE_PATH = "/uploads/lost-found";
