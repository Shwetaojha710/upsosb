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
const { Op } = require("sequelize");
const { col } = require("sequelize");
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
        parent_id:obj?.parent_id
      },
    });
    if (!data) {
      let createMenu = await menu.create(obj);

      if (createMenu) {
        await transaction.commit(); // Commit transaction
        await log.create({
          tableName: "menu",
          recordId: createMenu.id,
          action: "CREATE",
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
      return Helper.response("failed", "Menu already exists", null, res, 200);
    }
  } catch (error) {
    console.error("Error creating menu:", error);
    return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
  }
};

exports.menudata = async (req, res) => {
  try {
    const lang = req.headers?.lang === "hn" ? "hn_name" : "en_name";
    const menudata = (
      await menu.findAll({
        where: {
          status: "ACTIVE",
        },
        attributes: [
          "id",
          "parent_id",
          [lang, "label"],
          "type",
          "page_url",
          "status",
        ],
        order: [["id", "ASC"]],
      })
    ).map((item) => item.toJSON());
    if (menudata.length > 0) {
      // Create a map for quick lookup
      const map = {};
      menudata.forEach((item) => {
        map[item.id] = { ...item, submenu: [] };
      });

      //  Build the tree structure
      let tree = [];
      menudata.forEach((item) => {
        if (item.parent_id !== 0) {
          map[item.parent_id]?.submenu.push({
            label: map[item.id]["label"],
            url: map[item.id]["page_url"],
          });
        } else {
          tree.push({
            label: map[item.id]["label"],
            url: map[item.id]["page_url"],
            submenu: map[item.id]["submenu"],
          });
        }
      });
      tree = tree.map((item) => {
        if (Array.isArray(item.submenu) && item.submenu.length === 0) {
          delete item.submenu;
        }
        return item;
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

exports.updatemenu = async (req, res) => {
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
      return Helper.response("failed", "Menu already exists", null, res, 200);
    }
  } catch (error) {
    console.error("Error creating menu:", error);
    return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
  }
};

exports.getdocument = async (req, res) => {
  try {
    const documentdata = (
      await document.findAll({
        attributes: [
          "id",
          "image_alt",
          "order",
          "banner_image",
          "status",
          "createdAt",
        ],
        order: [["createdAt", "ASC"]],
      })
    ).map((item) => item.toJSON());
    if (documentdata.length > 0) {
      const sortedData = documentdata
        .filter((item) => item.status === "true" || item.status === "false")
        .sort((a, b) => {
          if (a.order === b.order) {
            return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
          }
          return a.order - b.order; // Sort by order
        });

      console.log(sortedData);
      return Helper.response(
        "success",
        "data found Successfully",
        { tableData: sortedData },
        res,
        200
      );
    } else {
      return Helper.response("failed", "No data found", null, res, 200);
    }
  } catch (error) {
    return Helper.response(
      "failed",
      error.message || "Something went wrong",
      {},
      res,
      200
    );
  }
};

exports.getgallerydocument = async (req, res) => {
  try {
    console.log(req.body);

    let type = req?.body?.doc_type;
    const documentdata = (
      await document.findAll({
        attributes: [
          "id",
          "image_alt",
          "image_title",
          "order",
          "banner_image",
          "status",
          "createdAt",
          "hn_image_title",
          "hn_image_alt"
        ],
        order: [["createdAt", "ASC"]],
        where: {
          doc_type: type,
        },
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
    return Helper.response(
      "failed",
      error.message || "Something went wrong",
      {},
      res,
      200
    );
  }
};

exports.gethomebannerImage = async (req, res) => {
  try {
    const documentdata = (
      await document.findAll({
        attributes: ["id", "image_alt", "order", "banner_image", "status"],
        order: [["createdAt", "ASC"]],
      })
    ).map((item) => item.toJSON());
    if (documentdata.length > 0) {
      const sortedData = documentdata
        .filter((item) => item.status === "true" || item.status === "false")
        .sort((a, b) => {
          if (a.order === b.order) {
            return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
          }
          return a.order - b.order; // Sort by order
        });
      let data = sortedData.map((item) => {
        data.push({
          image_alt: item.image_alt,
          banner_image: item.banner_image,
        });
      });

      console.log(data);
      return Helper.response(
        "success",
        "data found Successfully",
        data,
        res,
        200
      );
    } else {
      return Helper.response("failed", "No data found", null, res, 200);
    }
  } catch (error) {
    return Helper.response(
      "failed",
      error.message || "Something went wrong",
      {},
      res,
      200
    );
  }
};

exports.updatedocumentdata = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    new formidable.IncomingForm().parse(req, async (err, fields, files) => {
      if (err)
        return Helper.response("failed", "Error parsing form", err, res, 200);

      const transformedFields = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]?.trim()])
      );

      const originalData = await document.findByPk(transformedFields.id);

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

      const documentdt = await document.update(
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
        await document.update(transformedFields, {
          where: { id: transformedFields.id },
          transaction,
        });
      }

      await transaction.commit();

      const updatedData = await document.findByPk(transformedFields.id);
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

exports.updatedocumentstatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let obj = req.body;
    obj.created_by = req.users.id;
    if(obj.staus="true"){
      obj.status="false"
    }else{
      obj.status="true"
    }
    const originalData = await document.findByPk(obj.id);
    const updatestatus = await document.update(obj, {
      where: { id: obj.id },
      transaction,
    });

    await transaction.commit();
    // Fetch the updated vehicle data after the update
    const updatedData = await document.findByPk(obj.id);
    // **Log the update action**
    await log.create({
      tableName: "document",
      recordId: obj.id,
      action: "UPDATE",
      oldData: originalData.toJSON(),
      newData: updatedData.toJSON(),
      changedBy: req.users.id,
    });

    return Helper.response(
      "success",
      "Data Updated Successfully",
      null,
      res,
      200
    );
  } catch (error) {
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

exports.addmangedirectory = async (req, res) => {
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
      transformedFields["status"] ='ACTIVE'
      console.log(transformedFields, "transformfieldss");

      // const convertDataToArray = (data) => {
      //   return [
      //     {
      //       first_name: data.en_first_name,
      //       last_name: data.en_last_name,
      //       // phone: JSON.stringify(JSON.parse(data.phone)), // Fix JSON format
      //       // email: JSON.stringify(JSON.parse(data.email)),
      //       phone: data.phone, // Fix JSON format
      //       email: data.email,
      //       order: data.order,
      //       designation: data.en_designation,
      //       // address: data.address,
      //       intercome: data.intercome,
      //       created_by: data.created_by,
      //       status: "ACTIVE",
      //       lang: "en",
      //     },
      //     {
      //       first_name: data.hn_first_name,
      //       last_name: data.hn_last_name,
      //       // phone: JSON.stringify(JSON.parse(data.phone)), // Fix JSON format
      //       // email: JSON.stringify(JSON.parse(data.email)),
      //       phone: data.phone, // Fix JSON format
      //       email: data.email,
      //       order: data.order,
      //       designation: data.hn_designation,
      //       // address: data.address,
      //       intercome: data.intercome,
      //       created_by: data.created_by,
      //       status: "ACTIVE",
      //       lang: "hn",
      //     },
      //   ];
      // };

    

      const documentdt = await managedirectory.create(transformedFields, {
        transaction,
      });
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

      await managedirectory.update(transformedFields, {
        where: { id: documentdt.id },
        transaction,
      });

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
      error?.errors?.[0]?.message || "An unexpected error occurred",
      { error },
      res,
      200
    );
  }
};

exports.updatemangedirectory = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    new formidable.IncomingForm().parse(req, async (err, fields, files) => {
      if (err)
        return Helper.response("failed", "Error parsing form", err, res, 200);

      const transformedFields = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]?.trim()])
      );

      const originalData = await managedirectory.findByPk(transformedFields.id);

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

      const documentdt = await managedirectory.update(
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
        await managedirectory.update(transformedFields, {
          where: { id: transformedFields.id },
          transaction,
        });
      }

      await transaction.commit();

      const updatedData = await managedirectory.findByPk(transformedFields.id);
      // **Log the update action**
      await log.create({
        tableName: "managedirectory",
        recordId: transformedFields.id,
        action: "UPDATE",
        oldData: originalData.toJSON(),
        newData: updatedData.toJSON(),
        changedBy: req.users.id,
      });

      return Helper.response(
        "success",
        "Managedirectory Updated successfully",
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

exports.getmangementdirdata = async (req, res) => {
  try {
    let lang = req.headers.language == undefined ? req.headers?.language : "en";
    const documentdata = await managedirectory.findAll({
      attributes: [
        "id",
        "en_first_name",
        "en_last_name",
        "hn_first_name",
        "hn_last_name",
        "phone",
        "email",
        "en_designation",
        "hn_designation",
        "img",
        "status",
        "createdAt",
      ],
      where: {
        lang: lang,
      },
      order: [["createdAt", "ASC"]],
    });
    const parsedData = documentdata.map((item) => ({
      ...item.toJSON(),
      phone: item.phone ? item.phone : null,
      email: item.email ? item.email: null,
    }));

    if (parsedData.length > 0) {
      return Helper.response(
        "success",
        "data found Successfully",
        { tableData: parsedData },
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

exports.addvedio = async (req, res) => {
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

    let newObj={
      "image_title":obj?.video_title,
      "banner_image":obj?.video_url,
      "image_alt":obj?.video_description,
      "hn_image_title":obj?.hn_video_title,
      "hn_image_alt":obj?.hn_video_description,
      "status":'true',
      "img_type":"video",
      "created_by":req.users.id
    }
    let uploadvedio = await document.create(newObj);

    if (uploadvedio) {
      await transaction.commit(); // Commit transaction
      await log.create({
        tableName: "document",
        recordId: uploadvedio.id,
        action: "CREATE",
        oldData: JSON.stringify(obj),
        newData: JSON.stringify(obj),
        changedBy: req.users.id,
      });

      return Helper.response(
        "success",
        "Video Created Successfully",
        null,
        res,
        200
      );
    }
  } catch (error) {
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
exports.updatevediodata = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    new formidable.IncomingForm().parse(req, async (err, fields, files) => {
      if (err)
        return Helper.response("failed", "Error parsing form", err, res, 200);

      const transformedFields = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, value[0]?.trim()])
      );

      const originalData = await document.findByPk(transformedFields.id);

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
      
        transformedFields["img_title"]=obj?.video_title
        transformedFields["banner_image"]=obj?.video_url
        transformedFields["img_alt"]=obj?.video_description
        transformedFields["hn_img_title"]=obj?.hn_video_title
        transformedFields["hn_img_alt"]=obj?.hn_video_description
        transformedFields["status"]='true'
        transformedFields["img_type"]="video"
        transformedFields["updated_by"]=req.users.id
      
      const documentdt = await document.update(
        {
          ...transformedFields,
          updated_by: req.users.id,
          createdAt: new Date(),
        },
        { where: { id: transformedFields.id }, transaction }
      );

      // if (files.type !== "vedio") {
      //   for (const field in files) {
      //     if (files[field]?.[0]) {
      //       const result = await moveFile(
      //         files[field][0],
      //         `documents`,
      //         transformedFields.id
      //       );
      //       if (result.error) {
      //         await transaction.rollback();
      //         return Helper.response("failed", result.error, null, res, 200);
      //       }
      //       transformedFields[field] = path.basename(result.filePath);
      //     }
      //   }
      //   await document.update(transformedFields, {
      //     where: { id: transformedFields.id },
      //     transaction,
      //   });
      // }

      await transaction.commit();

      const updatedData = await document.findByPk(transformedFields.id);
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

exports.getvediodata = async (req, res) => {
  try {
    console.log(req.body);

    let type = 'video';
const documentdata = (
  await document.findAll({
    attributes: [
      "id",
      [col("image_alt"), "video_description"],
      [col("image_title"), "video_title"],
      [col("banner_image"), "video_image"],
      [col("hn_image_alt"), "hn_video_description"],
      [col("hn_image_title"), "hn_video_title"],
      "status",
      "createdAt",
    ],
    order: [["createdAt", "ASC"]],
    where: {
      doc_type: type,
    },
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
    return Helper.response(
      "failed",
      error.message || "Something went wrong",
      {},
      res,
      200
    );
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
        {
          ...transformedFields,
          created_by: req.users.id,
          createdAt: new Date(),
        },
        { transaction }
      );
      const baseUploadDir = `documents`;
      if (files.type != "vedio") {
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
      }

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
      200
    );
  }
};