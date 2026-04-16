import multer from "multer";
import multerS3 from "multer-s3";
import { getS3Client } from "./s3.js";
import path from "path";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/wav",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

const createUpload = () => {
  const bucket = process.env.AWS_S3_BUCKET?.trim();
  
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }
  
  let s3;
  try {
    s3 = getS3Client();
  } catch (error) {
    console.error("Failed to get S3 client:", error.message);
    throw error;
  }
  
  return multer({
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 },
    storage: multerS3({
      s3: s3,
      bucket: bucket,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext)
          .replace(/[^a-zA-Z0-9]/g, "-")
          .slice(0, 40);
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        const key = `groups/${req.params.id}/chat/${unique}-${base}${ext}`;
        cb(null, key);
      },
    }),
  });
};

export const uploadSingle = (fieldName) => (req, res, next) => {
  try {
    const upload = createUpload();
    upload.single(fieldName)(req, res, next);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};