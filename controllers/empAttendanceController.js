const express = require('express');
const router = express.Router();
const moment = require('moment');

module.exports = (db) =>{

    const moment = require('moment');

    router.post('/empEntry/:empId', (req, res) => {
        try {
            const empId = req.params.empId;
            const currentTime = new Date();
            const currentHour = currentTime.getHours();
            let greetingMessage;
    
            if (currentHour >= 5 && currentHour < 12) {
                greetingMessage = "Good morning! Enjoy your work and have a productive day.";
            } else if (currentHour >= 12 && currentHour < 17) {
                greetingMessage = "Good afternoon! Keep up the good work.";
            } else {
                greetingMessage = "Good evening! Wrap up your tasks and have a relaxing time ahead.";
            }
    
            const currentDate = moment().format('YYYY-MM-DD');
            const checkEntryQuery = 'SELECT * FROM emp_attendance WHERE emp_id = ? AND DATE(entry_at) = ?';
            db.query(checkEntryQuery, [empId, currentDate], (checkEntryErr, checkEntryRes) => {
                if (checkEntryErr) {
                    return res.status(500).json({ message: "Internal server error." }); 
                }
    
                if (checkEntryRes.length > 0) {
                    return res.status(400).json({ message: "Employee has already entered today." });
                }
    
                // If no entry exists, insert a new entry
                const insertData = 'INSERT INTO emp_attendance (emp_id, entry_at, created_at) VALUES (?, ?, ?)';
                db.query(insertData, [empId, moment().format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')], (insertErr, insertRes) => {
                    if (insertErr) {
                        return res.status(500).json({ message: "Internal server error." });
                    }
                    res.status(200).json({ message: greetingMessage });
                });
            });
        } catch (err) {
            res.status(500).json({ message: "Internal server error." });
        }
    });

// API to get today's employee attendance
router.get('/todayAttendance', (req, res) => {
    try {
        const todayDate = moment().format('YYYY-MM-DD');

        const getTodayAttendanceQuery = 'SELECT * FROM emp_attendance WHERE DATE(entry_at) = ?';
        db.query(getTodayAttendanceQuery, [todayDate], (getTodayAttendanceErr, getTodayAttendanceRes) => {
            if (getTodayAttendanceErr) {
                return res.status(500).json({ message: "Internal server error." });
            }

            if (getTodayAttendanceRes.length === 0) {
                return res.status(404).json({ message: "No attendance records found for today." });
            }

            res.status(200).json({ attendance: getTodayAttendanceRes });
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error." });
    }
});

    router.post('/empExit/:empId', (req, res) => {
        try {
            const empId = req.params.empId;
            const currentTime = new Date();
            const currentHour = currentTime.getHours();
            let greetingMessage;
    
            if (currentHour >= 5 && currentHour < 12) {
                greetingMessage = "Good morning! Have a great day ahead.";
            } else if (currentHour >= 12 && currentHour < 17) {
                greetingMessage = "Good afternoon! Have a pleasant afternoon.";
            } else {
                greetingMessage = "Good evening! Have a relaxing evening.";
            }
    
            const currentDate = moment().format('YYYY-MM-DD');
            const checkExitQuery = 'SELECT * FROM emp_attendance WHERE emp_id = ? AND DATE(exit_at) = ?';
            db.query(checkExitQuery, [empId, currentDate], (checkExitErr, checkExitRes) => {
                if (checkExitErr) {
                    return res.status(500).json({ message: "Internal server error." });
                }
    
                if (checkExitRes.length > 0) {
                    return res.status(400).json({ message: "Employee has already exited today." });
                }
    
                // If no exit record exists, update the existing entry with exit time
                const updateData = 'UPDATE emp_attendance SET exit_at = ? WHERE emp_id = ? AND DATE(entry_at) = ?';
                db.query(updateData, [moment().format('YYYY-MM-DD HH:mm:ss'), empId, currentDate], (updateErr, updateRes) => {
                    if (updateErr) {
                        return res.status(500).json({ message: "Internal server error." });
                    }
                    res.status(200).json({ message: greetingMessage });
                });
            });
        } catch (err) {
            res.status(500).json({ message: "Internal server error." });
        }
    });
    


    router.get('/empAttendChart', (req, res) => {
        try {
            const empId = req.query.empId;
            const year = req.query.year;
            console.log("Year :",year)
            let getQuery = `SELECT MONTH(entry_at) AS month, COUNT(*) AS count 
                            FROM emp_attendance 
                            WHERE emp_id = ?`;
            
            const queryParams = [empId];
    
            if (year) {
                getQuery += ` AND YEAR(entry_at) = ?`;
                queryParams.push(year);
            }
    
            getQuery += ` GROUP BY MONTH(entry_at)`;
    
            // Execute the query
            db.query(getQuery, queryParams, (error, results) => {
                if (error) {
                    console.error('Error fetching data:', error);
                    res.status(500).json({ message: 'Internal server error.' });
                } else {
                    res.status(200).json(results);
                    console.log("Data",results)
                }
            });
        } catch (err) {
            console.error('Error:', err);
            res.status(500).json({ message: 'Internal server error.' });
        }
    });
    
    


    return router;
}