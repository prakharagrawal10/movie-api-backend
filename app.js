const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const fs = require("fs");

// Import Routes
const userRoutes = require("./routes/userRoutes.js");
const movieRoutes = require("./routes/movieRoutes.js");
const showtimeRoutes = require("./routes/showtimeRoutes.js");
const ticketRoutes = require("./routes/ticketRoutes.js");

// Express App
const app = express();
app.use(express.json());
app.use(cors());

// Serve Static Files (Frontend)
app.use(express.static("frontend"));

// API Routes
app.get("/", (req, res) => res.send("Movie Reservation System API"));
app.use("/api/user", userRoutes);
app.use("/api/movie", movieRoutes);
app.use("/api/showtime", showtimeRoutes);
app.use("/api/ticket", ticketRoutes);

// Ensure MONGO_URI is provided
if (!process.env.MONGO_URI) {
  console.error("ERROR: MONGO_URI not found in .env file!");
  process.exit(1);
}

// Connect to MongoDB and Start Server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });


// const express = require("express");
// const mongoose = require("mongoose");
// require("dotenv").config();
// const cors = require("cors");
// const fs = require("fs");

// // Import Routes
// const userRoutes = require("./routes/userRoutes.js");
// const movieRoutes = require("./routes/movieRoutes.js");
// const showtimeRoutes = require("./routes/showtimeRoutes.js");
// // const reservationRoutes = require("./routes/reservationRoutes.js");
// // const emailRoutes = require("./routes/email.js");
// const ticketRoutes = require("./routes/ticketRoutes.js");

// // Express App
// const app = express();
// app.use(express.json());
// app.use(cors());

// // Serve Static Files (Frontend)
// app.use(express.static("frontend"));

// // API Routes
// app.get("/", (req, res) => res.send("Movie Reservation System API"));
// app.use("/api/user", userRoutes); // User routes (Login, Signup)
// app.use("/api/movie", movieRoutes); // Movie routes
// app.use("/api/showtime", showtimeRoutes); // Showtime routes
// app.use("/api/ticket", ticketRoutes); // Ticket routes


// // Ensure MONGO_URI is provided
// if (!process.env.MONGO_URI) {
//   console.error("ERROR: MONGO_URI not found in .env file!");
//   process.exit(1);
// }

// // Connect to MongoDB and Start Server
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("MongoDB Connected");
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//   })
//   .catch((err) => {
//     console.error("MongoDB connection failed:", err);
//     process.exit(1);
//   });
