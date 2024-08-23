const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');

module.exports = (db) => {
    router.get('/leadsData', async (req, res) => {
        console.log("runLeadsData");
        try {
            const { startTime, endTime } = req.query;
            const currentDate = moment();
            const getApiLogs = 'SELECT * FROM api_logs ORDER BY log_id DESC LIMIT 1';
    
            db.query(getApiLogs, async (logErr, logRes) => {
                if (logErr) {
                    console.error('Error fetching API logs:', logErr);
                    return res.status(500).json({ message: "Internal Server Error." });
                }
    
                if (logRes.length > 0) {
                    const apiHitTime = moment(logRes[0].api_hit_time);
                    const diffMinutes = moment.duration(currentDate.diff(apiHitTime)).asMinutes();
    
                    if (diffMinutes > 1) { // Change to 1 minute
                        if (startTime && endTime) {
                            console.log(`${startTime},end:${endTime}`);
                            const start = moment(startTime).format("DD-MM-YYYY HH:mm:ss");
                            const end = moment(endTime).format("DD-MM-YYYY HH:mm:ss");
                            console.log(`starttime:${start},endtime${end}`);
                            try {
                                const response = await axios.get(`https://mapi.indiamart.com/wservce/crm/crmListing/v2/?glusr_crm_key=mR20Er1s5HfDQPep4XWK7l+Pp1LDnzI=&start_time=${start}&end_time=${end}`);
                                const data = response.data;
                                // console.log(data);
    
                                const api_hit_time = moment().format('YYYY-MM-DD HH:mm:ss');
                                const start_date = moment(startTime).format('YYYY-MM-DD HH:mm:ss');
                                const end_date = moment(endTime).format('YYYY-MM-DD HH:mm:ss');
                                const count = data.TOTAL_RECORDS;
                                const res_code = data.CODE;
                                const message = data.MESSAGE || `Success. ${count} leads were returned for this API request.`;
    
                                // Save API log
                                const saveApiLog = 'INSERT INTO api_logs (api_hit_time, start_date, end_date, count, res_code, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
                                db.query(saveApiLog, [api_hit_time, start_date, end_date, count, res_code, message, api_hit_time], async (saveErr) => {
                                    if (saveErr) {
                                        console.error('Error saving API log:', saveErr);
                                        return res.status(500).json({ message: "API log not added" });
                                    }
    
                                    // Insert each lead into the leads table
                                    const saveLead = 'INSERT INTO leads_data (unique_query_id, query_type, query_time, sender_name, sender_mobile, sender_email, subject, sender_company, sender_address, sender_city, sender_state, sender_pincode, sender_country_iso, sender_mobile_alt, sender_phone, sender_phone_alt, sender_email_alt, query_product_name, query_message, query_mcat_name, call_duration, receiver_mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                                    const leadPromises = data.RESPONSE.map(lead => {
                                        return new Promise((resolve, reject) => {
                                            const checkDuplicate = 'SELECT COUNT(*) AS count FROM leads_data WHERE unique_query_id = ?';
                                            db.query(checkDuplicate, [lead.UNIQUE_QUERY_ID], (checkErr, checkRes) => {
                                                if (checkErr) {
                                                    console.error('Error checking for duplicate lead:', checkErr);
                                                    return reject(checkErr);
                                                }
    
                                                if (checkRes[0].count === 0) {
                                                    const values = [
                                                        lead.UNIQUE_QUERY_ID,
                                                        lead.QUERY_TYPE,
                                                        lead.QUERY_TIME,
                                                        lead.SENDER_NAME,
                                                        lead.SENDER_MOBILE,
                                                        lead.SENDER_EMAIL || null,
                                                        lead.SUBJECT || null,
                                                        lead.SENDER_COMPANY || null,
                                                        lead.SENDER_ADDRESS || null,
                                                        lead.SENDER_CITY || null,
                                                        lead.SENDER_STATE || null,
                                                        lead.SENDER_PINCODE || null,
                                                        lead.SENDER_COUNTRY_ISO,
                                                        lead.SENDER_MOBILE_ALT || null,
                                                        lead.SENDER_PHONE || null,
                                                        lead.SENDER_PHONE_ALT || null,
                                                        lead.SENDER_EMAIL_ALT || null,
                                                        lead.QUERY_PRODUCT_NAME,
                                                        lead.QUERY_MESSAGE,
                                                        lead.QUERY_MCAT_NAME,
                                                        lead.CALL_DURATION || null,
                                                        lead.RECEIVER_MOBILE || null
                                                    ];
    
                                                    db.query(saveLead, values, (err) => {
                                                        if (err) {
                                                            console.error('Error saving lead:', err);
                                                            return reject(err);
                                                        }
                                                        resolve();
                                                    });
                                                } else {
                                                    resolve(); // If it's a duplicate, just resolve
                                                }
                                            });
                                        });
                                    });
    
                                    try {
                                        // Wait for all leads to be inserted
                                        await Promise.all(leadPromises);
                                        return res.status(200).json({ message: "API logs and leads data stored successfully.", data });
                                    } catch (insertError) {
                                        console.error('Error inserting leads:', insertError);
                                        return res.status(500).json({ message: 'Error saving leads' });
                                    }
                                });
                            } catch (apiErr) {
                                console.error('Error fetching data from external API:', apiErr);
                                return res.status(500).json({ error: 'Error fetching data from external API' });
                            }
                        } else {
                            return res.status(400).json({ error: 'Missing startTime or endTime parameters' });
                        }
                    } else {
                        return res.status(429).json({ message: "It is advised to hit this API once every minute, but it seems that you have crossed this limit. Please try again after 5 minute." });
                    }
                } else {
                    return res.status(404).json({ message: "No API logs found." });
                }
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    


    
    // =====================================================


    router.post('/saveEmpLeads', (req, res) => {
        console.log("saveEmpLeads");
        const {
            emp_id,
            leads_id,
            leads_name,
            leads_mobile,
            leads_email,
            leads_company,
            leads_address,
            leads_state,
            leads_city,
            product_name,
            call_Attended,
            Call_Discussion,
            remember,
            reminder_date,
        } = req.body;
        const getdata = req.body
    console.log(getdata)
        const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
        const date =moment().format('YYYY-MM-DD');
    
        const saveLeads = `INSERT INTO following_leads
            (
                emp_id,
                leads_id,
                leads_name,
                leads_mobile,
                leads_email,
                leads_company,
                leads_address,
                leads_state,
                leads_city,
                product_name,
                call_Attended,
                Call_Discussion,
                remember,
                reminder_date,
                created_at,
                date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?)`;
    
        const params = [
            emp_id ?? null,
            leads_id ?? null,
            leads_name ?? null,
            leads_mobile ?? null,
            leads_email ?? null,
            leads_company ?? null,
            leads_address ?? null,
            leads_state ?? null,
            leads_city ?? null,
            product_name ?? null,
            call_Attended ?? null,
            Call_Discussion ?? null,
            remember ?? null,
            reminder_date || null,
            currentDate,
            date

        ];
    
        db.query(saveLeads, params, (err, results) => {
            if (err) {
                console.error("Error saving leads data:", err);
                res.status(500).json({ message: "Internal server error." });
            } else {
                console.log("Leads data added successfully.");
                res.status(200).json({ message: "Leads data added successfully." });
            }
        });
    });

// =======================================================================================================================
    
    router.get('/getFollowingLeadsMobile',(req,res)=>{
        // console.log("run");
        const getData = 'select leads_mobile from following_leads';
        db.query(getData,(getErr,getRes)=>{
            if(getErr){
                res.status(500).json({message:"Internal server error."});
            }else if(getRes.length == 0){
                res.status(404).json({message:"Following Leads Not Found."})
            }else{
                res.status(200).json(getRes)
            }
        })
    })
    
// ==================================================================

    router.get('/followingLeadsByEmpId', (req, res) => {
        const { emp_id, reminderDate, startDate, endDate, state, city } = req.query;
        let query = `SELECT leads.*, emp.emp_name 
        FROM following_leads leads 
        INNER JOIN employee emp 
        ON emp.emp_id = leads.emp_id
        WHERE leads.emp_id = ${emp_id}`;

    
        if (reminderDate != 'null' && reminderDate !== undefined) {
            query += ` AND leads.reminder_date = '${reminderDate}'`;
        }
    
        if (startDate && endDate && endDate != 'null') {
            query += ` AND leads.created_at BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate && startDate != 'null') {
            const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
            query += ` AND leads.created_at BETWEEN '${startDate}' AND '${currentDate}'`;
        }
    
        if (state && state != 'null') {
            query += ` AND leads.leads_state = '${state}'`;
        }
    
        if (city && city != 'null') {
            query += ` AND leads.leads_city = '${city}'`;
        }
    
        query += " ORDER BY leads.reminder_date ASC";
    
        // console.log("Query:", query);
    
        db.query(query, (getErr, getRes) => {
            if (getErr) {
                res.status(500).json({ message: "Internal Server Error. Could not fetch Employee Following Leads." });
                console.log("Error :", getErr)
            } else {
                res.status(200).json(getRes);
                // console.log("Data :", getRes)
            }
        });
    });
    

// ======================================================

    router.get('/empFollowLeadsForAdmin', (req, res) => {
        const { reminderDate, startDate, endDate, state, city, emp_id } = req.query;
        let query = `SELECT leads.*, emp.emp_name 
                     FROM following_leads leads 
                     INNER JOIN employee emp 
                     ON emp.emp_id = leads.emp_id`;
    
        if (emp_id && emp_id != 'null') {
            query += ` WHERE leads.emp_id = '${emp_id}'`;
        }
    
        if (reminderDate != 'null' && reminderDate !== undefined) {
            query += ` AND leads.reminder_date = '${reminderDate}'`;
        }
    
        if (startDate && endDate && endDate !='null') {
            query += ` AND leads.created_at BETWEEN '${startDate}' AND '${endDate}'`;
        }else if(startDate && startDate !='null'){
            const currentDate = moment().format('YYYY-MM-DD HH:mm:ss')
            query += ` AND leads.created_at BETWEEN '${startDate}' AND '${currentDate}'`;
        }
    
        if (state && state !='null') {
            query += ` AND leads.leads_state = '${state}'`;
        }
    
        if (city && city !='null') {
            query += ` AND leads.leads_city = '${city}'`;
        }
    
        query += " ORDER BY leads.reminder_date ASC";
    
        // console.log("Query:", query);
    
        db.query(query, (getErr, getRes) => {
            if (getErr) {
                console.log("Error :", getErr);
                res.status(500).json({ message: "Internal Server Error. Could not fetch Employee Following Leads." });
            } else {
                res.status(200).json(getRes);
                // console.log("Data :", getRes);
            }
        });
    });
    
    // =====================================================================================
router.put('/updateFlwLeadForEmp/:id',(req,res)=>{
    try{
        const follow_id = req.params.id;
        const {
            leads_name,
            leads_mobile,
            leads_email,
            leads_company,
            leads_address,
            leads_state,
            leads_city,
            product_name,
            Call_Discussion,
            remember,
            reminder_date
        } = req.body;
        const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
        const updateLeads = `
    UPDATE following_leads
    SET
        leads_name = ?,
        leads_mobile = ?,
        leads_email = ?,
        leads_company = ?,
        leads_address = ?,
        leads_state = ?,
        leads_city = ?,
        product_name = ?,
        Call_Discussion = ?,
        remember = ?,
        reminder_date = ?,
        updated_at = ?
    WHERE
        follow_id = ?
`;

            const params = [
                leads_name ?? null,
                leads_mobile ?? null,
                leads_email ?? null,
                leads_company ?? null,
                leads_address ?? null,
                leads_state ?? null,
                leads_city ?? null,
                product_name ?? null,
                Call_Discussion ?? null,
                remember ?? null,
                reminder_date ?? null,
                currentDate,
                follow_id
            ];
            db.query(updateLeads,params,(updateErr,updateRes)=>{
                if(updateErr){
                    res.status(500).json({message:"Internal server error."})
                    console.log("Error :",updateErr)
                }else{
                    res.status(200).json({message:"Leads Data updated successfully."})
                }
            })
    }catch(error){
        res.status(500).json({message :"Internal server error."})
    }
})

// =============================================================================
    
    // router.get('/leadsCountForDashboard',(req,res)=>{
    //     const currentDate = moment().format("YYYY-MM-DD");
    //     console.log(currentDate);
    //     const getData = `
    //     SELECT COUNT(CASE WHEN reminder_date = '${currentDate}' THEN 1 END) AS reminder_date_count,
    //     COUNT(CASE WHEN DATE(created_at) = '${currentDate}' THEN 1 END) AS created_at_count FROM 
    //     following_leads`;
    //     db.query(getData,(getErr,getRes)=>{
    //         if(getErr){
    //             res.status(500).json({message:"Internal server error."})
    //         }else if(getRes.length === 0){
    //             res.status(404).json({message:"Data not fount."})
    //         }
    //         else{
    //             res.status(200).json(getRes[0])
    //         }
    //     })
    // })
    
    router.get('/leadsCountForDashboard', (req, res) => {
        const currentDate = moment().format("YYYY-MM-DD");
        // console.log(currentDate);
        const getData = `
            SELECT COUNT(CASE WHEN reminder_date = '${currentDate}' THEN 1 END) AS reminder_date_count,
                   COUNT(CASE WHEN DATE(created_at) = '${currentDate}' THEN 1 END) AS created_at_count,
                   GROUP_CONCAT(DISTINCT CONCAT(emp_id, ':', leads_name, ':', leads_mobile) SEPARATOR '; ') AS leads_details
            FROM following_leads
            WHERE DATE(created_at) = '${currentDate}'`;
        db.query(getData, (getErr, getRes) => {
            if (getErr) {
                res.status(500).json({ message: "Internal server error." });
            } else if (getRes.length === 0) {
                res.status(404).json({ message: "Data not found." });
            } else {
                res.status(200).json(getRes[0]);
            }
        });
    });
    

    // Endpoint to get all employees
    router.get('/emplyees', (req, res) => {
        console.log("Fetching employees");
        const query = 'SELECT emp_id, emp_name FROM employee WHERE is_active = 1'; // Optionally filter by active employees
    
        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Internal server error." });
            }
            res.status(200).json(results);
        });
    });
    
    
    
    
// =================================================================================

  
router.get('/leadsCountForEmpDashboard/:empId', (req, res) => {
    const empId = req.params.empId;
    const currentDate = moment().format("YYYY-MM-DD");
    const getData = `
        SELECT 
            COUNT(CASE WHEN reminder_date = '${currentDate}' THEN 1 END) AS reminder_date_count,
            COUNT(CASE WHEN DATE(created_at) = '${currentDate}' THEN 1 END) AS created_at_count 
        FROM 
            following_leads
        WHERE 
            emp_id = '${empId}'`;

    db.query(getData, (getErr, getRes) => {
        if (getErr) {
            res.status(500).json({ message: "Internal server error." });
        } else if (getRes.length === 0) {
            res.status(404).json({ message: "Data not found." });
        } else {
            res.status(200).json(getRes[0]);
        }
    });
});

// Endpoint to fetch detailed lead data for today
router.get('/todayFollowLeadsDetails/:empId', (req, res) => {
    const empId = req.params.empId;
    const currentDate = moment().format("YYYY-MM-DD");
    const getDetails = `
        SELECT leads_name, leads_mobile, leads_email, product_name
        FROM following_leads
        WHERE emp_id = '${empId}' AND DATE(created_at) = '${currentDate}'`;

    db.query(getDetails, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).send('Error fetching data');
        } else {
            res.status(200).json(results);
        }
    });
});


    router.get('/callNotAttended', (req, res) => {
        console.log("rrrr");
        const getData = `SELECT * FROM following_leads WHERE call_Attended = 'no'`;
        db.query(getData, (getErr, getRes) => {
            if (getErr) {
                res.status(500).json({ message: "Internal server error." });
            } else if (getRes.length === 0) {
                res.status(404).json({ message: "Data not found." });
            } else {
                res.status(200).json(getRes); // Return the full array
            }
        });
    });
    router.get('/callNotAttendedDashBoard', (req, res) => {
        const currentDate = moment().format("YYYY-MM-DD");
        // console.log("Fetching leads where call_Attended = 'no' for today");
      
        const getCountQuery = `
          SELECT COUNT(*) AS count 
          FROM following_leads 
          WHERE call_Attended = 'no' AND DATE(date) = '${currentDate}'
        `;
        const getDetailsQuery = `
          SELECT * 
          FROM following_leads 
          WHERE call_Attended = 'no' AND DATE(date) = '${currentDate}'
        `;
      
        db.query(getCountQuery, (countErr, countRes) => {
          if (countErr) {
            res.status(500).json({ message: "Internal server error." });
          } else {
            const count = countRes[0].count;
            db.query(getDetailsQuery, (detailsErr, detailsRes) => {
              if (detailsErr) {
                res.status(500).json({ message: "Internal server error." });
              } else {
                res.status(200).json({ count, details: detailsRes });
              }
            });
          }
        });
      })

    
    

    return router;
}
