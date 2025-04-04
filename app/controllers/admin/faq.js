const Helper = require("../../helper/helper");
const sequelize = require("../../connection/sequelize");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fileType = require("file-type");
const log = require("../../models/log");
const faq = require("../../models/faq");
const Op = require("sequelize");

exports.addfaq = async (req, res) => {
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
    const validationError = Helper.validateFields(obj);
    if (validationError) {
      await transaction.rollback();
      return Helper.response("failed", validationError, null, res, 200);
    }
    console.log(obj, "body data");

    let createfaq = await faq.create(obj);

    if (createfaq) {
      await log.create({
        tableName: "faq",
        recordId: createfaq.id,
        module: obj?.module,
        action: "CREATE",
        oldData: JSON.stringify(obj),
        newData: JSON.stringify(obj),
        createdBy: req.users.id,
      });

      return Helper.response(
        "success",
        "faq Created Successfully",
        null,
        res,
        200
      );
    }
  } catch (error) {
    console.error("Error creating faq:", error);
    return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
  }
};

exports.gefaqlist = async (req, res) => {
  try {
    const documentdata = (
      await faq.findAll({
        attributes: [
          "id",
          "question",
          "hn_question",
          "hn_answer",
          "answer",
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

exports.updatefaq = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let obj = req.body;
    obj.created_by = req.users.id;

    // Fetch original data within transaction
    const originalData = await faq.findByPk(obj.id, { transaction });

    if (!originalData) {
      await transaction.rollback();
      return Helper.response("failed", "FAQ not found!", {}, res, 200);
    }

    // Field validation function
    const validateFields = (data) => {
      for (const key in data) {
        if (typeof data[key] === "string") {
          data[key] = data[key].trim();
        }
        if (data[key] === "" || data[key] === null || data[key] === undefined) {
          return `Error: ${key} cannot be empty!`;
        }
      }
      return null;
    };

    const validationError = Helper.validateFields(obj);
    if (validationError) {
      await transaction.rollback();
      return Helper.response("failed", validationError, null, res, 200);
    }

    // Toggle status
    obj.status = !obj.status;

    // Update the FAQ record
    let updateResult = await faq.update(obj, {
      where: { id: obj.id },
      transaction,
    });

    if (updateResult[0] === 0) {
      await transaction.rollback();
      return Helper.response("failed", "FAQ update failed!", null, res, 200);
    }

    // Commit transaction before using non-transactional queries
    await transaction.commit();

    // Fetch updated data *without transaction*
    const updatedData = await faq.findByPk(obj.id);

    // Log action (outside transaction)
    await log.create({
      tableName: "faq",
      recordId: obj.id,
      module: obj?.module,
      action: "UPDATE",
      oldData: JSON.stringify(originalData),
      newData: JSON.stringify(updatedData),
      createdBy: req.users.id,
    });

    return Helper.response("success", "FAQ Updated Successfully", null, res, 200);
  } catch (error) {
    console.error("Error updating FAQ:", error);
    if (transaction.finished !== "commit") {
      await transaction.rollback();
    }
    return Helper.response("failed", error.message || "Something went wrong", {}, res, 500);
  }
};


exports.updatefaqstatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let obj = req.body;
    obj.created_by = req.users.id;

    // Fetch original data within transaction
    const originalData = await faq.findByPk(obj.id, { transaction });

    if (!originalData) {
      await transaction.rollback();
      return Helper.response("failed", "FAQ not found!", {}, res, 200);
    }

    // Field validation function
    const validateFields = (data) => {
      for (const key in data) {
        if (typeof data[key] === "string") {
          data[key] = data[key].trim();
        }
        if (data[key] === "" || data[key] === null || data[key] === undefined) {
          return `Error: ${key} cannot be empty!`;
        }
      }
      return null;
    };

    const validationError = Helper.validateFields(obj);
    if (validationError) {
      await transaction.rollback();
      return Helper.response("failed", validationError, null, res, 200);
    }
    // if(obj.status==true){
    //   obj.status=false
    // }else{
    //   obj.status=true
    // }
 
    let updateResult = await faq.update(obj, {
      where: { id: obj.id },
      transaction,
    });

    if (updateResult[0] === 0) {
      await transaction.rollback();
      return Helper.response("failed", "FAQ update failed!", null, res, 200);
    }

    await transaction.commit();

    const updatedData = await faq.findByPk(obj.id);

    // Log action (outside transaction)
    await log.create({
      tableName: "faq",
      recordId: obj.id,
      module: obj?.module,
      action: "UPDATE",
      oldData: JSON.stringify(originalData),
      newData: JSON.stringify(updatedData),
      createdBy: req.users.id,
    });

    return Helper.response("success", "FAQ Updated Successfully", null, res, 200);
  } catch (error) {
    console.error("Error updating FAQ:", error);
    if (transaction.finished !== "commit") {
      await transaction.rollback();
    }
    return Helper.response("failed", error.message || "Something went wrong", {}, res, 500);
  }
};
