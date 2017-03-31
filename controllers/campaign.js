const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Bot = require('./bot');

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
  Campaign.findOne({ _id: req.params.id }, (err, result) => {
    if (err) { return next(err); }
    res.render('campaign/view', {
      title: 'Campaign ' + result.name,
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
    res.redirect('/campaign/view/' + campaign._id);
  });
};


exports.addBackerToCampaign = (slackId, campaignName) => {
  User.findOne({ slack: slackId }, (err, user) => {
    if (err) {
      console.log(err);
      return err;
    }
    Campaign.findOneAndUpdate(
      { name: campaignName },
      { $push: { backers: user._id } },
      { new: true }, (err, campaign) => {
        if (err) {
          console.log(err);
          return err;
        } else if (campaign) {
          console.log(`${user.profile.name} added to ${campaign.name}`);
        } else {
          console.log('An error ocured');
        }
      });
  });
};

exports.postTwitter = (userId, campaignId) => {
  const campaign = Campaign.findOne({ _id: campaignId }, (err, campaign) => {
    if (err) { return next(err); }
    return campaign;
  });

  const user = User.findOne({ _id: userId }, (err, user) => {
    if (err) { return next(err); }
    return user;
  });

  const token = user.tokens.find(token => token.kind === 'twitter');
  const T = new Twit({
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token: token.accessToken,
    access_token_secret: token.tokenSecret
  });

  T.post('statuses/update', { status: campaign.message_to_share }, (err) => {
    if (err) { return next(err); }
    console.log('Tweet posté');
  });
};

