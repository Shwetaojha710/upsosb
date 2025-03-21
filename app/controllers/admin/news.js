const Helper = require("../../helper/helper");

const menu = require("../../models/menu");
const sequelize = require("../../connection/sequelize");
const formidable = require("formidable");
const document = require("../../models/document");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fileType = require("file-type");
const log = require("../../models/log");
const managedirectory = require("../../models/managedirectory");
const news = require("../../models/news");

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

exports.addnews = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err)
      {
        await transaction.rollback();
        return Helper.response("failed", "Error parsing form", err, res, 200);
      }

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
      transformedFields["created_by"] = req.users.id;
      transformedFields["createdAt"] = new Date();
      transformedFields["status"] = "ACTIVE";
      console.log(transformedFields, "transformfieldss");

      const data = await news.count({
        where: {
          hn_heading: transformedFields.hn_heading,
          heading: transformedFields.heading,
          hn_title: transformedFields.hn_title,
          title: transformedFields.title,
          description: transformedFields.description,
          hn_description: transformedFields.hn_description,
        },
      });
      let documentdt;
      if (data) {
        await transaction.rollback();
        return Helper.response("failed", "News already exists", null, res, 200);
      } else {
        documentdt = await news.create(transformedFields, {
          transaction,
        });
      }

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

      await news.update(transformedFields, {
        where: { id: documentdt.id },
        transaction,
      });

      await transaction.commit();
      return Helper.response(
        "success",
        "News Added successfully",
        documentdt,
        res,
        200
      );
    });
  } catch (error) {
    console.log(error);
    await transaction.rollback();
    return Helper.response(
      "failed",
      error?.errors?.[0]?.message || "An unexpected error occurred",
      { error },
      res,
      200
    );
  }
};

exports.genewslist = async (req, res) => {
  try {
    let lang = req.headers?.lang == undefined ? req.headers?.lang : "en";
    const documentdata = (
      await news.findAll({
        attributes: [
          "id",
          "hn_heading",
          "heading",
          "hn_title",
          "title",
          "document",
          "hn_description",
          "description",
          "lang",
          "status",
          "createdAt",
        ],
        where: {
          lang: lang,
        },
        order: [["createdAt", "desc"]],
      })
    ).map((item) => item.toJSON());
    if (documentdata.length > 0) {
      return Helper.response(
        "success",
        "data found Successfully",
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

exports.updatenews = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    new formidable.IncomingForm().parse(req, async (err, fields, files) => {
      if (err){
        await transaction.rollback();
        return Helper.response("failed", "Error parsing form", err, res, 200);
      }
       

      const transformedFields = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]?.trim()])
      );

      const originalData = await news.findByPk(transformedFields.id);
      if (!originalData) {
        await transaction.rollback();
        return Helper.response("failed", "Users not found!", {}, res, 200);
      }

      const emptyField = Object.entries(transformedFields).find(
        ([_, value]) => !value
      );
      if (emptyField) {
        await transaction.rollback();
        return Helper.response(
          "failed",
          `${emptyField[0]} cannot be empty!`,
          null,
          res,
          200
        );
      }

      const data = await news.count({
        where: {
          id: {
            [Op.notIn]: Array.isArray(transformedFields.id)
              ? transformedFields.id
              : [transformedFields.id],
          },
          hn_heading: transformedFields.hn_heading,
          heading: transformedFields.heading,
          hn_title: transformedFields.hn_title,
          title: transformedFields.title,
          description: transformedFields.description,
          hn_description: transformedFields.hn_description,
        },
      });
      let documentdt;
      if (data) {
        await transaction.rollback();
        return Helper.response("failed", "News Already exists", null, res, 200);
      } else {
        documentdt = await news.update(
          {
            ...transformedFields,
            updated_by: req.users.id,
            createdAt: new Date(),
          },
          { where: { id: transformedFields.id }, transaction }
        );
      }

      if (files.type !== "vedio") {
        for (const field in files) {
          if (files[field]?.[0]) {
            const result = await moveFile(
              files[field][0],
              `documents`,
              transformedFields.id
            );
            if (result.error) {
              await transaction.rollback();
              return Helper.response("failed", result.error, null, res, 200);
            }
            transformedFields[field] = path.basename(result.filePath);
          }
        }
        await news.update(transformedFields, {
          where: { id: transformedFields.id },
          transaction,
        });
      }

      await transaction.commit();

      const updatedData = await news.findByPk(transformedFields.id);
      // **Log the update action**
      await log.create({
        tableName: "news",
        recordId: transformedFields.id,
        action: "UPDATE",
        oldData: originalData?.toJSON(),
        newData: updatedData?.toJSON(),
        changedBy: req.users.id,
      });

      return Helper.response(
        "success",
        "News Updated successfully",
        documentdt,
        res,
        200
      );
    });
  } catch (error) {
    console.log("error:", error);
    await transaction.rollback();
    return Helper.response(
      "failed",
      error.message || "Something went wrong",
      {},
      res,
      200
    );
  }
};
