const mongoose = require('mongoose');

const DiscussSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true
        },
        title:{
            type: String,
            required: true
        },
        body: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

const Discuss = mongoose.model('Discuss', DiscussSchema);
module.exports = Discuss;