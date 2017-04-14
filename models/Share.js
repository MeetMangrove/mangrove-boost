const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  campaign: String,
  backer: String,
  social_account: String,
  message_to_share: String,
  image: String,
  date_release: Date
}, { timestamps: true });


const Share = mongoose.model('Share', shareSchema);

module.exports = Share;
