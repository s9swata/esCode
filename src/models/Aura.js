const mongoose = require("mongoose");

const AuraSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  aura: {
    type: Number,
    required: true,
  },
});

const Aura = mongoose.model("Aura", AuraSchema);
module.exports = Aura;
