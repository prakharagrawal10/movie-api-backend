const { Movie } = require('../models/model.js');
const mongoose = require('mongoose');

const addMovie = async (req, res) => {
  const { title, genre, duration, releaseDate, posterUrl, imdbRating, cast, director, description, trailerUrl } = req.body;

  let emptyFields = [];

  if (!title) emptyFields.push('title');
  if (!genre) emptyFields.push('genre');
  if (!duration) emptyFields.push('duration');
  if (!releaseDate) emptyFields.push('releaseDate');
  if (!posterUrl) emptyFields.push('posterUrl');
  if (!imdbRating) emptyFields.push('imdbRating');
  if (!cast) emptyFields.push('cast');
  if (!director) emptyFields.push('director');

  if (emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all the fields', emptyFields });
  }

  try {
    const movie = await Movie.create({ title, genre, duration, releaseDate, posterUrl, imdbRating, cast, director, description, trailerUrl });
    res.status(200).json(movie);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllMovies = async (req, res) => {
  const movies = await Movie.find({}).sort({ releaseDate: -1 });
  res.status(200).json(movies);
};


const getMovieByTitle = async (req, res) => {
  const { title } = req.params;

  try {
    const movie = await Movie.findOne({ title: new RegExp(`^${title}$`, 'i') });
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.status(200).json(movie);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getMoviesByGenre = async (req, res) => {
  const { genre } = req.params;

  try {
    const movies = await Movie.find({ genre: new RegExp(genre, 'i') });
    if (movies.length === 0) {
      return res.status(404).json({ error: 'No movies found for this genre' });
    }
    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getMoviesByDirector = async (req, res) => {
  const { director } = req.params;

  try {
    const movies = await Movie.find({ director: new RegExp(director, 'i') });
    if (movies.length === 0) {
      return res.status(404).json({ error: 'No movies found for this director' });
    }
    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports = { addMovie, getAllMovies, getMovieByTitle, getMoviesByGenre, getMoviesByDirector };
