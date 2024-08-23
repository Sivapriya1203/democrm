const express = require('express');
const router = express.Router();
const moment = require('moment');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

module.exports = (db) => {

  // Get all purchase data
  router.get('/getPurchase', (req, res) => {
    const getData = 'SELECT * FROM purchase';
    db.query(getData, (getErr, getRes) => {
      if (getErr) {
        res.status(500).json({ message: "Internal server error. Could not fetch purchase data." });
      } else if (getRes.length === 0) {
        res.status(404).json({ message: "Purchase data not found." });
      } else {
        res.status(200).json(getRes);
      }
    });
  });
  router.post('/savePurchase',(req,res)=>{
    const {pro_name,specification,purch_address,quantity,price,total,gst} = req.body;
    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const saveData = 'insert into purchase(pro_name,specification,purch_address,quantity,price,total,gst,created_at) values(?,?,?,?,?,?,?,?)';
    db.query(saveData,[pro_name,specification,purch_address,quantity,price,total,gst,currentDate],(saveErr,saveRes)=>{
        if(saveErr){
            res.status(500).json({message:"Internal server error."})
            console.log("Error :",saveErr)
        }else{
            res.status(200).json({message:"Purchase Data added successfully."})
        }
    })
})


  // Save purchase data from Excel file
  router.post('/savePurchaseexcel', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const filePath = path.resolve(req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const saveData = 'INSERT INTO purchase (pro_name, specification, purch_address, quantity, price, total, gst, created_at) VALUES ?';
    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

    const values = data.map(item => [
      item.pro_name,
      item.specification,
      item.purch_address,
      item.quantity,
      item.price,
      item.total,
      item.gst,
      currentDate
    ]);

    db.query(saveData, [values], (saveErr, saveRes) => {
      if (saveErr) {
        res.status(500).json({ message: "Internal server error." });
        console.log("Error:", saveErr);
      } else {
        res.status(200).json({ message: "Purchase data added successfully." });
      }
    });
  });

  // Update purchase data
  router.put('/update/:id', (req, res) => {
    const purch_id = req.params.id;
    const { pro_name, specification, purch_address, quantity, price, total, gst } = req.body;
    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const updateData = 'UPDATE purchase SET pro_name = ?, specification = ?, purch_address = ?, quantity = ?, price = ?, total = ?, gst = ?, updated_at = ? WHERE purch_id = ?';
    db.query(updateData, [pro_name, specification, purch_address, quantity, price, total, gst, currentDate, purch_id], (updateErr, updateRes) => {
      if (updateErr) {
        res.status(500).json({ message: "Internal server error." });
        console.log("Error:", updateErr);
      } else {
        res.status(200).json({ message: "Purchase data updated successfully." });
      }
    });
  });

  // Delete purchase data
  router.delete('/delete/:id', (req, res) => {
    const purch_id = req.params.id;
    const dltData = 'DELETE FROM purchase WHERE purch_id = ?';
    db.query(dltData, [purch_id], (dltErr, dltRes) => {
      if (dltErr) {
        res.status(500).json({ message: "Internal server error." });
      } else {
        res.status(200).json({ message: "Purchase data deleted successfully." });
      }
    });
  });

  return router;
};
