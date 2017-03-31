const Campaign = require('../models/Campaign');
const Bot = require('./bot');
const User = require('../models/User');

/**
 * GET /campaign/all
 * History of all campaign
 */
exports.all = (req, res) => {
  let campaigns = [];
  Campaign.find({}, (err, results) => {
    if (err) { return next(err); }

    res.render('campaign/all', {
      title: 'History off campaign',
      campaigns: results
    });
  });

};

/**
 * GET /campaign/edit/:id
 * Campaign Editor
 */
 exports.edit = (req, res) => {
  res.render('campaign/edit', {
    title: 'Campaign editor'
  });
 };

 /**
  * GET /campaign/view/:id
  * Campaign Page
  */
  exports.view = (req, res) => {
    Campaign.findOne({_id: req.params.id}, (err, result) => {
      if (err) { return next(err); }
      res.render('campaign/view', {
        title: 'Campaign '+result.name,
        campaign: result
      });
     });
  };


 /**
  * POST /campaign/edit
  * Create a new local account.
  */
 exports.postCampaign = (req, res, next) => {
  const campaign = new Campaign({
    name: req.body.name,
    link: req.body.link,
    content: req.body.content,
    date_release: req.body.date_release
   });

   campaign.save((err) => {
     if (err) { return next(err); }
     Bot.sendStartCampaign();
     res.redirect('/campaign/view/'+campaign._id);
   });
 };


function addBackerToCampaign(slackId, campaignId) {
  User.findOne({ slack: slackId }, (err, user) => {
    if (err) {
      console.log(err);
      return err;
    }
    Campaign.findOneAndUpdate(
      { _id: campaignId },
      { $push: { backers: user._id } },
      { new: true }, (err, campaign) => {
        if (err) {
          console.log(err);
          return err;
        }
        console.log(`${user.slack} added to ${campaign}`);
      });
  });
}
