const express = require('express');

// Controller functions
const { addMovie, getAllMovies, getMovieByTitle, getMoviesByGenre, getMoviesByDirector } = require('../controllers/movieController.js');

const router = express.Router();

router.post('/add-movie', addMovie);

router.get('/get-all', getAllMovies);

router.get('/get-one/:title', getMovieByTitle);

// New routes
router.get('/get-by-genre/:genre', getMoviesByGenre); // Get movies by genre
router.get('/get-by-director/:director', getMoviesByDirector); // Get movies by director

module.exports = router;
