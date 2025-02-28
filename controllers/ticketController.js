const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const { Ticket } = require("../models/model");
require("dotenv").config();


// 🎯 Scan Ticket and Mark as Used
exports.scanTicket = async (req, res) => {
  try {
      const { ticketId } = req.params;

      // 🔍 Find Ticket in Database
      const ticket = await Ticket.findById(ticketId);

      if (!ticket) {
          return res.send(`
              <h2 style="color: red;">Invalid Ticket ❌</h2>
              <p>This ticket does not exist. Please check your booking details.</p>
          `);
      }

      if (ticket.isUsed) {
          return res.send(`
              <h2 style="color: orange;">Ticket Already Used! ⚠️</h2>
              <p>This ticket has already been scanned.</p>
          `);
      }

      // ✅ Mark Ticket as Used
      ticket.isUsed = true;
      await ticket.save();

      res.send(`
          <h2 style="color: green;">Ticket Verified! ✅</h2>
          <p>Enjoy your movie! 🍿</p>
      `);
  } catch (error) {
      console.error("Error scanning ticket:", error);
      res.status(500).send(`
          <h2 style="color: red;">Error Processing Ticket ❌</h2>
          <p>Something went wrong while verifying your ticket.</p>
      `);
  }
};


// 🎟 Send Ticket and Email
exports.sendTicket = async (req, res) => {
  try {
    const { email, movieTitle, theater, time, seats, price } = req.body;

    if (!email || !movieTitle || !theater || !time || !seats || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔹 Create Ticket in Database
    const ticket = new Ticket({
      email,
      movieTitle,
      theater,
      time,
      seats,
      price,
      isUsed: false,
    });
    await ticket.save();

    // 🔹 Generate QR Code (Containing Ticket ID)
    const qrData = `${process.env.REACT_APP_API_URL}/scan/${ticket._id}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrData);
    
    ticket.qrCode = qrCodeBase64;
    await ticket.save();

    // 🔹 Save QR Code as File for Email Attachment
    const qrFilePath = path.join(__dirname, `qrcode_${Date.now()}.png`);
    await QRCode.toFile(qrFilePath, qrData);

    // 🔹 Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // ⚠️ Use environment variables for security
      },
    });

    // 🔹 Email Content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🎟 Your Ticket for ${movieTitle}`,
      html: `
        <h2>🎟 Your Movie Ticket</h2>
        <p><strong>Movie:</strong> ${movieTitle}</p>
        <p><strong>Theater:</strong> ${theater}</p>
        <p><strong>Time:</strong> ${new Date(time).toLocaleString()}</p>
        <p><strong>Seats:</strong> ${seats.join(", ")}</p>
        <p><strong>Price:</strong> ₹${price}</p>
        <p>Scan this QR code at the entrance:</p>
        <img src="cid:qrcode" alt="QR Code" width="200" height="200" />
        <p>Enjoy your movie! 🍿</p>
      `,
      attachments: [
        {
          filename: "qrcode.png",
          path: qrFilePath,
          cid: "qrcode",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    fs.unlinkSync(qrFilePath); // Delete file after sending

    res.status(200).json({
      message: "Ticket generated and email sent successfully",
      ticketId: ticket._id,
      qrCode: qrCodeBase64,
    });
  } catch (error) {
    console.error("Error sending ticket:", error);
    res.status(500).json({ error: "Failed to generate or send ticket" });
  }
};

// 🎟 Fetch Ticket QR Code
exports.fetchTicketQR = async (req, res) => {
  try {
    const { email, movieTitle } = req.params;
    const ticket = await Ticket.findOne({ email, movieTitle }).select("qrCode").lean();

    if (!ticket) {
      return res.status(404).json({ error: "QR code not found" });
    }

    res.status(200).json({ qrCode: ticket.qrCode });
  } catch (error) {
    console.error("Error fetching QR code:", error);
    res.status(500).json({ error: "Failed to fetch QR code" });
  }
};

// 🎯 Verify QR Code and Mark as Used
exports.verifyTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: "Missing Ticket ID" });
    }

    // 🔹 Find Ticket in Database
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Invalid Ticket" });
    }

    if (ticket.isUsed) {
      return res.status(400).json({ error: "Ticket Already Used" });
    }

    // ✅ Mark Ticket as Used
    ticket.isUsed = true;
    await ticket.save();

    res.status(200).json({
      message: "Ticket Verified! 🎟 Enjoy the movie! 🍿",
      movieTitle: ticket.movieTitle,
      theater: ticket.theater,
      seats: ticket.seats,
      time: ticket.time,
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    res.status(500).json({ error: "Failed to verify ticket" });
  }
};

exports.saveSeats = async (req, res) => {
    const { name, email, movieTitle, theater, time, seats, price } = req.body;

    let emptyFields = [];

    if (!name) emptyFields.push("name");
    if (!email) emptyFields.push("email");  // ✅ Added email check
    if (!movieTitle) emptyFields.push("movieTitle");
    if (!theater) emptyFields.push("theater");
    if (!time) emptyFields.push("time");  // ✅ Added time check
    if (!seats || seats.length === 0) emptyFields.push("seats"); // ✅ Ensure seats is not empty
    if (price === undefined || price < 0) emptyFields.push("price"); // ✅ Ensure price is valid

    if (emptyFields.length > 0) {
        return res.status(400).json({
            error: "Please fill in all the required fields",
            emptyFields,
        });
    }

    try {
        // Create a reservation
        const reservation = await Ticket.create({
            name,
            email, // ✅ Added email
            movieTitle,
            theater,
            time, // ✅ Added time
            seats,
            price,
        });

        res.status(200).json(reservation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
