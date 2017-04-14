const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Bot = bluebird.promisifyAll(require('./bot'), { multiArgs: true });
const Twit = require('twit');

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
 * Get All Slack users
 */
function getSlackUsers(callback) {
  const token = process.env.SLACK_TOKEN;
  request.get({
    url: 'https://slack.com/api/users.list',
    qs: { token: token },
    json: true
  }, (err, request, body) => {
    if (err) {
      return (err);
    }
    return callback(body.members);
  });
}

function formatBackers(slackUsers, callback) {
  const backers = [];
  for (let i = 0; i < slackUsers.length; i++) {
    backers.push({
      user_slack_id: slackUsers[i].id,
      auth_post: false
    });
    if (i === (slackUsers.length - 1)) {
      return callback(backers);
    }
  }
}

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
    if (err) { return (err); }

    getSlackUsers((slackUsers) => {
      formatBackers(slackUsers, (backers) => {
        Campaign.findOneAndUpdate(
          { _id: campaign._id },
          { $set: { 'backers.waiting': backers } },
          { new: true },
          (err, updatedCampaign) => {
            if (err) { return (err); }

            Bot.sendStartCampaign(updatedCampaign);
            res.redirect(`/campaign/view/${updatedCampaign._id}`);
          }
        );
      });
    });
  });
};

exports.postTwitter = (slackId, campaignId) => {
  Campaign.findOne({ _id: campaignId }, (err, campaign) => {
    if (err) {
      return (err);
    }
    if (campaign) {
      User.findOne({ slack: slackId }, (err, user) => {
        if (err) {
          return (err);
        }
        const token = user.tokens.find(token => token.kind === 'twitter');
        const T = new Twit({
          consumer_key: process.env.TWITTER_KEY,
          consumer_secret: process.env.TWITTER_SECRET,
          access_token: token.accessToken,
          access_token_secret: token.tokenSecret
        });
        T.post('statuses/update', { status: campaign.message_to_share }, (err) => {
          if (err) {
            return (err);
          }
          console.log('Tweet posté');
        });
      });
    }
  });
};

// if backer supports the campaign, put it in the 'shared' group
exports.addBackerToSharedGroup = (slackId, campaignId) => {
  Campaign.findOneAndUpdate(
    { _id: campaignId },
    { $push: { 'backers.shared': slackId },
      $pull: { 'backers.waiting': { auth_post: false, user_slack_id: slackId } },
    },
    { new: true },
    (err, updatedCampaign) => {
      if (err) {
        return err;
      }
      return updatedCampaign;
    }
  );
};

// if backer refuses to support the campaign, add to 'refused' group
exports.addBackerToRefusedGroup = (slackId, campaignId) => {
  Campaign.findOneAndUpdate(
    { _id: campaignId },
    { $push: { 'backers.refused': slackId },
      $pull: { 'backers.waiting': { auth_post: false, user_slack_id: slackId } },
    },
    { new: true },
    (err, updatedCampaign) => {
      if (err) {
        return err;
      }
      return updatedCampaign;
    }
  );
};

exports.postTwitter = (slackId, campaignId) => {
  Campaign.findOne({ _id: campaignId }, (err, campaign) => {
    if (err) { return (err); }
    if (campaign) {
      // Works until here
      User.findOne({ slack: slackId }, (err, user) => {
        if (err) {
          return (err);
        }
        if (user) {
          const token = user.tokens.find(token => token.kind === 'twitter');
          const T = new Twit({
            consumer_key: process.env.TWITTER_KEY,
            consumer_secret: process.env.TWITTER_SECRET,
            access_token: token.accessToken,
            access_token_secret: token.tokenSecret
          });
          // Call Twitter API and post Tweet
          T.post('statuses/update', { status: campaign.message_to_share }, (err) => {
            if (err) { return (err); }
            console.log('Tweet sent');
          });
        }
      });
    }
  });
};
