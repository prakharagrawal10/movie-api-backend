const { Movie } = require('../models/model.js')
const mongoose = require('mongoose')

const addMovie = async (req, res) => {
  const {title, genre, duration, releaseDate} = req.body

  let emptyFields = []

  if(!title) {
    emptyFields.push('title')
  }
  if(!genre) {
    emptyFields.push('genre')
  }
  if(!duration) {
    emptyFields.push('duration')
  }
  if(!releaseDate) {
    emptyFields.push('releaseDate')
  }
  if(emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all the fields', emptyFields })
  }

  // add doc to db
  try {
    const movie = await Movie.create({title, genre, duration, releaseDate})
    res.status(200).json(movie)
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

const getAllMovies = async (req, res) => {
    const movies = await Movie.find({})
    res.status(200).json(movies)
}

const getMovieByTitle = async (req, res) => {
    const { title } = req.params;

    try {
        const movie = await Movie.findOne({ title: title });
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.status(200).json(movie);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = { addMovie, getAllMovies, getMovieByTitle }


// const getMovieIdByName = async (req, res) => {
//     const { name } = req.params; // Get movie name from request URL
  
//     try {
//       const movie = await Movie.findOne({ name: name }); // Find movie by name
  
//       if (!movie) {
//         return res.status(404).json({ error: 'Movie not found' });
//       }
  
//       res.status(200).json({ id: movie._id });
//     } catch (error) {
//       res.status(500).json({ error: 'Server error' });
//     }
//   };
  
