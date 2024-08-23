const express = require('express');
const router = express.Router();
const moment = require('moment');
const axios = require('axios');
module.exports = (db) =>{

router.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
  
  // Get purchases
  router.get('/api/purchase', (req, res) => {
    db.query('SELECT * FROM purchase', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
  
  // Get sales
  router.get('/api/sales', (req, res) => {
    db.query('SELECT * FROM sales', (err, results) => {
      if (err) throw err;
      res.json(results);
    });
  });
  
    return router;
}