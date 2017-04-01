'use strict';

const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Bot = bluebird.promisifyAll(require('./bot'), { multiArgs: true });


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

      this.getSlackUsers(result);

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
    message_to_share: req.body.message_to_share,
    message_backers: req.body.message_backers,
    date_release: req.body.date_release
   });

   campaign.save((err) => {
     if (err) { return next(err); }
     this.getSlackUsers(campaign).then(function(p) {
       Bot.sendStartCampaign();
       res.redirect('/campaign/view/'+campaign._id);
     });
   });
 };



exports.addAuthBackerToCampaign = (slackId, campaignId) => {
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


/**
 * Get All Slack users
 */
exports.getSlackUsers = (campaign) => {
  return new Promise(function (resolve, reject) {
    const token = process.env.SLACK_TOKEN;
    request.get({ url: 'https://slack.com/api/users.list', qs: { token: token }, json: true }, (err, request, body) => {
      if (err) { return next(err); }
      body.members.forEach(function(member){
        campaign.backers.push({
          user_slack_id: member.id,
          auth_post: false
        });
      });

      Campaign.update(
        { _id: campaign._id},
        { $set: {backers: campaign.backers}},
        function(err) { return err; }
      );
    });
    resolve(campaign);
  });
};


 exports.postTwitter = (userId, campaignId) => {
   campaign = Campaign.findOne({_id: campaignId}, (err, campaign) => {
     if (err) { return next(err); }
     return campaign;
   });

   user = User.findOne({_id: userId}, (err, user) => {
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
     console.log("Tweet posté");
   });
 };
