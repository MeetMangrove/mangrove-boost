const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: String,
  message_to_share: String,
  message_backers: String,
  date_release: Date,
  image: String,
  link: String,
  backers: {
    waiting: [],
    shared: [],
    refused: []
  },
}, { timestamps: true });

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
