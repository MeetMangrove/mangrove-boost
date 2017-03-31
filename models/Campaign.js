const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: String,
  message_to_share: String,
  message_backers: String,
  date_release: Date,
  backers: Array
}, { timestamps: true });

campaignSchema.pre('save', function save(next) {
  const campaign = this;
  if (!campaign._id) {
  //  campaign._id = new mongoose.Types.ObjectId;
  }
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
