const express = require('express');
const router = express.Router();
const moment = require('moment');
const multer = require('multer');



module.exports = (db, storage) => {
    const upload = multer({ storage: storage });
    
    router.post('/saveProduct', upload.single('pro_img'), (req, res) => {
      try {
        const { pro_name,description } = req.body;
        const pro_img = req.file.filename; 
        const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
        const saveQuery = 'INSERT INTO products (pro_name, pro_img,description, created_at) VALUES (?, ?, ?,?)';
        db.query(saveQuery, [pro_name, pro_img,description, currentDate], (saveErr, saveRes) => {
          if (saveErr) {
            console.error("Error saving product data:", saveErr);
            res.status(500).json({ message: "Internal server error." });
          } else {
            res.status(200).json({ message: "Product data stored successfully." });
          }
        });
      } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ message: "Internal server error." });
      }
    });


    router.get('/getProductData',(req,res)=>{
        try{
            const getData = 'select * from products';
        db.query(getData,(getErr,getRes)=>{
            if(getErr){
                res.status(500).json({message:"Internal server error."})
            }else if(getRes.length === 0){
                res.status(404).json({message:"Product Data Not Found"})
            }else{
                res.status(200).json(getRes);
            }
        })
        }catch (error) {
            console.error("Error processing request:", error);
            res.status(500).json({ message: "Internal server error." });
          }
    })

    router.put('/update/:id', upload.single('pro_img'), (req, res) => {
        try {
            const pro_id = req.params.id;
            const { pro_name,description } = req.body;
            const pro_img = req.file ? req.file.filename : null;
            const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
            let updateData = '';
            let queryParams = [];
            if (pro_img !== null && pro_img !== 'null') {
                updateData = `UPDATE products SET pro_name = ?, pro_img = ?,description=? updated_at = ? WHERE pro_id = ?`;
                queryParams = [pro_name, pro_img,description, currentDate, pro_id];
            } else {
                updateData = `UPDATE products SET pro_name = ?,description=?, updated_at = ? WHERE pro_id = ?`;
                queryParams = [pro_name,description,currentDate, pro_id];
            }
            console.log("Query:", updateData);
            console.log("Query Parameters:", queryParams);
            db.query(updateData, queryParams, (updateErr, updateRes) => {
                if (updateErr) {
                    console.error("ERROR :", updateErr);
                    return res.status(500).json({ message: "Internal server error." });
                }
                res.status(200).json({ message: "Product Data updated successfully." });
            });
        } catch (error) {
            console.error("Error processing request:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    });
    
    


    router.delete('/delete/:id',(req,res)=>{
        try{
            const pro_id = req.params.id;
            const dltData = 'delete from products where pro_id = ?';
            db.query(dltData,[pro_id],(dltErr,dltRes)=>{
                if(dltErr){
                    res.status(500).json({message:"Internal server error."})
                    console.log("Error :",dltErr)
                }else{
                    res.status(200).json({message:"Product data deleted successfully."})
                }
            })
        }catch (error) {
            console.error("Error processing request:", error);
            res.status(500).json({ message: "Internal server error." });
          }
    })


    router.post('/saveProSpec', (req, res) => {
        try {
          const { specifications } = req.body; // Assuming specifications is an array of objects containing spec_name, spec_data, and pro_id
          const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
          console.log("Specification Data :",specifications)
          
          // Use Promise.all to execute all insert queries asynchronously
          Promise.all(specifications.map(spec => {
            const { pro_id, spec_name, spec_data } = spec;
            return new Promise((resolve, reject) => {
              const saveData = 'INSERT INTO pro_specification (pro_id, spec_name, spec_data, created_at) VALUES (?, ?, ?, ?)';
              db.query(saveData, [pro_id, spec_name, spec_data, currentDate], (saveErr, saveRes) => {
                if (saveErr) {
                  reject(saveErr);
                } else {
                  resolve();
                }
              });
            });
          }))
          .then(() => {
            res.status(200).json({ message: "Specification Data added successfully." });
          })
          .catch((error) => {
            console.error("Error processing request:", error);
            res.status(500).json({ message: "Internal server error." });
          });
        } catch (error) {
          console.error("Error processing request:", error);
          res.status(500).json({ message: "Internal server error." });
        }
      });
      

    router.get('/getProSpec',(req,res)=>{
        try{
            const pro_id = req.query.pro_id;
            const getData = 'SELECT spec.*, pro.pro_name FROM pro_specification spec INNER JOIN products pro ON spec.pro_id = pro.pro_id WHERE spec.pro_id = ?';
            db.query(getData,[pro_id],(getErr,getRes)=>{
                if(getErr){
                    res.status(500).json({message:"Internal server error."})
                }else if(getRes.length === 0){
                    res.status(404).json({message:"Module Not Found."})
                }else{
                    res.status(200).json(getRes)
                }
            })
        }catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ message: "Internal server error." });
      }
    })


    router.put('/specUpdate/:spec_id',(req,res)=>{
        try{
            const spec_id = req.params.spec_id;
            const {spec_name,spec_data} = req.body;
            const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
            const updateData = 'update pro_specification set spec_name=?,spec_data=?,updated_at=? where spec_id =?';
            db.query(updateData,[spec_name,spec_data,currentDate,spec_id],(updateErr,updateRes)=>{
                if(updateErr){
                    res.status(500).json({message:"Internal server error."})
                }else{
                    res.status(200).json({message:"Specification data updated successfully."}) 
                }
            })

        }catch(error){
            console.error("Error processing request:", error);
        res.status(500).json({ message: "Internal server error." });
        }
    })


    router.delete('/specDelete/:spec_id',(req,res)=>{
        try{
            const spec_id = req.params.spec_id;
            const dltData = 'delete from pro_specification where spec_id =?';
            db.query(dltData,[spec_id],(dltErr,dltRes)=>{
                if(dltErr){
                    res.status(500).json({message:"Internal server error."})
                }else{
                    res.status(200).json({message:"Specification data Deleted successfully."}) 
                }
            })
        }catch(error){
            console.error("Error processing request:", error);
        res.status(500).json({ message: "Internal server error." });
        }
    })
    router.get('/dashboardForProSale/:city?', (req, res) => {
        const city = req.params.city;
        console.log("City Name:", city);
        
        // Escape city parameter to prevent SQL injection
        const escapedCity = city ? db.escape(city) : 'NULL';
        
        const queries = {
            totalCustomers: `
                SELECT COUNT(*) AS totalCustomers 
                FROM customers
                ${city ? `WHERE cust_city = ${escapedCity}` : ''}
            `,
            totalProducts: `SELECT COUNT(*) AS totalProducts FROM products`,
            totalPurchases: `
                SELECT COUNT(*) AS totalPurchases 
                FROM cust_purch_logs
                ${city ? `JOIN customers c ON cust_purch_logs.cust_id = c.cust_id WHERE c.cust_city = ${escapedCity}` : ''}
            `,
            salesByProduct: `
                SELECT p.pro_name, SUM(cpd.quantity * cpd.price) AS totalSales 
                FROM cust_purch_details cpd
                JOIN products p ON cpd.pro_id = p.pro_id 
                JOIN cust_purch_logs cp ON cpd.cust_purch_log_id = cp.cust_purch_id
                JOIN customers c ON cp.cust_id = c.cust_id 
                ${city ? `WHERE c.cust_city = ${escapedCity}` : ''}
                GROUP BY p.pro_name
            `,
            salesByCustomer: `
                SELECT c.cust_name, c.cust_state, c.cust_city, SUM(cp.total) AS totalSales 
                FROM cust_purch_logs cp 
                JOIN customers c ON cp.cust_id = c.cust_id 
                ${city ? `WHERE c.cust_city = ${escapedCity}` : ''}
                GROUP BY c.cust_name, c.cust_state, c.cust_city
            `,
            paymentTypeDistribution: `
                SELECT payment_type, COUNT(*) AS count 
                FROM cust_purch_logs 
                ${city ? `JOIN customers c ON cust_purch_logs.cust_id = c.cust_id WHERE c.cust_city = ${escapedCity}` : ''}
                GROUP BY payment_type
            `
        };
    
        const promises = Object.keys(queries).map(key => {
            return new Promise((resolve, reject) => {
                db.query(queries[key], (err, results) => {
                    if (err) reject(err);
                    else resolve({ key, results });
                });
            });
        });
    
        Promise.all(promises)
            .then(results => {
                const data = results.reduce((acc, { key, results }) => {
                    acc[key] = results;
                    return acc;
                }, {});
                res.status(200).json(data);
            })
            .catch(err => {
                res.status(500).json({ message: "Internal server error.", error: err });
            });
    });
    
    
  
    return router;
  };
  