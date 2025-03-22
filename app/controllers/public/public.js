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

exports.getpublichomebannerImage = async (req, res) => {
  try {
    const documentdata = (
      await document.findAll({
        where:{
          status:true
        },
        attributes: ["id", "image_alt", "order", "banner_image", "status"],
        order: [["createdAt", "ASC"]],
      })
    ).map((item) => item.toJSON());
    if (documentdata.length > 0) {
      const sortedData = documentdata
        .filter((item) => item.status === true || item.status === false)
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


exports.geturldata = async (req, res) => {
  try {
    const documentdata = (
      await menu.findAll({
        where:{
          status:true
        },
        attributes: ["id", "image_alt", "order", "banner_image", "status"],
        order: [["createdAt", "ASC"]],
      })
    ).map((item) => item.toJSON());
    if (documentdata.length > 0) {
      const sortedData = documentdata
        .filter((item) => item.status === true || item.status === false)
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



exports.getpublicgallerydocument = async (req, res) => {
  try {
    console.log(req.body);
    const lang = req.headers?.language === "hn" ? "hn" : "en"; 
   
    let type = req?.body?.doc_type|| null;
   
      // Determine the language-specific columns dynamically
   const languageColumns = lang === "hn"? ["hn_image_title", "hn_image_alt"]: ["image_title", "image_alt"];
      const documentdata = (await document.findAll({
        attributes: [
          "id",
          ...languageColumns,
          "order",
          "banner_image",
          "status",
          "createdAt"],
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

exports.getpublicvideodocument = async (req, res) => {
  try {
    console.log(req.body);
    const lang = req.headers?.language === "hn" ? "hn" : "en"; 
   
    let type = req?.body?.doc_type|| null;
   
      // Determine the language-specific columns dynamically
   const languageColumns = lang === "hn"? ["hn_image_title", "hn_image_alt"]: ["image_title", "image_alt"];
      const documentdata = (await document.findAll({
        attributes: [
          "id",
          ...languageColumns,
          "order",
          "banner_image",
          "status",
          "createdAt"],
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

