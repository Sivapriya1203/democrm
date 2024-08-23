const express = require('express');
const router = express.Router();
const moment = require('moment');

module.exports = (db) =>{
    router.post('/addCustPurch', (req, res) => {
        const {
            cust_id,
            pro_id,
            quantity,
            price,
            payment_type,
            payment_amount,
            balance,
            total,
            dispatchdate
        } = req.body;
        console.log(cust_id, pro_id, quantity, price, payment_type, payment_amount, balance, total, dispatchdate);
    
        const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    
        // Insert into cust_purch_logs
        const insertLog = `INSERT INTO cust_purch_logs (cust_id, payment_type, payment_amount, balance, total, dispatchdate, created_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
        db.query(insertLog, [cust_id, payment_type, payment_amount, balance, total, dispatchdate, currentDate], (logErr, logRes) => {
            if (logErr) {
                console.error("Error inserting into cust_purch_logs:", logErr);
                return res.status(500).json({ message: "Internal server error while inserting into cust_purch_logs.", error: logErr });
            }
    
            const logId = logRes.insertId;
    
            // Prepare data for cust_purch_details
            const details = pro_id.map((id, index) => [
                logId,
                id,
                quantity[index],
                price[index]
            ]);
    
            console.log("Details array:", details);
    
            // Insert into cust_purch_details
            const insertDetails = `INSERT INTO cust_purch_details (cust_purch_log_id, pro_id, quantity, price)
                                   VALUES ?`;
    
            db.query(insertDetails, [details], (detailsErr) => {
                if (detailsErr) {
                    console.error("Error inserting into cust_purch_details:", detailsErr);
                    return res.status(500).json({ message: "Internal server error while inserting into cust_purch_details.", error: detailsErr });
                }
                
                // Prepare data for sales
                const salesData = pro_id.map((id, index) => [
                    id,
                 // Modify as needed
                    quantity[index],
                    price[index],
                    0,  // gst, modify as needed
                    quantity[index] * price[index], // total
                    currentDate,  // created_at
                    currentDate   // updated_at
                ]);
    
                console.log("Sales data array:", salesData);
    
                // Insert into sales
                const insertSales = `INSERT INTO sales (pro_id, quantity, price, gst, total, created_at, updated_at)
                                     VALUES ?`;
    
                db.query(insertSales, [salesData], (salesErr) => {
                    if (salesErr) {
                        console.error("Error inserting into sales:", salesErr);
                        return res.status(500).json({ message: "Internal server error while inserting into sales.", error: salesErr });
                    }
                    console.log(salesData);
                    
                    res.status(200).json({ message: "Customer purchase data added successfully." });
                });
            });
        });
    });
    

    // In your backend routes file (e.g., custPurchRoutes.js)
// In your backend routes file (e.g., custPurchRoutes.js)
router.post('/markAsDelivered/:id', (req, res) => {
    const { id } = req.params;
    const currentTime = new Date();

    // Check if the delivery status is already set
    const checkQuery = 'SELECT deliveryed FROM cust_purch_logs WHERE cust_purch_id = ?';
    db.query(checkQuery, [id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Internal server error.' });

        if (result.length === 0) return res.status(404).json({ message: 'Data not found.' });

        if (result[0].deliveryed !== null) {
            return res.status(400).json({ message: 'Already marked as delivered.' });
        }

        const updateData = {
            deliveryed: currentTime,
            updated_at: currentTime
        };

        const updateQuery = 'UPDATE cust_purch_logs SET ? WHERE cust_purch_id = ?';
        db.query(updateQuery, [updateData, id], (err) => {
            if (err) return res.status(500).json({ message: 'Internal server error.' });
            res.status(200).json({ message: 'Delivery status updated successfully.' });
        });
    });
});


router.get('/getCustPurchData', (req, res) => {
    const emp_id = req.query.emp_id;

    // SQL query to fetch customer purchase data with aggregated product details
    const query = `
       SELECT 
    cust.cust_name,
    cust.cust_mobile,
    cust.cust_email,
    GROUP_CONCAT(pro.pro_name SEPARATOR ', ') AS product_names,
    cust_purch.cust_purch_id AS cust_purch_id,
    cust_purch.payment_type,
    cust_purch.payment_amount,
    cust_purch.balance,
    cust_purch.total,
    cust_purch.dispatchdate,
    cust_purch.deliveryed,
    cust_purch.created_at,
    cust_purch.updated_at,
    GROUP_CONCAT(det.quantity) AS quantities,
    GROUP_CONCAT(det.price) AS prices
FROM 
    cust_purch_logs cust_purch
INNER JOIN 
    customers cust ON cust.cust_id = cust_purch.cust_id
INNER JOIN 
    cust_purch_details det ON det.cust_purch_log_id = cust_purch.cust_purch_id
INNER JOIN 
    products pro ON pro.pro_id = det.pro_id
WHERE 
    cust.emp_id = ?
GROUP BY 
    cust_purch.cust_purch_id

    `;

    db.query(query, [emp_id], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('Server error');
        } else {
            res.json(results);
            console.log(results);
            
        }
    });
});

router.get('/getCustPurchDataForAdmin', (req, res) => {
    try {
        // SQL query to fetch customer purchase data with aggregated product details
        const query = `
            SELECT 
                cust.cust_name,
                cust.cust_mobile,
                cust.cust_email,
                GROUP_CONCAT(pro.pro_name SEPARATOR ', ') AS product_names,
                cust_purch.cust_purch_id AS cust_purch_id,
                cust_purch.payment_type,
                cust_purch.payment_amount,
                cust_purch.balance,
                cust_purch.total,
                cust_purch.dispatchdate,
                cust_purch.deliveryed,
                cust_purch.created_at,
                cust_purch.updated_at,
                GROUP_CONCAT(det.quantity) AS quantities,
                GROUP_CONCAT(det.price) AS prices
            FROM 
                cust_purch_logs cust_purch
            INNER JOIN 
                customers cust ON cust.cust_id = cust_purch.cust_id
            INNER JOIN 
                cust_purch_details det ON det.cust_purch_log_id = cust_purch.cust_purch_id
            INNER JOIN 
                products pro ON pro.pro_id = det.pro_id
            GROUP BY 
                cust_purch.cust_purch_id
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching data:', err);
                res.status(500).json({ message: "Internal server error." });
            } else if (results.length === 0) {
                res.status(404).json({ message: "Customer purchase data not found." });
            } else {
                res.status(200).json(results);
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "Internal server error." });
    }
});


router.put('/updateCustPurch/:id', (req, res) => {
    console.log("Update Request Body:", req.body);  // Log the request body

    const { 
        cust_id, 
        pro_id, 
        quantity, 
        price, 
        payment_type, 
        payment_amount, 
        balance, 
        total, 
        dispatchdate 
    } = req.body;

    const purchaseId = req.params.id;
    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

    // Validate required fields
    if (!pro_id || !quantity || !price) {
        return res.status(400).json({ message: "Required fields are missing." });
    }

    // Check if the purchaseId exists
    const checkExistence = `SELECT 1 FROM cust_purch_logs WHERE cust_purch_id = ?`;

    db.query(checkExistence, [purchaseId], (existErr, result) => {
        if (existErr) {
            console.error("Error checking existence of cust_purch_id:", existErr);
            return res.status(500).json({ message: "Internal server error while checking cust_purch_id.", error: existErr });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Purchase record not found." });
        }

        // Update cust_purch_logs
        const updateLog = `UPDATE cust_purch_logs 
                            SET payment_type = ?, payment_amount = ?, balance = ?, total = ?, dispatchdate = ?, updated_at = ? 
                            WHERE cust_purch_id = ?`;

        db.query(updateLog, [payment_type, payment_amount, balance, total, dispatchdate, currentDate, purchaseId], (logErr) => {
            if (logErr) {
                console.error("Error updating cust_purch_logs:", logErr);
                return res.status(500).json({ message: "Internal server error while updating cust_purch_logs.", error: logErr });
            }

            // Prepare data for cust_purch_details
            const details = pro_id.map((id, index) => ({
                pro_id: id,
                quantity: quantity[index],
                price: price[index]
            }));

            // Update existing details or insert if not exist
            const updateOrInsertPromises = details.map(detail => {
                return new Promise((resolve, reject) => {
                    const { pro_id, quantity, price } = detail;

                    // Check if the detail exists
                    const checkDetailExistence = `SELECT 1 FROM cust_purch_details WHERE cust_purch_log_id = ? AND pro_id = ?`;

                    db.query(checkDetailExistence, [purchaseId, pro_id], (checkErr, checkResult) => {
                        if (checkErr) {
                            return reject({ message: "Error checking existence of detail.", error: checkErr });
                        }

                        if (checkResult.length > 0) {
                            // Update existing detail
                            const updateDetail = `UPDATE cust_purch_details 
                                                SET quantity = ?, price = ?
                                                WHERE cust_purch_log_id = ? AND pro_id = ?`;

                            db.query(updateDetail, [quantity, price, purchaseId, pro_id], (updateErr) => {
                                if (updateErr) {
                                    return reject({ message: "Error updating detail.", error: updateErr });
                                }
                                resolve();
                            });
                        } else {
                            // Insert new detail
                            const insertDetail = `INSERT INTO cust_purch_details (cust_purch_log_id, pro_id, quantity, price)
                                                  VALUES (?, ?, ?, ?)`;

                            db.query(insertDetail, [purchaseId, pro_id, quantity, price], (insertErr) => {
                                if (insertErr) {
                                    return reject({ message: "Error inserting detail.", error: insertErr });
                                }
                                resolve();
                            });
                        }
                    });
                });
            });

            Promise.all(updateOrInsertPromises)
                .then(() => res.status(200).json({ message: "Customer purchase data updated successfully." }))
                .catch((err) => {
                    console.error(err.message);
                    res.status(500).json({ message: "Internal server error while updating details.", error: err.error });
                });
        });
    });
});

router.delete('/deleteCustPurch/:cust_purch_id', async (req, res) => {
    const cust_purch_id = req.params.cust_purch_id;

    try {
        // Delete from cust_purch_details
        await new Promise((resolve, reject) => {
            db.query('DELETE FROM cust_purch_details WHERE cust_purch_log_id = ?', [cust_purch_id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        // Delete from cust_purch_logs
        await new Promise((resolve, reject) => {
            db.query('DELETE FROM cust_purch_logs WHERE cust_purch_id = ?', [cust_purch_id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        res.status(200).json({ message: "Customer purchase logs deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
});




    router.get('/custPurchDashboard', (req, res) => {
        let date = req.query.date; // Get the date parameter from the query string
    
        let getData;
        let getParams = []; // Parameters for the prepared statement
    
        if (date) {
            // If date is provided, fetch data for that particular date
            getData = `
                SELECT
                    c.cust_name,
                    SUM(cp.total) AS total_amount,
                    SUM(cp.payment_amount) AS paid_amount,
                    SUM(cp.balance) AS balance_amount
                FROM
                    cust_purch_logs cp
                JOIN
                    customers c ON cp.cust_id = c.cust_id
                WHERE
                    DATE(cp.created_at) = ?
                GROUP BY
                    c.cust_name
            `;
            getParams.push(date); // Push the date parameter to the params array
        } else {
            // If no date is provided, fetch all data
            getData = `
                SELECT
                    c.cust_name,
                    SUM(cp.total) AS total_amount,
                    SUM(cp.payment_amount) AS paid_amount,
                    SUM(cp.balance) AS balance_amount
                FROM
                    cust_purch_logs cp
                JOIN
                    customers c ON cp.cust_id = c.cust_id
                GROUP BY
                    c.cust_name
            `;
        }
        
        const getGrandTotal = `
            SELECT SUM(total) AS grand_total FROM cust_purch_logs
        `;
    
        db.query(getData, getParams, (getErr, getRes) => {
            if (getErr) {
                res.status(500).json({ message: "Internal server error." });
            } else if (getRes.length === 0) {
                res.status(404).json({ message: "Data not found." });
            } else {
                db.query(getGrandTotal, (grandErr, grandRes) => {
                    if (grandErr) {
                        res.status(500).json({ message: "Internal server error." });
                    } else {
                        const grandTotal = grandRes[0].grand_total;
                        const dataWithGrandTotal = getRes.map(customer => ({
                            ...customer,
                            grand_total: grandTotal
                        }));
                        res.status(200).json(dataWithGrandTotal);
                    }
                });
            }
        });
    });
    

    // calculate total purchase amount 
    router.get('/totalPurchaseAmount', (req, res) => {
        const { filter } = req.query; // Get the filter parameter from the query string
    
        let getData;
        let getParams = []; // Parameters for the prepared statement
    
        if (filter === 'days') {
            // Filter by days in the current month
            const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
            const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
            getData = `
                SELECT
                    DATE(cp.created_at) AS date,
                    SUM(cp.total) AS total_amount
                FROM
                    cust_purch_logs cp
                WHERE
                    DATE(cp.created_at) BETWEEN ? AND ?
                GROUP BY
                    DATE(cp.created_at)
                ORDER BY
                    DATE(cp.created_at)
            `;
            getParams = [startOfMonth, endOfMonth];
        } else if (filter === 'months') {
            // Filter by months in the current year
            const startOfYear = moment().startOf('year').format('YYYY-MM-DD');
            const endOfYear = moment().endOf('year').format('YYYY-MM-DD');
            getData = `
                SELECT
                    MONTH(cp.created_at) AS month,
                    SUM(cp.total) AS total_amount
                FROM
                    cust_purch_logs cp
                WHERE
                    DATE(cp.created_at) BETWEEN ? AND ?
                GROUP BY
                    MONTH(cp.created_at)
                ORDER BY
                    MONTH(cp.created_at)
            `;
            getParams = [startOfYear, endOfYear];
        } else if (filter === 'years') {
            // Filter by years and show data for individual years
            getData = `
                SELECT
                    YEAR(cp.created_at) AS year,
                    SUM(cp.total) AS total_amount
                FROM
                    cust_purch_logs cp
                GROUP BY
                    YEAR(cp.created_at)
                ORDER BY
                    YEAR(cp.created_at)
            `;
        } else if (filter === 'allYears') {
            // Retrieve total purchase amount for all years
            getData = `
                SELECT
                    YEAR(cp.created_at) AS year,
                    SUM(cp.total) AS total_amount
                FROM
                    cust_purch_logs cp
                GROUP BY
                    YEAR(cp.created_at)
                ORDER BY
                    YEAR(cp.created_at)
            `;
        } else {
            return res.status(400).json({ message: "Invalid filter parameter. Use 'days', 'months', 'years', or 'allYears'." });
        }
    
        db.query(getData, getParams, (getErr, getRes) => {
            if (getErr) {
                res.status(500).json({ message: "Internal server error." });
            } else if (getRes.length === 0) {
                res.status(404).json({ message: "Data not found." });
            } else {
                res.status(200).json(getRes);
            }
        });
    });
    router.get('/api/orders', async (req, res) => {
        console.log("runOrders");
        try {
            const [rows] = await db.promise().query(`
                SELECT 
                    c.cust_name,
                    p.pro_name,
                    cpd.quantity,
                    cpd.price,
                    cpl.payment_type,
                    cpl.payment_amount,
                    cpl.balance,
                    cpl.total,
                    cpl.dispatchdate,
                    cpl.deliveryed,
                    CASE
                        WHEN cpl.deliveryed IS NULL AND cpl.dispatchdate >= CURRENT_DATE THEN 'Pending'
                        WHEN cpl.dispatchdate < CURRENT_DATE AND cpl.deliveryed IS NULL THEN 'Overdue'
                        ELSE 'Delivered'
                    END AS status
                FROM 
                    cust_purch_logs cpl
                    JOIN customers c ON cpl.cust_id = c.cust_id
                    JOIN cust_purch_details cpd ON cpl.cust_purch_id = cpd.cust_purch_log_id
                    JOIN products p ON cpd.pro_id = p.pro_id
                WHERE 
                    cpl.deliveryed IS NULL
                ORDER BY 
                    cpl.cust_purch_id;
            `);
            res.json(rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error fetching orders' });
        }
    });
    




























return router;
}
