const express = require('express')

// controller functions
const { addShowtime, getAllShowtimes, getShowtimeByTitle, reserveSeats } = require('../controllers/showtimeController.js')

const router = express.Router()

router.post('/add-show', addShowtime)

router.get('/get-all-shows/:movieTitle', getAllShowtimes)

router.get("/get-one-show/:movieTitle/:theaterName/:time", getShowtimeByTitle);

router.post("/reserve-seats", reserveSeats);

module.exports = router