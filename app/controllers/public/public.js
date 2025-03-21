const Helper = require("../../helper/helper");
const menu = require("../../models/menu");
const sequelize = require("../../connection/sequelize");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fileType = require("file-type");
const page = require("../../models/pages");
const log=require('../../models/log')
exports.createhtmldata = async (req, res) => {
  const transaction = await sequelize.transaction(); 
  try {

    // const obj = JSON.parse(req.body);
    const obj = req.body;

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

    // Create Data
    const createpage = await page.create(obj, { transaction });
    if (createpage) {
      await transaction.commit(); 
      await log.create({
        tableName: "page",
        recordId: createpage.id,
        action: "CREATE",
        oldData: JSON.stringify(obj),
        newData: JSON.stringify(obj),
        changedBy: req.users.id,
      });
      
      return Helper.response(
        "success",
        "Data Created Successfully",
        null,
        res,
        200
      );
    }
  } catch (error) {
    console.error("Error creating HTML data:", error);
    await transaction.rollback(); 
    return Helper.response(
      "failed",
      error?.message || "Something went wrong",
      {},
      res,
      200
    );
  }
};

exports.gethtmldata = async (req, res) => {

  try {
   
    const createpage = await page.findAll({
      order: [["id", "DESC"]]
    })
    
    if (createpage.length>0) {
      return Helper.response("success", "Data found Successfully", {tableData:createpage},res, 200);
    }else{
      return Helper.response("failed", "No data found", null, res, 200);
    }
  } catch (error) {
   
    console.error("Error creating HTML data:", error);
    return Helper.response(
      "failed",
      error?.message || "Something went wrong",
      {},
      res,
      200
    );
  }
};


