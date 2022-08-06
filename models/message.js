const mongoose = require("mongoose");

module.exports = mongoose.model("message", new mongoose.Schema({
    id: { type: String, default: "System" },
    msg: String,
    date: { type: Date, default: Date.now }

}, { versionKey: false }));