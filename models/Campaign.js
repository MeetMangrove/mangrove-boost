const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: String,
  status: String,
  end_date: Date,
  start_date: Date,
  message_to_share: String,
  message_backers: String,
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
