const express = require('express')

// controller functions
const { addMovie, getAllMovies, getMovieByTitle } = require('../controllers/movieController.js')

const router = express.Router()

router.post('/add-movie', addMovie)

router.get('/get-all', getAllMovies)

router.get('/get-one/:title', getMovieByTitle);

module.exports = router

//post req to post new movie with params - title, genre, duration, release date 
//get req to get all movies
//get req to get movie by id

