const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const cors = require("cors");
const dotenv = require("dotenv");

const app = express();

app.use(cors());
app.use(jsonParser);
dotenv.config();

const PORT = process.env.PORT || 3000;

const utils = require("./utils");

const auraRouter = require("./routes/aura");
const discussRouter = require("./routes/discussion");
const webhookRouter = require("./routes/webhook");
const submissionsRouter = require("./routes/submission");
const authMiddleware = require("./middleware/auth");

let connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.ENV === "production") {
  throw new Error("CONNECTION_STRING environment variable is not set");
}

app.get("/", (req, res) => {
  res.status(200).send("Welcome to the esCode API");
});

app.use("/aura", authMiddleware, auraRouter);
app.use("/discuss", authMiddleware, discussRouter);
app.use("/webhook", webhookRouter);
app.use("/submissions", authMiddleware, submissionsRouter);

utils.connectToDb(connectionString).then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on ${PORT}`);
  });
});
