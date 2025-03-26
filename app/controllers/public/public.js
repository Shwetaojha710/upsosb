const Helper = require("../../helper/helper");
const menu = require("../../models/menu");
const sequelize = require("../../connection/sequelize");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const fileType = require("file-type");
const page = require("../../models/pages");
const log = require("../../models/log");
const feedback = require("../../models/feedback");
const faq = require("../../models/faq");
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
      order: [["id", "DESC"]],
    });

    if (createpage.length > 0) {
      return Helper.response(
        "success",
        "Data found Successfully",
        { tableData: createpage },
        res,
        200
      );
    } else {
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
        where: {
          status: true,
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
        where: {
          status: true,
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
    const lang = req.headers?.Language === "hn" ? "hn" : "en";

    let type = req?.body?.doc_type || null;

    // Determine the language-specific columns dynamically
    const languageColumns =
      lang === "hn"
        ? ["hn_image_title", "hn_image_alt"]
        : ["image_title", "image_alt"];
    const documentdata = (
      await document.findAll({
        attributes: [
          "id",
          ...languageColumns,
          "order",
          "banner_image",
          "status",
          "createdAt",
        ],
        order: [["createdAt", "ASC"]],
        where: {
          doc_type: type,
          status:true
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
    const lang = req.headers?.Language === "hn" ? "hn" : "en";

    let type = req?.body?.doc_type || null;

    // Determine the language-specific columns dynamically
    const languageColumns =
      lang === "hn"
        ? ["hn_image_title", "hn_image_alt"]
        : ["image_title", "image_alt"];
    const documentdata = (
      await document.findAll({
        attributes: [
          "id",
          ...languageColumns,
          "order",
          "banner_image",
          "status",
          "createdAt",
        ],
        order: [["createdAt", "ASC"]],
        where: {
          doc_type: type,
          status:true
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

exports.getpublicslugdata = async (req, res) => {
  try {
    console.log(req.body);
    const lang = req.headers?.Language === "hn" ? "hn" : "en";

    // Determine the language-specific columns dynamically
    const languageColumns =
      lang === "hn"
        ? {
            description: "hn_description",
            page_title: "hn_page_title",
            menu: "hn_menu",
          }
        : {
            description: "description",
            page_title: "page_title",
            menu: "menu",
          };

    // Extract the column values from the languageColumns object
    const languageColumnValues = Object.values(languageColumns);
    const documentdata = await menu.findAll({
      attributes: ["id", ...languageColumnValues, "status", "createdAt"],
      order: [["createdAt", "ASC"]],
      where: {
        slug: req.body?.slug,
        status: true,
      },
    });

    if (documentdata.length > 0) {
      return Helper.response(
        "success",
        "data found Successfully",
        documentdata,
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

exports.createfeedback = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction

  try {
    console.log(req.body, "req body data");
    let obj = req.body;
    obj.language = req.headers?.Language;

    // **Validation Function**
    const validateFields = async (data) => {
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

    
        // **Specific Validation for 'feedback' Key**
        if (!obj.feedback ||typeof obj.feedback !== "string" ||obj.feedback.length < 5) {
          return "Error: Feedback must be a string with at least 5 characters.";
        }
        const result = await Helper.validateFeedback(obj);
        if (result.error) {
          await transaction.rollback();
          return Helper.response(
            "failed",
            result.error|| "An error occurred",
            {},
            res,
            200
          );
  
        }

 
    const validationError = await validateFields(obj);
    if (validationError) {
      await transaction.rollback(); // Rollback if validation fails
      return Helper.response("failed", validationError, null, res, 200);
    }

    let createfeedback = await feedback.create(obj, { transaction });

    if (createfeedback) {
      // **Log Entry**
      await log.create(
        {
          tableName: "feedback",
          recordId: createfeedback.id,
          module: obj.module,
          action: "CREATE",
          oldData: JSON.stringify(obj),
          newData: JSON.stringify(obj),
        },
        { transaction }
      );
      await transaction.commit();
      return Helper.response(
        "success",
        "Feedback Created Successfully",
        null,
        res,
        200
      );
    } else {
      await transaction.rollback();
      return Helper.response("failed", "feedback error ", null, res, 200);
    }
  } catch (error) {
    console.error("Error creating menu:", error);
    await transaction.rollback(); // Rollback on error
    return Helper.response(
      "failed",
      error?.errors?.[0]?.message || "An error occurred",
      {},
      res,
      200
    );
  }
};


exports.gepublicfaqlist=async(req,res)=>{
  try {
    let lang = req.headers.Language
      // Determine the language-specific columns dynamically
      const languageColumns = lang === "hn"? {question: "hn_question",answer: "hn_answer",} : {question: "question", answer: "answer",};

    // Extract the column values from the languageColumns object
    const languageColumnValues = Object.values(languageColumns);
    const documentdata = await faq.findAll({ attributes: [ "id",
      ...languageColumnValues,
      "status",
      "createdAt",],
      where:{
        status:true
      },
      order: [["createdAt", "ASC"]],
      })
    
    if (documentdata.length > 0) {
  
      return Helper.response(
        "success",
        "data found Successfully",
        documentdata,
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
  
};


}


exports.sitemapdata = async (req, res) => {
  try {
    const lang = req.headers?.Language === "hn" ? "hn_menu" : "menu";
    const menudata = (
      await menu.findAll({
        where: {
          status: true,
        },
        attributes: [
          "id",
          "parent_id",
          [lang, "label"],
          "page_type",
          "page_url",
          "status",
        ],
        order: [
          [sequelize.literal("CASE WHEN page_type = 'Link' THEN 1 ELSE 0 END"), "ASC"], // Push "link" types to the end
          ["id", "ASC"], // Maintain ID order
        ],
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
           map[item.parent_id]?.submenu.push(map[item.id]);
         } else {
           tree.push(map[item.id]);
         }
       });
       tree = tree.map((item) => {
         if (Array.isArray(item.submenu) && item.submenu.length === 0) {
           delete item.submenu;
         }
         return item;
       });
 

      // Create a map for quick lookup
      // const map = {};
      // menudata.forEach((item) => {
      //   map[item.id] = { ...item, submenu: [] };
      // });

      // //  Build the tree structure
      // let tree = [];
      // menudata.forEach((item) => {
      //   if (item.parent_id !== 0) {
      //     map[item.parent_id]?.submenu.push({
      //       label: map[item.id]["label"],
      //       url: map[item.id]["page_url"],
      //     });
      //   } else {
      //     tree.push({
      //       label: map[item.id]["label"],
      //       url: map[item.id]["page_url"],
      //       submenu: map[item.id]["submenu"],
      //     });
      //   }
      // });
      // tree = tree.map((item) => {
      //   if (Array.isArray(item.submenu) && item.submenu.length === 0) {
      //     delete item.submenu;
      //   }
      //   return item;
      // });

      // //  Output the nested structure
      // // console.log(JSON.stringify(tree, null, 2));

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