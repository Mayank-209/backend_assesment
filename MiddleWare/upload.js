const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const path = require("path");

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Upload buffer to Cloudinary with correct file extension
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder
 * @param {string} originalName - Original file name (to extract extension)
 * @param {string} mimeType - File MIME type
 */
const uploadToCloudinary = async (fileBuffer, folder, originalName, mimeType) => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(originalName); // e.g., ".pdf", ".docx"
    const baseName = path.basename(originalName, ext); // e.g., "My File"
    const safeBaseName = baseName.replace(/\s+/g, "_"); // e.g., "My_File"
    const fullFilename = `${safeBaseName}${ext}`;

    // Use 'auto' for image/pdf (to support previews), 'raw' otherwise
    const isImageOrPDF = mimeType.startsWith("image/") || mimeType === "application/pdf";
    const resourceType = isImageOrPDF ? "auto" : "raw";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        access_mode: "public",
        use_filename: true,
        unique_filename: true,
        filename_override: fullFilename,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

module.exports = { upload, uploadToCloudinary };
