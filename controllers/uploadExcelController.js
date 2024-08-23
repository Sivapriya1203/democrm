const express = require("express");
const router = express.Router();
const moment = require("moment");
const currentDate = moment().format("YYYY-MM-DD HH:mm:ss");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

module.exports = (db, upload) => {
  router.post("/upload", upload.single("file"), (req, res) => {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheet_name_list = workbook.SheetNames;
    const jsonData = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheet_name_list[0]]
    );

    // console.log("filePath", filePath);
    // console.log("jsonData", jsonData);

    // Insert data into MySQL database
    jsonData.forEach(async (row, index) => {
      console.log("index", index);
      console.log("row", row);
      await insertData(row, db);
    });

    // Delete the uploaded file
    //fs.unlinkSync(filePath);
    res.send("OK");
  });

  return router;
};

async function insertData(row, db) {
  try {
    const {
      pro_name,
             specification,
             purch_address,
             quantity,
             price,
             total,
        gst,
    } = row;

    const stu_img = "sample_image";

    const apply_date = moment().format("YYYY-MM-DD");

    const saveQuery = `
            INSERT INTO students_master 
            (     pro_name,
       specification,
      purch_address,
       quantity,
      price,
       total,
       gst,) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?,)
        `;
    // var price= excelDateToJSDate(dob);
    const saveParams = [
      pro_name,
      specification,
     purch_address,
      quantity,
     price,
      total,
      gst

    ];

    const [results] = await db.query(saveQuery, saveParams);

    if (results.affectedRows === 1) {
      console.log("Student data saved successfully.");
    } else {
      console.log("Failed to save student data.");
    }
  } catch (err) {
    console.log("Error saving student data:", err);
  }
}

// Function to convert Excel date serial number to JavaScript Date object
const excel = (excelSerialDate) => {
  const daysSince1900 = Math.floor(excelSerialDate);
  const secondsInDay = 86400;
  const seconds = (excelSerialDate - daysSince1900) * secondsInDay;
  const date = new Date(1900, 0, daysSince1900 - 1);
  date.setSeconds(seconds);
  return date;
};