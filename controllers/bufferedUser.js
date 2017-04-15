const BufferedUser = require('../models/BufferedUser');

exports.checkBufferedCampaign = (slackId, cb) => {
  BufferedUser.find({backer: slackId}, (err, results) => {
    if (err) { return next(err); }

    return cb(results);
  });
};
