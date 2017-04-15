const mongoose = require('mongoose');

const bufferedUserSchema = new mongoose.Schema({
  campaign: String,
  backer: String
}, { timestamps: true });


const BufferedUser = mongoose.model('BufferedUser', bufferedUserSchema);

module.exports = BufferedUser;
