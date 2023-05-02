const mongoose = require("mongoose");

module.exports = mongoose.model("user", new mongoose.Schema({
    username: String,
    _id: { type: String, default: () => new Date().getTime().toString() + Math.random().toString().substring(2, 10) },
    password: String,
    date: { type: Date, default: Date.now }
}, { versionKey: false }));