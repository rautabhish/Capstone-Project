const express = require('express');
const { addItem } = require('../controllers/posController');
const router = express.Router();

router.post('/add-item', addItem);

module.exports = router;
