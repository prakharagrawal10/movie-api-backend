const { Reservation } = require("../models/model.js");
const mongoose = require("mongoose");

const saveSeats = async (req, res) => {
  const { name, showtimeTitle, theaterName, seats, totalPrice } = req.body;

  let emptyFields = [];

  if (!name) emptyFields.push("name");
  if (!showtimeTitle) emptyFields.push("showtimeTitle");
  if (!theaterName) emptyFields.push("theaterName");
  if (!seats) emptyFields.push("seats");
  if (!totalPrice) emptyFields.push("totalPrice");

  if (emptyFields.length > 0) {
    return res
      .status(400)
      .json({ error: "Please fill in all the fields", emptyFields });
  }

  try {
    // Create a reservation
    const reservation = await Reservation.create({
      name,
      showtimeTitle,
      theaterName,
      seats,
      totalPrice,
    });
    res.status(200).json(reservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { saveSeats };
