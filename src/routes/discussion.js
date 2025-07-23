const express = require("express");
const discussions = require("../models/Discuss");

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, title, body } = req.body;
  try {
    const discussion = await discussions.create({
      username: username,
      title: title,
      body: body,
    });
    console.log("Discussion created successfully", discussion);
    return res.status(200).json({ msg: "Discussion created" });
  } catch (e) {
    console.log("Error creating discussion", e);
    return res.status(400).json({ msg: "error while submitting request" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const discussion = await discussions.find({});
    res.send(discussion);
  } catch (e) {
    res.status(400).json({ error: e });
  }
});

router.get("/all/:username", async (req, res) => {
  try {
    const discussion = await discussions.find({
      username: req.params.username,
    });
    return res.send(discussion);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

module.exports = router;
