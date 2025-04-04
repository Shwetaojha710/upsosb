const Helper = require("../../helper/helper");
const sequelize = require("../../connection/sequelize");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fileType = require("file-type");
const log = require("../../models/log");
const organizational= require('../../models/organizational')
const Op=require('sequelize')


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
    const validationError = Helper.validateFields(obj);
    if (validationError) {
      await transaction.rollback();
      return Helper.response("failed", validationError, null, res, 200);
    }
    console.log(obj,"body data")
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
          module:obj?.module,
          action: "CREATE",
          oldData: JSON.stringify(obj),
          newData: JSON.stringify(obj),
          createdBy: req.users.id,
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
    const validationError = Helper.validateFields(obj);
    if (validationError) {
      await transaction.rollback();
      return Helper.response("failed", validationError, null, res, 200);
    }
    const data = await organizational.count({
      where: {
        id: {
          [Op.notIn]: Array.isArray(obj.id) ? obj.id : [obj.id],
        },
       
        heading: obj?.heading,
        // hn_title: obj?.hn_title,
        // title:obj?.title,
        // description:obj?.description,
        // hn_description:obj?.hn_description,
        // hn_heading: obj?.hn_heading,
      },
    });

    if (!data) {
      let createMenu = await organizational.update(obj, {
        where: {
          id: obj.id,
        },
        transaction, 
      });
      

      if (createMenu) {
        await transaction.commit(); // Commit transaction
        await log.create({
          tableName: "organizational",
          recordId: createMenu[0],
          module:obj?.module,
          action: "UPDATE",
          oldData: JSON.stringify(obj),
          newData: JSON.stringify(obj),
          createdBy: req.users.id,
        });

        return Helper.response(
          "success",
          "organizational Updated Successfully",
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
