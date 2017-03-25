const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  name: String,
  link: String,
  content: String,
  date_release: Date,
  profiles: Array
}, { timestamps: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
