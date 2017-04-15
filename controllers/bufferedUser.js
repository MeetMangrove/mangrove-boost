const BufferedUser = require('../models/BufferedUser');

exports.checkBufferedCampaign = (slackId, cb) => {
  BufferedUser.find({backer: slackId}, (err, results) => {
    if (err) { return err; }

    return cb(results);
  });
};

exports.addUserToBuffer = (slackId, campaignId, cb) => {
  BufferedUser.findOne({ backer: slackId, campaign: campaignId }, (err, existingBuffer) => {
    if (err) { return err; }
    if (!existingBuffer) {
      const buffer = new BufferedUser();
      buffer.backer = slackId;
      buffer.campaign = campaignId;

      buffer.save((err) => {
        if (err) { return (err); }
        return cb(buffer);
      });
    }

    return cb(null);
  });
};
