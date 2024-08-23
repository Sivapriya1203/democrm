const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');

module.exports = (db,transporter) =>{

  router.get('/',(req,res)=>{
    const getData = 'select emp.*,role.role,dept.dept_name,lang.language_name from employee emp inner join department dept on emp.dept_id = dept.dept_id inner join role role on emp.role_id = role.role_id inner join languages lang on emp.lang_id = lang.lang_id';
    db.query(getData,(err,result)=>{
      if(err){
        res.status(500).json({message:"Internal server error."});
      }else if(result.length === 0){
        res.status(404).json({message:"Employee Data not found."});
      }else{
        res.status(200).json(result)
      }
    })
  })

  router.get('/name/:empId', (req, res) => {
    const empId = req.params.empId;
  
    const query = 'SELECT emp_name FROM employee WHERE emp_id = ?';
  
    db.query(query, [empId], (err, result) => {
      if (err) {
        console.error('Error fetching employee name:', err);
        res.status(500).json({ message: "Internal server error." });
      } else if (result.length === 0) {
        res.status(404).json({ message: "Employee not found." });
      } else {
        res.status(200).json({ emp_name: result[0].emp_name });
      }
    });
  });
  
  router.get('/:id/state', async (req, res) => {
    const employeeId = req.params.id;
  
    try {
      const [rows] = await db.query('SELECT state FROM employees WHERE id = ?', [employeeId]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Employee not found' });
      }
  
      res.json({ state: rows[0].state });
    } catch (error) {
      console.error('Error fetching employee state:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

  router.post('/saveEmp', (req, res) => {
    const { dept_id, role_id, lang_id, emp_name, emp_email, emp_mobile, state, dist, city, hire_date } = req.body;

    if (!dept_id || !role_id || !lang_id || !emp_name || !emp_email || !emp_mobile || !state || !dist || !city || !hire_date) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const thankingMsg = "Thank you for joining our company! We are thrilled to have you on board.";
    const credentialsMsg = `Your username is: ${emp_email} \n Your password is: ${emp_mobile}`;

    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const saveData = 'insert into employee(dept_id,role_id,lang_id,emp_name,emp_email,emp_mobile,state,dist,city,hire_date,created_at) values(?,?,?,?,?,?,?,?,?,?,?)';
    db.query(saveData, [dept_id,role_id,lang_id,emp_name,emp_email,emp_mobile,state,dist,city,hire_date,currentDate], (err, results) => {
        if (err) {
            console.error("Error saving employee data:", err);
            return res.status(500).json({ message: "Internal server error." });
        } else {
            console.log("Employee data added successfully.");
            const empMail = transporter.sendMail({
              from: "asglobalsofttech@gmail.com",
              to: emp_email,
              subject: "Employee Credentials",
              html: `<h1>Hello ${emp_name},</h1>
              <p>${thankingMsg}</p>
              <p>${credentialsMsg}</p>`
          });
          
          empMail.then(() => {
              console.log("Email sent successfully.");
          }).catch((error) => {
              console.error("Error sending email:", error);
          });
          
            return res.status(200).json({ message: "Employee data added successfully." });
        }
    });
});

  router.put('/update/:id',(req,res)=>{
    const emp_id = req.params.id;
    console.log("Employee Id :",emp_id)
    const {dept_id,role_id,lang_id,emp_name,emp_email,emp_mobile,state,dist,city,hire_date} = req.body;
    console.log("Employee Data :",dept_id,role_id,lang_id,emp_name,emp_email,emp_mobile,state,dist,city,hire_date)
    if(!dept_id || !role_id || !lang_id || !emp_name || !emp_email || !emp_mobile || !state || !dist || !city || !hire_date){
      console.log("All field are required")
    }
    const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    const updateData = 'update employee set dept_id=?,role_id=?,lang_id=?,emp_name=?,emp_email=?,emp_mobile=?,state=?,dist=?,city=?,hire_date=?,updated_at=? where emp_id=?';
    db.query(updateData,[dept_id,role_id,lang_id,emp_name,emp_email,emp_mobile,state,dist,city,hire_date,currentDate,emp_id],(err,result)=>{
      if(err){
        res.status(500).json({message:"Internal server error."})
        console.log("Employee Data is not updated :",err)
      }else{
        res.status(200).json({message:"Employee Data Updated successfully."})
      }
    })
  })


  router.delete('/delete/:id',(req,res)=>{
    const emp_id = req.params.id;
    const dltData = 'delete from employee where emp_id = ?';
    db.query(dltData,[emp_id],(err,result)=>{
      if(err){
        res.status(500).json({message:"Internal server error."})
      }else{
        res.status(200).json({message:"Employee Data Deleted successfully."})
      }
    })
  })

  router.get('/allAttendance', (req, res) => {
    try {
        const getAllAttendanceQuery = 'SELECT * FROM emp_attendance';
        db.query(getAllAttendanceQuery, (error, results) => {
            if (error) {
                console.error('Error fetching data:', error);
                res.status(500).json({ message: 'Internal server error.' });
            } else {
                res.status(200).json(results);
            }
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});
router.get('/filterAttendance', (req, res) => {
  const { month, empId } = req.query;

  if (!month) {
    return res.status(400).json({ message: "Month is required." });
  }

  const query = `
    SELECT * FROM emp_attendance
    WHERE MONTH(entry_at) = ? ${empId ? 'AND emp_id = ?' : ''}
  `;
  
  const params = [month];
  if (empId) params.push(empId);

  db.query(query, params, (error, results) => {
    if (error) {
      console.error('Error fetching filtered attendance:', error);
      return res.status(500).json({ message: 'Internal server error.' });
    }

    res.status(200).json(results);
  });
});
  router.get('/todayAttendance', (req, res) => {
    const todayDate = moment().format('YYYY-MM-DD');
    const sql = 'SELECT COUNT(*) AS today FROM emp_attendance WHERE DATE(entry_at) = ?';
    db.query(sql, [todayDate], (err, results) => {
      if (err) return res.status(500).json({ message: 'Internal server error.' });
      res.json(results[0]);
    });
  });
  // Inside your employee routes file (e.g., `employeeRoutes.js`)
router.get('/allEmployees', (req, res) => {
  try {
      const getAllEmployeesQuery = 'SELECT emp_id, emp_name FROM employee'; // Adjust table name and fields as necessary
      db.query(getAllEmployeesQuery, (error, results) => {
          if (error) {
              console.error('Error fetching employees:', error);
              res.status(500).json({ message: 'Internal server error.' });
          } else {
              res.status(200).json(results);
          }
      });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ message: 'Internal server error.' });
  }
});
// Example of backend endpoint to get monthly attendance
router.get('/monthlyAttendance', (req, res) => {
  const { month, year, empId } = req.query;

  // Query to get attendance records for the specified month, year, and employee
  const query = `
    SELECT e.emp_id, e.emp_name, a.entry_at, a.exit_at
    FROM emp_attendance a
    JOIN employee e ON a.emp_id = e.emp_id
    WHERE MONTH(a.entry_at) = ? AND YEAR(a.entry_at) = ? ${empId ? 'AND a.emp_id = ?' : ''}
  `;

  const params = [month, year];
  if (empId) params.push(empId);

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching data' });
    res.json(results);
  });
});


// Fetch all leads
router.get('/api/leads-and-following', async (req, res) => {
  const { date, month } = req.query;
  let leadsQuery = 'SELECT * FROM leads_data';
  
  // Apply filtering based on query parameters
  if (date) {
    leadsQuery += ` WHERE DATE(QUERY_TIME) = '${date}'`;
  } else if (month) {
    const [year, monthNumber] = month.split('-');
    leadsQuery += ` WHERE YEAR(QUERY_TIME) = ${year} AND MONTH(QUERY_TIME) = ${monthNumber}`;
  }

  try {
    // Execute the leads query
    const leadsResults = await new Promise((resolve, reject) => {
      db.query(leadsQuery, (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });

    // Execute the following leads query
    const followingLeadsResults = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM following_leads', (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });

    // Send the combined results
    res.json({ leads: leadsResults, followingLeads: followingLeadsResults });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error });
  }
});


router.get('/getNotcallattedeByEmpId/:emp_id', (req, res) => {
  // console.log(req.body);
  const empId = req.params.emp_id;
  const query = `
      SELECT * FROM following_leads
      WHERE emp_id = ? AND call_Attended = 'No'
  `;

  db.query(query, [empId], (error, results) => {
      if (error) {
          console.error('Error executing query:', error);
          res.status(500).send('Error fetching data');
          return;
      }
      res.json(results);
  });
});
router.post('/enterLeave', (req, res) => {
  const { leave_date, reason } = req.body;
  const query = `INSERT INTO admin_leave (leave_date, reason) VALUES (?, ?)`;
  db.query(query, [leave_date, reason], (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send('Leave entered successfully');
  });
});

// Get all admin leave entries (for calendar display)
router.get('/adminLeave', (req, res) => {
  const query = `SELECT * FROM admin_leave`;
  db.query(query, (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});

  return router;
}