const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  _id: { type: String, unique: true },
  name: String,
  link: String,
  content: String,
  date_release: Date,
  profiles: Array
}, { timestamps: true });

campaignSchema.pre('save', function save(next) {
  const campaign = this;
  if(!campaign._id){
    campaign._id = new mongoose.mongo.ObjectId('26cb91bdc3464f14678934ca');
  }
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
