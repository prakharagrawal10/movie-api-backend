const express = require("express");

// controller functions
const {
  loginUser,
  signupUser,
  getProfile,
  myAccount,
} = require("../controllers/userController.js");

const router = express.Router();

// login route
router.post("/login", loginUser);

// signup route
router.post("/signup", signupUser);

//profile route
router.get("/profile", getProfile);

//my account route
router.get("/account", myAccount);

module.exports = router;
