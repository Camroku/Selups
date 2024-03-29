const mongoose = require("mongoose");
const config = require("../config.json");
module.exports = mongoose.model("message", new mongoose.Schema({
    _id: { type: String, default: () => new Date().getTime().toString() + Math.random().toString().substring(2, 10) },
    authorID: { type: String, default: config.System },
    content: String,
    date: { type: Date, default: Date.now }

}, { versionKey: false }));