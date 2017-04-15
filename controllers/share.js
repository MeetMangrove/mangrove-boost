const Share = require('../models/Share');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

exports.createShare = (slackId, campaignId, socialAccount, cb) => {
  User.findOne({ slack: slackId }, (err, user) => {
    if (err) {
      return (err);
    }

    Campaign.findOne({ _id: campaignId }, (err, campaign) => {
      if (err) {
        return (err);
      }

      const share = new Share();

      share.campaign = campaign._id;
      share.backer = user.slack;
      share.social_account = socialAccount,
      share.message_to_share = campaign.message_to_share;
      share.link = campaign.link;
      share.image = campaign.image;
      share.stats.clic = 0;

      share.save((err, result) => {
        if (err) {
          return cb(err);
        }

        return cb(result);
      });
    });
  });
}

/**
* GET /share/:id
* Redirect To Link
*/
exports.shareLink = (req, res) => {
  Share.findOne({ _id: req.params.id }, (err, share) => {
    if (err) {
      req.flash('error', { msg: 'Link unavailable.' });
      return res.redirect('/');
   }

   share.stats.clic = share.stats.clic + 1;
   share.save((err, result) => {
     return res.redirect(share.link);
   });
  });
};
