const mongoose = require('mongoose');

const AuraSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true
        },
        aura: {
            type: Number,
            required: true
        }
    }
)

const Aura = mongoose.model('Aura', AuraSchema);
module.exports = Aura;