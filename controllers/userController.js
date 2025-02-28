const { User, Ticket } = require("../models/model.js");
const jwt = require("jsonwebtoken");


const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

// login a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    // create a token
    const token = createToken(user._id);

    res.status(200).json({ email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// signup a user
const signupUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const user = await User.signup(name, email, password);

    // Create a token
    const token = createToken(user._id);

    res.status(200).json({ name, email, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
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




module.exports = { signupUser, loginUser, getProfile, myAccount };
