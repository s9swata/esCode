const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: false,
    },
    source_code: {
      type: String,
      required: true,
    },
    problem_id: {
      type: String,
      required: true,
    },
    language_id: {
      type: Number,
      required: true,
    },
    test_cases_passed: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "failed"],
      default: "pending",
    },
    token: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Submissions = mongoose.model("Submission", SubmissionSchema);
module.exports = Submissions;
