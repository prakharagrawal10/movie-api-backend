const { Showtime, Movie, Reservation, Ticket } = require('../models/model.js')
const mongoose = require('mongoose')

const addShowtime = async (req, res) => {
    const { movieTitle, theaterName, time, price, seats } = req.body;

    let emptyFields = [];   

    if (!movieTitle) emptyFields.push("movieTitle");
    if (!theaterName) emptyFields.push("theaterName");
    if (!time) emptyFields.push("time");
    if (!seats) emptyFields.push("seats");
    if (!price) emptyFields.push("price");

    if (emptyFields.length > 0) {
        return res.status(400).json({ error: "Please fill in all the fields", emptyFields });
    }

    try {
        // Check if the movie exists
        const movie = await Movie.findOne({ title: movieTitle });
        if (!movie) {
            return res.status(400).json({ error: "Movie with this title does not exist" });
        }

        // Add the showtime
        const showtime = await Showtime.create({ movieTitle, theaterName, time, price, seats });
        res.status(200).json(showtime);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAllShowtimes = async (req, res) => {
    const { movieTitle } = req.params; 

    try {
        const showtimes = await Showtime.find({ movieTitle }); // Use movieTitle instead of title

        if (!showtimes || showtimes.length === 0) {
            return res.status(404).json({ error: "No showtimes found for this movie" });
        }

        res.status(200).json(showtimes);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};



const getShowtimeByTitle = async (req, res) => {

    // console.log("Route hit with params:", req.params);

    const { movieTitle, theaterName, time } = req.params;

    try {
        const showtime = await Showtime.findShowtime(movieTitle, theaterName, time);
        if (!showtime) {
            return res.status(404).json({ error: "Showtime not found" });
        }
        res.status(200).json(showtime);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};  

const reserveSeats = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction(); // Start transaction

    try {
        const { movieTitle, theaterName, time, selectedSeats, name, email, price } = req.body;

        // Find the showtime
        const showtime = await Showtime.findOne({ movieTitle, theaterName, time }).session(session);
        if (!showtime) {
            await session.abortTransaction();
            return res.status(404).json({ error: "Showtime not found" });
        }

        // Check if any selected seat is already booked
        for (const [row, col] of selectedSeats) {
            if (showtime.seats[row][col]) {
                await session.abortTransaction();
                return res.status(400).json({ error: "One or more seats are already booked" });
            }
        }

        // Mark selected seats as booked
        selectedSeats.forEach(([row, col]) => {
            showtime.seats[row][col] = true;
        });

        // Save updated seats in Showtime collection
        await showtime.save({ session });

        // ✅ Also save reservation in Ticket collection
        await Ticket.create(
            [
                {
                    name,
                    email,
                    movieTitle,
                    theater: theaterName,
                    time,
                    seats: selectedSeats,
                    price: price * selectedSeats.length,
                },
            ],
            { session }
        );

        await session.commitTransaction(); // ✅ Commit transaction if everything is successful
        session.endSession();

        res.status(200).json({ message: "Booking successful!", seats: showtime.seats });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ error: "Server error" });
    }
};


module.exports = { addShowtime, getAllShowtimes, getShowtimeByTitle, reserveSeats }
