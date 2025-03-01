const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, 
  verificationToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// // Static method for signing up a new user
// userSchema.statics.signup = async function (name, email, password) {
//   // Check if user already exists
//   const exists = await this.findOne({ email });
//   if (exists) {
//     throw new Error("User already exists");
//   }

//   // Hash password before saving
//   const salt = await bcrypt.genSalt(10);
//   const hash = await bcrypt.hash(password, salt);

//   // Create and return new user
//   return this.create({ name, email, password: hash });
// };

// Static method for logging in a user
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw new Error("User not found");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Incorrect password");
  }

  return user;
};



// Movie Schema

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  genre: [String],
  duration: Number,
  releaseDate: Date,
});

// Static method to add a movie
movieSchema.statics.addMovie = async function (movieData) {
  const exists = await this.findOne({ title });
  if (exists) {
    throw new Error("Movie already exists");
  }
  if (movieData.releaseDate) {
    movieData.releaseDate = new Date(movieData.releaseDate);
  }
  return await this.create(movieData);
};

// Static method to get all movies
movieSchema.statics.getAllMovies = async function () {
  return await this.find({});
};

// Static method to get a movie by title
movieSchema.statics.getMovieByTitle = async function (title) {
  return await this.findOne({ title });
};

// Showtime Schema

const showtimeSchema = new mongoose.Schema({
  movieTitle: { type: String, required: true },
  theaterName: { type: String, required: true },
  time: { type: Date, required: true },
  price: { type: Number, required: true },
  seats: [[Boolean]],
});

/* Static Methods */

// 1. Create a new showtime
showtimeSchema.statics.createShowtime = async function (data) {
  return await this.create(data);
};

// 2. Find a specific showtime
showtimeSchema.statics.findShowtime = async function (
  movieTitle,
  theaterName,
  time
) {
  return await this.findOne({ movieTitle, theaterName, time });
};

// 3. Show all showtimes
showtimeSchema.statics.getAllShowtimes = async function () {
  return await this.find({});
};

// 4. Reserve seats (update availability)
showtimeSchema.statics.reserveSeats = async function (
  movieTitle,
  theaterName,
  time,
  selectedSeats
) {
  const showtime = await this.findOne({ movieTitle, theaterName, time });
  if (!showtime) return null;

  selectedSeats.forEach(({ row, col }) => {
    if (showtime.seats[row][col]) {
      showtime.seats[row][col] = false; // Mark seat as reserved
    }
  });
};

// const reservationSchema = new mongoose.Schema({
//   name: { type: String, ref: "User", required: true },
//   showtimeTitle: { type: String, required: true },
//   theaterName: { type: String, required: true },
//   seats: { type: [[Number]], required: true }, // Fix: Change Boolean to
//   totalPrice: { type: Number, required: true },
//   createdAt: { type: Date, default: Date.now },
// });

// reservationSchema.statics.saveSeats = async function (data) {
//   return await this.create(data);
// };


// const ticketSchema = new mongoose.Schema({
//   email: String,
//   movieTitle: String,
//   theater: String,
//   time: String,
//   seats: [String],
//   price: Number,
//   isUsed: { type: Boolean, default: false }, // ✅ Used or Not
//   qrCode: String, // ✅ Store QR Code as Base64
// });

const ticketSchema = new mongoose.Schema({
  name: { type: String  },
  email: { type: String },
  movieTitle: { type: String, required: true },
  theater: { type: String, required: true },
  time: { type: Date, required: true },
  seats: { type: [[Number]], required: true },
  price: { type: Number, required: true },
  qrCode: { type: String },
  isUsed: { type: Boolean, default: false },
  status: { type: String, enum: ["reserved", "confirmed"], default: "reserved" },
  createdAt: { type: Date, default: Date.now },
});

ticketSchema.statics.saveSeats = async function (data) {
  return await this.create({ data, status: "reserved" });
};



// Creating Models
const User = mongoose.model("User", userSchema);
const Movie = mongoose.model("Movie", movieSchema);
const Showtime = mongoose.model("Showtime", showtimeSchema);
// const Reservation = mongoose.model("Reservation", reservationSchema);
const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = { User, Movie, Showtime, Ticket };
