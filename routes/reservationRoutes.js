const express = require('express')

const { saveSeats } = require('../controllers/reservationController.js')

const router = express.Router()

router.post("/save-seats", saveSeats);    

module.exports = router

