const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const { Ticket } = require("../models/model");
const express = require("express");
const router = express.Router();

router.post("/send-ticket", async (req, res) => {
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
    const qrData = JSON.stringify({ ticketId: ticket._id.toString() });
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
        user: "prakhar.agracode@gmail.com",
        pass: "", // ⚠️ Store this securely in environment variables
      },
    });

    // 🔹 Email Content
    const mailOptions = {
      from: "prakhar.agracode@gmail.com",
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
});



// 🎟 Fetch Ticket by ID
router.get("/ticket/qr/:email/:movieTitle", async (req, res) => {
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
});








// 🎯 Verify QR Code and Mark as Used
router.post("/verify-ticket", async (req, res) => {
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
});

module.exports = router;
