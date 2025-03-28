const Helper = {};
const CryptoJS = require("crypto-js");
const os = require("os");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fileType = require("file-type");
require("dotenv").config();
Helper.response = (status, message, data = [], res, statusCode) => {
  res.status(statusCode).json({
    status: status,
    message: message,
    data: data,
  });
};

Helper.encryptPassword = (password) => {
  var pass = CryptoJS.AES.encrypt(password, process.env.SECRET_KEY).toString();
  return pass;
};

Helper.decryptPassword = (password) => {
  var bytes = CryptoJS.AES.decrypt(password, process.env.SECRET_KEY);
  var originalPassword = bytes.toString(CryptoJS.enc.Utf8);
  return originalPassword;
};

Helper.dateFormat = async (date) => {
  const istDate = new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // Use 12-hour format
    timeZone: "Asia/Kolkata",
  });

  return istDate;
};

Helper.trimValue = async (values) => {
  return typeof values === "string"
    ? values.replace(/\s+/g, " ").trim()
    : values;
};

const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY; // Use a secure key from your .env file

Helper.generateToken = (user) => {
  const payload = {
    id: user.id,
    name: user.first_name,
    email: user.email,
  };

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
  console.log("Generated Token:", token);
  return token;
};

Helper.getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (let interfaceName in interfaces) {
    for (let iface of interfaces[interfaceName]) {
      // Check for IPv4 and non-internal (not a loopback address)
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
};

Helper.validateFeedback = (data) => {
  if (/[^a-zA-Z0-9\s()\p{Script=Devanagari},.।]/u.test(data.feedback)) {
    return "Error: Feedback cannot contain special characters.";
  }

  if (/[^a-zA-Z0-9\s()\p{Script=Devanagari},.।]/u.test(data.address)) {
    return { error: "Error: Address cannot contain special characters." };
    //   return "Error: Feedback cannot contain special characters.";
  }
  return "Feedback is valid.";
};

// Helper.moveFile = async (file, baseUploadDir, userId) => {
//   try {
//     await fs.promises.mkdir(baseUploadDir, { recursive: true });

//     const buffer = await fs.promises.readFile(file.filepath);
//     const detectedType = await fileType.fromBuffer(buffer);
//     const allowedTypes = {
//       "image/png": "png",
//       "image/jpeg": "jpeg",
//       "image/jpg": "jpg",
//       "video/mp4": "mp4",
//       "text/plain": "txt",
//       "application/pdf": "pdf",
//       "application/msword": "doc",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
//         "docx",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
//         "docx",
//       "application/vnd.ms-excel": ".xls",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
//         ".xlsx",
//     };

//     if (!detectedType || !allowedTypes[detectedType.mime]) {
//       return { error: `Invalid file type.` };
//     }

//     const correctExtension = allowedTypes[detectedType.mime];
//     if (
//       path.extname(file.originalFilename).slice(1).toLocaleLowerCase() !==
//       correctExtension
//     ) {
//       return { error: `File extension does not match file content.` };
//     }

//     const filePath = path.join(
//       baseUploadDir,
//       `${userId}_${Date.now()}.${correctExtension}`
//     );
//     await fs.promises.rename(file.filepath, filePath);
//     // Get the file size using fs.promises.stat
//     const stats = await fs.promises.stat(filePath);
//     const fileSizeInBytes = stats.size;

//     // Convert size from bytes to kilobytes (KB)
//     const fileSize = (fileSizeInBytes / 1024).toFixed(0); // Rounded to 2 decimal places

//     return { filePath, fileSize };
//   } catch (error) {
//     console.error(`File move error:`, error.message);
//     return { error: error.message };
//   }
// };

Helper.moveFile = async (file, baseUploadDir, userId) => {
    try {
      await fs.promises.mkdir(baseUploadDir, { recursive: true });
  
      const buffer = await fs.promises.readFile(file.filepath);
      const detectedType = await fileType.fromBuffer(buffer);
  
      const allowedTypes = {
        "image/png": "png",
        "image/jpeg": "jpeg", // Ensure JPEG maps to "jpg"
        "video/mp4": "mp4",
        "text/plain": "txt",
        "application/pdf": "pdf",
        "application/msword": "doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/vnd.ms-excel": "xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
      };
  
      // Check if the detected MIME type is allowed
      if (!detectedType || !allowedTypes[detectedType.mime]) {
        return { error: `Invalid file type.` };
      }
  
      // Get the correct extension
      const correctExtensions = allowedTypes[detectedType.mime];
      
      // Extract uploaded file extension (ignoring case)
      const uploadedExt = path.extname(file.originalFilename).slice(1).toLowerCase();
  
      // Allow both "jpg" and "jpeg" for "image/jpeg"
      if (detectedType.mime === "image/jpeg" && !["jpg", "jpeg"].includes(uploadedExt)) {
        return { error: `File extension does not match file content.` };
      }
  
      // Generate new file name with correct extension
      const newFileName = `${userId}_${Date.now()}.${correctExtensions}`;
      const filePath = path.join(baseUploadDir, newFileName);
  
      // Ensure file exists before renaming
      const fileExists = await fs.promises.stat(file.filepath).catch(() => null);
      if (!fileExists) {
        return { error: "Uploaded file not found." };
      }
  
      await fs.promises.rename(file.filepath, filePath);
  
      // Get file size
      const stats = await fs.promises.stat(filePath);
      const fileSize = Math.ceil(stats.size / 1024); // Rounded up to nearest KB
  
      return { filePath, fileSize };
    } catch (error) {
      console.error(`File move error:`, error.message);
      return { error: error.message };
    }
  };

module.exports = Helper;
