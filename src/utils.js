const mongoose = require("mongoose");

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

module.exports = { connectToDb };
