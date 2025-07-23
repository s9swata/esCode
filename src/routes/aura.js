const express = require("express");
const router = express.Router();
const AURA = require("../models/Aura");

router.get("/:username", async (req, res) => {
  const aura = await AURA.find({ username: req.params.username });
  if (!aura) return res.send(0);

  return res.send(aura[0]);
});

module.exports = router;
