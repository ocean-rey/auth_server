require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");

app.use(express.json());

// Logic goes here
const auth = require("./middleware/auth");

app.post("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});
// importing user context
const User = require("./model/user");

// Register
app.post("/register", async (req, res) => {
  // our register logic stars here...
  try {
    // Get user input
    const { email, password } = req.body;
    if(!(email && password)){
      return res.status(400).send("Needs email and password")
    }
    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      first_name: "not implemented",
      last_name: "not implented",
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    // save user token
    user.token = token;

    // return new user
    console.log("New user created ")
    console.log(user)
    res.status(201).json(user);

    // tell main server that there is new user
    // we don't need to wait for this operation to complete
    /* axios.post(`${process.env.SERVER_URL}/register`, user) */
  } catch (err) {
    console.log(err);
  }
  // Our register logic ends here
});

// Login
app.post("/login", async (req, res) => {
  // our login logic starts here
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      return res.status(400).send("All input is required");
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // save user token
      user.token = token;

      console.log("Log in successful");
      console.log(user)
      // user
      return res.status(200).json(user);
    }
    return res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
  // Our login logic ends here
});

module.exports = app;
