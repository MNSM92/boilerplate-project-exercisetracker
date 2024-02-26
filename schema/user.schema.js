const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    exercises: [{
      description: String,
      duration: Number,
      date: { type: Date, default: Date.now }
    }]
  });

module.exports = mongoose.model('User', userSchema)