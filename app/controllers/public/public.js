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
const document = require("../../models/document");
const { col } = require("sequelize");
const { Op } = require("sequelize");
const news =require('../../models/news')
const organizational = require('../../models/organizational');
const managedirectory = require("../../models/managedirectory");
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
    const validationError = Helper.validateFields(obj);
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
    const lang = req.headers.language == "hn" ? "hn_image_alt" : "image_alt";

    const documentdata = (
      await document.findAll({
        where: {
          status: true,
          doc_type: {
            [Op.or]: {
              [Op.is]: null,
              [Op.eq]: "",
            },
          },
        },
        attributes: [
          "id",
          [lang, "image_alt"],
          "order",
          "banner_image",
          "status",
        ],
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
      let data = [];
      sortedData.map((item) => {
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
    const lang = req.headers.language == "hn" ? "hn_image_alt" : "image_alt";
    const documentdata = (
      await menu.findAll({
        where: {
          status: true,
        },
        attributes: [
          "id",
          [lang, "image_alt"],
          "order",
          "banner_image",
          "status",
        ],
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

// exports.getpublicvideodocument = async (req, res) => {
//   try {
//     console.log(req.body);
//     const lang = req.headers?.language === "hn" ? "hn" : "en";

//     let type = req?.body?.doc_type || null;

//     // Determine the language-specific columns dynamically
//     const languageColumns =
//       lang === "hn"
//         ? ["hn_image_title", "hn_image_alt"]
//         : ["image_title", "image_alt"];
//     const documentdata = (
//       await document.findAll({
//         attributes: [
//           "id",
//           ...languageColumns,
//           "order",
//           "banner_image",
//           "status",
//           "createdAt",
//         ],
//         order: [["createdAt", "ASC"]],
//         where: {
//           doc_type: type,
//           status:true
//         },
//       })
//     ).map((item) => item.toJSON());
//     if (documentdata.length > 0) {
//       return Helper.response(
//         "success",
//         "data found Successfully",
//         { tableData: documentdata },
//         res,
//         200
//       );
//     } else {
//       return Helper.response("failed", "No data found", null, res, 200);
//     }
//   } catch (error) {
//     return Helper.response(
//       "failed",
//       error.message || "Something went wrong",
//       {},
//       res,
//       200
//     );
//   }
// };

function findHierarchy(id, dataArray) {
  let hierarchy = [];
  let currentItem = dataArray.find((item) => item.id === id);

  while (currentItem) {
    hierarchy.unshift(currentItem); // Add to the beginning of the array
    if (currentItem.parent_id === 0) break; // Stop if root is found
    currentItem = dataArray.find((item) => item.id === currentItem.parent_id);
  }

  return hierarchy;
}

exports.getpublicslugdata = async (req, res) => {
  try {
    console.log(req.body);
    const lang = req.headers?.language === "hn" ? "hn" : "en";

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
    const documentdata = (
      await menu.findAll({
        attributes: [
          "id",
          "parent_id",
          [col(languageColumns.menu), "menu"],
          [col(languageColumns.page_title), "page_title"],
          [col(languageColumns.description), "description"],
          "page_url",
          "slug",
          "status",
          "createdAt",
        ],
        order: [["createdAt", "ASC"]],
        where: {
          slug: req.body?.slug,
          status: true,
        },
      })
    ).map((item) => item.toJSON());
    const allmenudata = (
      await menu.findAll({
        attributes: [
          "id",
          "parent_id",
          [col(languageColumns.menu), "menu"],
          [col(languageColumns.page_title), "page_title"],
          [col(languageColumns.description), "description"],
          "page_url",
          "slug",
          "status",
          "createdAt",
        ],
        order: [["createdAt", "ASC"]],
        where: {
          status: true,
        },
      })
    ).map((item) => item.toJSON());

    console.log(allmenudata, 888);
    if (documentdata.length == 0) {
      return Helper.response("failed", "No data found", null, res, 200);
    }
    const resultHierarchy = findHierarchy(documentdata[0]["id"], allmenudata);

    let obj = {};
    obj["data"] = documentdata[0];
    obj["bread_crumb"] = resultHierarchy;
    if (documentdata.length > 0) {
      return Helper.response(
        "success",
        "data found Successfully",
        obj,
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
    obj.language = req.headers?.language;

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
    if (
      !obj.feedback ||
      typeof obj.feedback !== "string" ||
      obj.feedback.length < 5
    ) {
      return Helper.response(
        "failed",
        "Feedback must be a string with at least 5 characters.",
        null,
        res,
        200
      );
      
    }
    const result = await Helper.validateFeedback(obj);
    if (result.error) {
      await transaction.rollback();
      return Helper.response(
        "failed",
        result.error || "An error occurred",
        {},
        res,
        200
      );
    }

    const validationError =  Helper.validateFields(obj);
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

exports.gepublicfaqlist = async (req, res) => {
  try {
    let lang = req.headers.language;
    // Determine the language-specific columns dynamically
    const languageColumns =
      lang === "hn"
        ? { question: "hn_question", answer: "hn_answer" }
        : { question: "question", answer: "answer" };
    const documentdata = await faq.findAll({
      attributes: [
        "id",
        [col(languageColumns.question), "question"], // Ensure the key remains "question"
        [col(languageColumns.answer), "answer"],
        "status",
        "createdAt",
      ],
      where: {
        status: true,
      },
      order: [["createdAt", "ASC"]],
    });

    let  bread_crumb
    if(lang=="en"){
    
      bread_crumb=  [
        {
          "label": "Faq",
          "page_title": "Faq",
          "page_url": "/Faq",
          "slug": "Faq",
         
        },
      ]

    }else if(lang=="hn"){
      bread_crumb=  [
        {
          "label": "अक्सर पूछे जाने वाले प्रश्न",
          "page_title": "अक्सर पूछे जाने वाले प्रश्न",
          "page_url": "/अक्सर पूछे जाने वाले प्रश्न",
          "slug": "अक्सर पूछे जाने वाले प्रश्न",
        },
      ]
    }
    let obj = {};
    obj["data"] = documentdata;
    obj["bread_crumb"] = bread_crumb;

    if (documentdata.length > 0) {
      return Helper.response(
        "success",
        "data found Successfully",
        obj,
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

exports.sitemapdata = async (req, res) => {
  try {
    const lang = req.headers?.language === "hn" ? "hn_menu" : "menu";
   
    const menudata = (await menu.findAll({
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
          [
            sequelize.literal("CASE WHEN page_type = 'Link' THEN 1 ELSE 0 END"),
            "ASC",
          ], // Push "link" types to the end
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
      let  bread_crumb
      if(lang=="menu"){
      
        bread_crumb=  [
          {
            "label": "Site Map",
            "page_title": "Site Map",
            "page_url": "/site-map",
            "slug": "site-map",
           
          },
        ]

      }else if(lang=="hn_menu"){
        bread_crumb=  [
          {
            "label": "साइट मानचित्र",
            "page_title": "साइट मानचित्र",
            "page_url": "/साइट मानचित्र",
            "slug": "साइट मानचित्र",
        
          },
        ]
      }


      return Helper.response(
        "success",
        "data found Successfully",
        { tableData: tree,bread_crumb },
        res,
        200
      );
    } 
    else {
      return Helper.response("failed", "No data found", null, res, 200);
    }
  } catch (error) {
    console.error("Error creating menu:", error);
    return Helper.response("failed", error?.errors?.[0].message, {}, res, 200);
  }
};

exports.getpublicgallerydocument = async (req, res) => {
  try {
    // console.log(req.body);
    const lang = req.headers?.language === "hn" ? "hn" : "en";
    const languageColumns =
      lang === "hn"
        ? { image_alt: "hn_image_alt", image_title: "hn_image_title" }
        : { image_alt: "image_alt", image_title: "image_title" };

    // Extract the column values from the languageColumns object
    const languageColumnValues = Object.values(languageColumns);
    let type = req?.body?.doc_type || null;

    const documentdata = (
      await document.findAll({
        attributes: [
          "id",
          "order",
          "banner_image",
          ,
          [col(languageColumns.image_alt), "image_alt"], // Ensure the key remains "question"
          [col(languageColumns.image_title), "image_title"],
          ,
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

exports.getpublicvideodocument = async (req, res) => {
  try {
    const lang = req.headers?.language === "hn" ? "hn" : "en";
    const languageColumns =
      lang === "hn"
        ? { video_description: "hn_image_alt", video_title: "hn_image_title" }
        : { video_description: "image_alt", video_title: "image_title" };
    const languageColumnValues = Object.values(languageColumns);
    let type = "video";
    const documentdata = (
      await document.findAll({
        attributes: [
          "id",
          ,
          [col(languageColumns.video_title), "video_title"], // Ensure the key remains "question"
          [col(languageColumns.video_description), "video_description"],
          [col("banner_image"), "video_url"],
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

exports.gepublicnewsdata = async (req, res) => {
  try {
    const lang = req.headers?.language == "hn" ? "hn" : "en";
    const languageColumns =
      lang === "hn"
        ? { heading: "hn_heading", title: "hn_title", description: "hn_description" }
        : { heading: "heading", title: "title", description: "description" };

    console.log("Language Columns:", languageColumns); // Debugging

    const documentdata = await news.findAll({
      attributes: [
        "id",
        [col(languageColumns.heading), "heading"],
        [col(languageColumns.title), "title"],
        [col(languageColumns.description), "description"],
        "size",
        "doc_format",
        "date",
        "document",
        "doc_lang",
        "status",
        "createdAt",
      ],
      where: {
        status: 1,
      },
      order: [["createdAt", "desc"]],
    });

    let  bread_crumb
    if(lang=="en"){
    
      bread_crumb=  [
        {
          "label": "News",
          "page_title": "News",
          "page_url": "/news",
          "slug": "news",
         
        },
      ]

    }else if(lang=="hn"){
      bread_crumb=  [
        {
          "label": "समाचार",
          "page_title": "समाचार",
          "page_url": "/समाचार",
          "slug": "समाचार",
      
        },
      ]
    }

    let obj = {};
    obj["data"] = documentdata;
    obj["bread_crumb"] = bread_crumb;

    if (documentdata.length > 0) {
      return Helper.response("success", "Data found successfully", obj, res, 200);
    } else {
      return Helper.response("failed", "No data found", null, res, 200);
    }
  } catch (error) {
    console.log(error);
    return Helper.response("failed", error.message || "Something went wrong", {}, res, 200);
  }
};

exports.getlinkmenudata = async (req, res) => {
  try {
    const lang = req.headers.language  == "hn" ?"hn_menu" :"menu";
    const menudata = (
      await menu.findAll({
        where: {
          status: true,
          page_type:  'link'
          
        },
        attributes: [
          "id",
          "parent_id",
          [lang, "label"],
          "page_type",
          "page_url",
          "status",
        ],
        order: [["id", "ASC"]],
      })
    ).map((item) => item.toJSON());
    
    // console.log(menudata,"menudattaa111")
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

exports.getpublicmangementdirdata = async (req, res) => {
  try {
    const lang = req.headers?.language == "hn" ? "hn" : "en";
    const languageColumns = lang === "hn" ? { first_name: "hn_first_name",last_name: "hn_last_name",designation: "hn_designation",}: { first_name: "en_first_name", last_name: "en_last_name", designation: "en_designation" };

    const documentdata = await managedirectory.findAll({
      attributes: [
        "id",
        [col(languageColumns.first_name), "first_name"],
        [col(languageColumns.last_name), "last_name"],
        [col(languageColumns.designation), "designation"],
        "phone",
        "email",
        "order",
        "img",
        "status",
        "createdAt",
      ],
      where: {
        status: true,
      },
      order: [["createdAt", "ASC"]],
    });
   

    
    let  bread_crumb
    if(lang=="en"){
    
      bread_crumb=  [
        {
          "label": "Management Directory",
          "page_title": "Management Directory",
          "page_url": "/management-directory",
          "slug": "management-directory",
         
        },
      ]

    }else if(lang=="hn"){
      bread_crumb=  [
        {
          "label": "प्रबंधन निर्देशिका",
          "page_title": "प्रबंधन निर्देशिका",
          "page_url": "/प्रबंधन निर्देशिका",
          "slug": "प्रबंधन निर्देशिका",
      
        },
      ]
    }

    let obj = {};
    obj["data"] = documentdata;
    obj["bread_crumb"] = bread_crumb;

    if (documentdata.length > 0) {
      return Helper.response(
        "success",
        "data found Successfully",
        obj,
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

exports.getpublicorganizationaldata = async (req, res) => {
  try {
    let lang = req.headers.language == undefined ? req.headers?.Language : "en";
    const languageColumns = lang === "hn" ? { heading: "hn_heading",title: "hn_title",description: "hn_description",}: { heading: "heading", title: "title", description: "description" };

    const documentdata = (
      await organizational.findAll({
        attributes: [
          "id",
          [col(languageColumns.heading), "heading"],
          [col(languageColumns.title), "title"],
          [col(languageColumns.description), "description"],
          "status",
          "createdAt",
        ],
        where: {
          status: true,
        },
      
        order: [["createdAt", "ASC"]],
      })
    ).map((item) => item.toJSON());
    
    let  bread_crumb
    if(lang=="en"){
    
      bread_crumb=  [
        {
          "label": "Organizational Structure",
          "page_title": "Organizational Structure",
          "page_url": "/organizational-structure",
          "slug": "organizational-structure",
         
        },
      ]

    }else if(lang=="hn"){
      bread_crumb=  [
        {
          "label": "संगठनात्मक संरचना",
          "page_title": "संगठनात्मक संरचना",
          "page_url": "/संगठनात्मक संरचना",
          "slug": "संगठनात्मक संरचना",
      
        },
      ]
    }

    let obj = {};
    obj["data"] = documentdata;
    obj["bread_crumb"] = bread_crumb;

    if (documentdata.length > 0) {
      return Helper.response(
        "success",
        "Data found Successfully",
         documentdata ,
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