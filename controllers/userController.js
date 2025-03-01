const { User, Ticket } = require("../models/model.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");


const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Send Verification Email
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.REACT_APP_API_URL}/api/user/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

// login a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ error: "Email not verified. Please verify your email before logging in." });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Create a token
    const token = createToken(user._id);

    res.status(200).json({ email, token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};



// signup a user
const signupUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const verificationToken = uuidv4(); // Generate verification token

    const user = await User.create({
      name,
      email,
      password: hash,
      isVerified: false, // User must verify email
      verificationToken, // Store verification token
    });

    // Send verification email
    const verificationLink = `${process.env.REACT_APP_API_URL}/api/user/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(user.email, "Verify Your Email", `Click this link to verify: ${verificationLink}`);

    res.status(200).json({ message: "Signup successful! Check your email for verification." });
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });

  }
};


const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.verificationToken = null; // Remove token after verification
    await user.save();

    res.status(200).json({ message: "Email verified! You can now log in." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// get user profile
const getProfile = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET);

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


const myAccount = async (req, res) => {
  try {
    // console.log("Received Authorization Header:", req.headers.authorization);

    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing or invalid" });
    }

    const token = req.headers.authorization.split(" ")[1];
    // console.log("Extracted Token:", token);  // Log token before verifying

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET);
      // console.log("Decoded Token:", decoded);  // Log decoded token
    } catch (error) {
      console.error("JWT Verification Error:", error.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }


    const reservations = await Ticket.find({ email: user.email });
    res.status(200).json({ user, reservations });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};




module.exports = { signupUser, loginUser, getProfile, myAccount, verifyEmail };
