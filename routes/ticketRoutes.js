const express = require('express')

const { saveSeats, sendTicket, fetchTicketQR, verifyTicket } = require('../controllers/ticketController.js')

const router = express.Router()

router.post("/save-seats", saveSeats);    

router.post("/send-ticket", sendTicket);
router.get("/ticket/qr/:email/:movieTitle", fetchTicketQR);
router.post("/verify-ticket", verifyTicket);

module.exports = router
