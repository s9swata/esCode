const mongoose = require("mongoose");
const axios = require("axios");

const X_RAPIDAPI_KEY = process.env.X_RAPIDAPI_KEY;
const X_RAPIDAPI_HOST = process.env.X_RAPIDAPI_HOST;
const CALLBACK_URL = process.env.CALLBACK_URL;

async function connectToDb(connectionString) {
  try {
    await mongoose.connect(connectionString, {
      autoIndex: true,
    });
    console.log("connected to db");
  } catch (err) {
    console.log(err);
  }
}

async function submitCode(language_id, source_code, stdin) {
  if (!X_RAPIDAPI_KEY || !X_RAPIDAPI_HOST || !CALLBACK_URL) {
    throw new Error("Missing RapidAPI credentials");
  }

  const options = {
    method: "POST",
    url: "https://judge0-ce.p.rapidapi.com/submissions",
    params: {
      base64_encoded: "false",
      wait: "false",
      fields: "*",
    },
    headers: {
      "x-rapidapi-key": X_RAPIDAPI_KEY,
      "x-rapidapi-host": X_RAPIDAPI_HOST,
      "Content-Type": "application/json",
    },
    data: {
      language_id,
      source_code,
      stdin,
      callback_url: CALLBACK_URL,
    },
  };

  try {
    const response = await axios.request(options);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  connectToDb,
  submitCode,
};
