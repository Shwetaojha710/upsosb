const Helper = {};
const CryptoJS = require("crypto-js");
const os = require("os");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const crypto = require("crypto")
const fileType = require("file-type");
const algorithm = "aes-256-cbc"; // Encryption Algorithm
const iv = crypto.randomBytes(16);
const secretKey = crypto.randomBytes(32);

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

  if (/[^a-zA-Z0-9\s().\u0900-\u097F।]/u.test(data.address)) {
    return { error: "Error: Address cannot contain special characters." };
  }
  return "Feedback is valid.";
};


Helper.validateFields = (data) => {
  const specialCharRegex = /[!@#$%^&*()_+={}\[\]:;"'<>,?\\|`~]/; // Allows ".", "-", and "/"
  const escapeCharRegex = /\\/; // Detects backslashes
  const scriptTagRegex = /<.*?>/; // Detects any HTML tags
  const urlRegex = /^(https?:\/\/)?([\w\d\-]+\.)+[\w]{2,}(\/[\w\d\-._~:/?#[\]@!$&'()*+,;=]*)?$/i; // URL validation

  for (const key in data) {

    if (key === "video_url") {
      if (!urlRegex.test(data[key])) {
        return `Error: ${key} must be a valid URL!`;
      }
      continue; // Skip other validations for video URLs
    }

    if(key=="address"){
      if (/[^a-zA-Z0-9\s().\u0900-\u097F।]/u.test(data[key])) {
        return { error: "Error: Address cannot contain special characters." };
      }
    }
  
    // if(key=="description" || key=="hn_description") {
    //   if (/[^a-zA-Z0-9\s()\p{Script=Devanagari},.।]/u.test(data.key)) {
    //     return "Error: Feedback cannot contain special characters.";
    //   }
    // }
   

    if (key !== "email" && key !== "address" && key !== "module" && key !== "date") {
      if (typeof data[key] === "string") {
        data[key] = data[key].trim(); // Trim spaces before validation

        if (data[key] === "" || data[key] === null || data[key] === undefined) {
          return `Error: ${key} cannot be empty!`;
        }

        if (specialCharRegex.test(data[key])) {
          return `Error: ${key} contains special characters!`;
        }

        if (escapeCharRegex.test(data[key])) {
          return `Error: ${key} contains escape characters!`;
        }

        if (scriptTagRegex.test(data[key])) {
          return `Error: ${key} contains HTML tags, which are not allowed!`;
        }
      }
    }
  }
  return null; // No errors
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



 /**
 * Encrypt Data
 */

 Helper.encrypt = (text) => {
  if (!text) {
    throw new Error("Text to encrypt is undefined or null!");
  }

  if (Array.isArray(text)) {
    console.error("Error: encrypt() received an array instead of a string.");
    text = JSON.stringify(text); // Convert array to string
  }

  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return { iv: iv.toString("hex"), encryptedData: encrypted };
};

/**
 * Decrypt Data
 */
Helper.decrypt=(encryptedText, ivHex)=>  {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(ivHex, "hex"));
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
 

module.exports = Helper;
