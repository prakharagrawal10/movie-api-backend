const { User,  Ticket } = require("../models/model");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

// Create JWT Token
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send Verification Email
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.REACT_APP_API_URL}/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Verify Your Email",
    html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

// Signup User with Email Verification
const signupUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const verificationToken = uuidv4();

    const user = new User({
      name,
      email,
      password,
      isVerified: false,
      verificationToken,
    });

    await user.save();
    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({ message: "Signup successful. Check your email to verify." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Verify Email
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({ verificationToken: token });
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  res.status(200).json({ message: "Email verified successfully! You can now log in." });
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });
    if (!user.isVerified) return res.status(400).json({ error: "Please verify your email first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect password" });

    const token = createToken(user._id);
    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get User Profile
const getProfile = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.SECRET);

    const user = await User.findById(decoded._id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isVerified) return res.status(403).json({ error: "Please verify your email first." });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// My Account - Get user details + reservations
const myAccount = async (req, res) => {
  try {
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing or invalid" });
    }

    const token = req.headers.authorization.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await User.findById(decoded._id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.isVerified) return res.status(403).json({ error: "Please verify your email first." });

    const reservations = await Ticket.find({ email: user.email });

    res.status(200).json({ user, reservations });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { signupUser, verifyEmail, loginUser, getProfile, myAccount };
