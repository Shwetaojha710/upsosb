// const sequelize = require("../../connection/connection");
const Helper = require("../../helper/helper");

const menu = require("../../models/menu");
const sequelize = require("../../connection/sequelize");
const formidable = require("formidable");
const document = require("../../models/document");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fileType = require("file-type");

exports.createmenu = async (req, res) => {
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
    const data = await menu.count({
      where: {
        name: obj.name,
      },
    });
    if (!data) {
      let createMenu = await menu.create(obj);
      return Helper.response(
        "success",
        "Menu Created Successfully",
        null,
        res,
        200
      );
    } else {
      return Helper.response("failed", "Menu already exists", null, res, 200);
    }
  } catch (error) {
    console.error("Error creating menu:", error);
    return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
  }
};

exports.menudata = async (req, res) => {
  try {
    const lang = req.headers.lang === 'HN' ? 'hn_name' : 'en_name';
    const menudata = ( await menu.findAll({
        where: {
          status: "ACTIVE",
        },
        attributes: [
          "id",
          "parent_id",
          [lang, 'label'], 
          "type",
          "page_url",
          "status",
        ],
        order: [["id", "ASC"]],
      })).map((item) => item.toJSON());
    if (menudata.length > 0) {
      // Create a map for quick lookup
      const map = {};
      menudata.forEach((item) => {
        map[item.id] = { ...item, submenu: [] };
      });

      //  Build the tree structure
      const tree = [];
      menudata.forEach((item) => {
        if (item.parent_id !== 0) {
          // map[item.parent_id]?.submenu.push(map[item.id]);
          map[item.parent_id]?.submenu.push({
            "label": map[item.id]['label'],
            "url":map[item.id]['page_url'],
          });
        } else {
          tree.push(
            {
              "label": map[item.id]['label'],
              "url":map[item.id]['page_url'],
              "submenu":map[item.id]['submenu']
            }
           );
        }
      });

      //  Output the nested structure
      // console.log(JSON.stringify(tree, null, 2));

      return Helper.response(
        "success",
        "data found Successfully",
        { tableData: tree },
        res,
        200
      );
    } else {
      return Helper.response("failed", "No data found", null, res, 200);
    }
  } catch (error) {
    console.error("Error creating menu:", error);
    return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
  }
};

const moveFile = async (file, baseUploadDir, userId) => {
  try {
    await fs.promises.mkdir(baseUploadDir, { recursive: true });

    const buffer = await fs.promises.readFile(file.filepath);
    const detectedType = await fileType.fromBuffer(buffer);
    const allowedTypes = {
      "image/png": "png",
      "image/jpeg": "jpeg",
      "image/jpg": "jpg",
      "video/mp4": "mp4",
    };

    if (!detectedType || !allowedTypes[detectedType.mime]) {
      return { error: `Invalid file type.` };
    }

    const correctExtension = allowedTypes[detectedType.mime];
    if (path.extname(file.originalFilename).slice(1) !== correctExtension) {
      return { error: `File extension does not match file content.` };
    }

    const filePath = path.join(
      baseUploadDir,
      `${userId}_${Date.now()}.${correctExtension}`
    );
    await fs.promises.rename(file.filepath, filePath);

    return { filePath }; // ✅ Return object with `filePath`
  } catch (error) {
    console.error(`File move error:`, error.message);
    return { error: error.message };
  }
};

exports.uploaddocument = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err)
        return Helper.response("failed", "Error parsing form", err, res, 200);

      const transformedFields = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]?.trim()])
      );
      const emptyField = Object.entries(transformedFields).find(
        ([key, value]) => !value
      );

      if (emptyField) {
        await transaction.rollback();
        return Helper.response(
          "failed",
          `Error: ${emptyField[0]} cannot be empty!`,
          null,
          res,
          200
        );
      }

      const documentdt = await document.create(
        { ...transformedFields, created_by: 1, createdAt: new Date() },
        { transaction }
      );
      const baseUploadDir = `documents`;
      for (const field in files) {
        if (files[field]?.[0]) {
          const result = await moveFile(
            files[field][0],
            baseUploadDir,
            documentdt.id
          );

          if (result.error) {
            await transaction.rollback(); // Rollback transaction if file upload fails
            return Helper.response("failed", result.error, null, res, 200);
          }

          if (typeof result.filePath === "string") {
            transformedFields[field] = path.basename(result.filePath);
          }
        }
      }

      await document.update(transformedFields, {
        where: { id: documentdt.id },
        transaction,
      });
      await transaction.commit();
      return Helper.response(
        "success",
        "Document uploaded successfully",
        documentdt,
        res,
        200
      );
    });
  } catch (error) {
    await transaction.rollback();
    return Helper.response(
      "failed",
      error.message || "Something went wrong",
      {},
      res,
      500
    );
  }
};
