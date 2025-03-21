const Helper = require("../../helper/helper");
const sequelize = require("../../connection/sequelize");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fileType = require("file-type");
const log = require("../../models/log");
const organizational= require('../../models/organizational')

async function moveFile(file, baseUploadDir, userId) {
  try {
    await fs.promises.mkdir(baseUploadDir, { recursive: true });

    const buffer = await fs.promises.readFile(file.filepath);
    const detectedType = await fileType.fromBuffer(buffer);
    const allowedTypes = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "video/mp4": "mp4",
      "text/plain": "txt",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        ".xlsx",
    };

    if (!detectedType || !allowedTypes[detectedType.mime]) {
      return { error: `Invalid file type.` };
    }

    const correctExtension = allowedTypes[detectedType.mime];
    if (
      path.extname(file.originalFilename).slice(1).toLocaleLowerCase() !==
      correctExtension
    ) {
      return { error: `File extension does not match file content.` };
    }

    const filePath = path.join(
      baseUploadDir,
      `${userId}_${Date.now()}.${correctExtension}`
    );
    await fs.promises.rename(file.filepath, filePath);

    return { filePath };
  } catch (error) {
    console.error(`File move error:`, error.message);
    return { error: error.message };
  }
}
const copyFile = async (sourcePath, destFolder, userId) => {
  const folderPath = path.join(process.cwd(), destFolder);
  await fs.promises.mkdir(folderPath, { recursive: true });

  const uniqueName = `${userId}_${Date.now()}_${path.basename(sourcePath)}`;
  const destinationPath = path.join(folderPath, uniqueName);

  try {
    await fs.promises.copyFile(sourcePath, destinationPath); // ✅ Copy file
    return { filePath: destinationPath };
  } catch (err) {
    console.error(`Error copying file:`, err);
    return { error: err.message };
  }
};

exports.addorganizational = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let obj = req.body;
    obj.created_by = req.users.id;
    const validateFields = (data) => {
      for (const key in data) {
        if (typeof data[key] === "string") {
          data[key] = data[key].trim(); // Trim spaces before validation
        }

        if (data[key] === "" || data[key] === null || data[key] === undefined) {
          return `Error: ${key} cannot be empty!`;
        }
      }
      return null; // No errors
    };
    // **Apply Validation**
    const validationError = validateFields(obj);
    if (validationError) {
      await transaction.rollback();
      return Helper.response("failed", validationError, null, res, 200);
    }
    const data = await organizational.count({
      where: {
        hn_heading: obj.hn_heading,
        heading: obj.heading,
        hn_title: obj.hn_title,
        title:obj.title,
        description:obj.description,
        hn_description:obj.hn_description
      },
    });
    if (!data) {
      let createorganizational = await organizational.create(obj);

      if (createorganizational) {
      
        await log.create({
          tableName: "organizational",
          recordId: createorganizational.id,
          action: "CREATE",
          oldData: JSON.stringify(obj),
          newData: JSON.stringify(obj),
          changedBy: req.users.id,
        });

        return Helper.response(
          "success",
          "Organizational Created Successfully",
          null,
          res,
          200
        );
      }
    } else {
      return Helper.response("failed", "Organizational already exists", null, res, 200);
    }
  } catch (error) {
    console.error("Error creating menu:", error);
    return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
  }
};

exports.georganizationallist = async (req, res) => {
  try {
    const documentdata = (
      await organizational.findAll({
        attributes: [
          "id",
          "hn_heading",
          "heading",
          "hn_title",
          "title",
          "description",
          "hn_description",
          "status",
          "createdAt",
        ],
      
        order: [["createdAt", "ASC"]],
      })
    ).map((item) => item.toJSON());
    if (documentdata.length > 0) {
      return Helper.response(
        "success",
        "Data found Successfully",
        { tableData: documentdata },
        res,
        200
      );
    } else {
      return Helper.response("failed", "No data found", null, res, 200);
    }
  } catch (error) {
    console.log(error);

    return Helper.response(
      "failed",
      error.message || "Something went wrong",
      {},
      res,
      200
    );
  }
};

exports.updateorganizational = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let obj = req.body;
    obj.created_by = req.users.id;
    const validateFields = (data) => {
      for (const key in data) {
        if (typeof data[key] === "string") {
          data[key] = data[key].trim(); // Trim spaces before validation
        }

        if (data[key] === "" || data[key] === null || data[key] === undefined) {
          return `Error: ${key} cannot be empty!`;
        }
      }
      return null; // No errors
    };
    // **Apply Validation**
    const validationError = validateFields(obj);
    if (validationError) {
      await transaction.rollback();
      return Helper.response("failed", validationError, null, res, 200);
    }
    const data = await organizational.count({
      where: {
        id: {
          [Op.notIn]: Array.isArray(obj.id) ? obj.id : [obj.id],
        },
        name: obj.name,
        parent_id:obj?.parent_id
      },
    });

    if (!data) {
      let createMenu = await menu.update(obj, {
        where: {
          id: obj.id,
        },
        transaction, 
      });
      

      if (createMenu) {
        await transaction.commit(); // Commit transaction
        await log.create({
          tableName: "menu",
          recordId: createMenu.id,
          action: "UPDATE",
          oldData: JSON.stringify(obj),
          newData: JSON.stringify(obj),
          changedBy: req.users.id,
        });

        return Helper.response(
          "success",
          "Menu Created Successfully",
          null,
          res,
          200
        );
      }
    } else {
        await transaction.rollback()
      return Helper.response("failed", "organizational already exists", null, res, 200);
    }
  } catch (error) {
    console.error("Error creating menu:", error);
    return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
  }
};
