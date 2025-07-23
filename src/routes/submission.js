const express = require("express");
const Submissions = require("../models/Submissions");
const { submitCode } = require("../utils");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const allSubmissions = await Submissions.find({});
    return res.send(allSubmissions);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

router.post("/", async (req, res) => {
  const { username, source_code, problem_id, language_id, stdin } = req.body;
  try {
    const submission = await Submissions.create({
      username,
      source_code,
      problem_id,
      language_id,
      test_cases_passed: 0, // Default value
      status: "pending", // Default status
    });
    console.log("Submission created successfully", submission);

    const token = submitCode(language_id, source_code, stdin);
    if (token) res.status(200).json({ msg: "Submission created" });
    else res.status(400).json({ msg: "Error while submitting request" });
  } catch (e) {
    console.log("Error creating submission", e);
    res.status(400).json({ msg: "Error while submitting request" });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const submissions = await Submissions.find({ username: username });
    return res.send(submissions);
  } catch (e) {
    return res.status(400).json({ error: e });
  }
});

module.exports = router;
