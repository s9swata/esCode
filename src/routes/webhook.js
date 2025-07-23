const express = require("express");
const router = express.Router();

const User = require("../models/User");

router.post("/clerk/registered", async (req, res) => {
  const userData = req.body.data;
  const email = userData.email_addresses?.[0]?.email_address;
  const username = userData.username || email;
  const fullName = `${userData.first_name} ${userData.last_name}`;
  const clerkId = userData.id;

  if (!email || !username || !fullName || !clerkId) {
    res.status(400).json({ error: "Missing required user data" });
    return;
  }

  try {
    const existingUser = await User.findOne({ clerkId: clerkId });
    if (existingUser) {
      res.status(400).json({ error: "User already exists" });
      return;
    }

    const user = await User.create({
      username: username,
      email: email,
      full_name: fullName,
      clerkId: clerkId,
    });

    if (!user) {
      res.status(400).json({ error: "User creation failed" });
      return;
    }

    res.status(200).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

module.exports = router;
