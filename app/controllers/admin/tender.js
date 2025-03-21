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
const tender = require("../../models/tender");

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

exports.addtender = async (req, res) => {
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
      transformedFields["created_by"] = req.users.id;
      transformedFields["createdAt"] = new Date();
      const convertDataToArray = (data) => {
        return [
          {
            description: data?.en_description,
            bid_sub_start_date: data?.bid_sub_start_date,
            tender_no: data?.tender_no,
            bid_sub_end_date: data?.bid_sub_end_date,
            document: data?.document,
            document_type: data?.document_type,
            document_kb:data?.document_kb,
            work_nature:data?.en_work_nature,
            status: "ACTIVE",
            lang: "en",
          },
          {
            description: data?.hn_description,
            bid_sub_start_date: data?.bid_sub_start_date,
            tender_no: data?.tender_no,
            bid_sub_end_date: data?.bid_sub_end_date,
            document: data?.document,
            document_type: data?.document_type,
            document_kb:data?.document_kb,
            work_nature:data?.hn_work_nature,
            status: "ACTIVE",
            lang: "hn",
          },
        ];
      };

      const result = convertDataToArray(transformedFields);

      const documentdt = await tender.bulkCreate(result, { transaction });
      const baseUploadDir = `documents`;
      const uploadedFiles = [];
      for (const field in files) {
        if (files[field]?.[0]) {
          const result = await moveFile(
            files[field][0],
            baseUploadDir,
            documentdt[0].id
          );

          if (result.error) {
            await transaction.rollback();
            return Helper.response("failed", result.error, null, res, 200);
          }

          if (result.filePath) {
            uploadedFiles.push(path.basename(result.filePath));

            const copyResult = await copyFile(
              result.filePath,
              baseUploadDir,
              documentdt[1].id
            );

            if (copyResult.error) {
              await transaction.rollback();
              return Helper.response(
                "failed",
                copyResult.error,
                null,
                res,
                200
              );
            }

            uploadedFiles.push(path.basename(copyResult.filePath));
          }
        }
      }

      if (uploadedFiles.length) {
        await tender.update(
          { img: uploadedFiles[0] },
          { where: { id: documentdt[0].id }, transaction }
        );

        await tender.update(
          { img: uploadedFiles[1] },
          { where: { id: documentdt[1].id }, transaction }
        );
      }

      await transaction.commit();
      return Helper.response(
        "success",
        "Managedirectory Data Added successfully",
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
      error.message || "Something went wrong",
      {},
      res,
      200
    );
  }
};

exports.getenderlist = async (req, res) => {
  try {
    let lang = req.headers?.lang == undefined ? req.headers?.lang : "en";
    const documentdata = (
      await tender.findAll({
        attributes: [
          "id",
          "tender_no",
          "desc",
          "bid_sub_start_date",
          "bid_sub_end_date",
          "document",
          "lang",
          "status",
          "createdAt",
        ],
        where: {
          lang: lang,
        },
        order: [["createdAt", "ASC"]],
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

exports.updatetender = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    new formidable.IncomingForm().parse(req, async (err, fields, files) => {
      if (err)
        return Helper.response("failed", "Error parsing form", err, res, 200);

      const transformedFields = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]?.trim()])
      );

      const originalData = await tender.findByPk(transformedFields.id);

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

      const documentdt = await tender.update(
        {
          ...transformedFields,
          updated_by: req.users.id,
          createdAt: new Date(),
        },
        { where: { id: transformedFields.id }, transaction }
      );

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
        await tender.update(transformedFields, {
          where: { id: transformedFields.id },
          transaction,
        });
      }

      await transaction.commit();

      const updatedData = await tender.findByPk(transformedFields.id);
      // **Log the update action**
      await log.create({
        tableName: "document",
        recordId: transformedFields.id,
        action: "UPDATE",
        oldData: originalData.toJSON(),
        newData: updatedData.toJSON(),
        changedBy: req.users.id,
      });

      return Helper.response(
        "success",
        "Document Updated successfully",
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
