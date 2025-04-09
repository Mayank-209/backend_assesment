const { uploadToCloudinary } = require("../MiddleWare/upload");
const Document = require("../models/documentModel");

const uploadDocument = async (req, res) => {
  try {
    const dealId = req.params.id;
    const userId = req.userId; // assumes authentication middleware sets this

    if (!req.file || !dealId) {
      return res.status(400).json({ message: "File and Deal ID are required." });
    }

    const { originalname, mimetype, buffer } = req.file;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, "virtual_deal_room", originalname, mimetype);

    // Save to MongoDB
    const newDoc = new Document({
      deal: dealId,
      uploadedBy: userId,
      fileUrl: result.secure_url,
      fileType: mimetype,
      publicId: result.public_id,
      accessControl: [userId],
    });

    await newDoc.save();

    res.status(200).json({ message: "Document uploaded successfully", document: newDoc });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error });
  }
};

module.exports = { uploadDocument };
