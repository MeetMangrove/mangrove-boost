'use strict';
const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const Campaign = require('../models/Campaign');
const Share = require('../models/Share');
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
* GET /campaign/new/link
* Campaign Editor
*/
exports.step1 = (req, res) => {
  res.render('campaign/new/step1', {
    title: 'New Campaign'
  });
};

/**
* GET /campaign/new/infos/:id
* Campaign Editor
*/
exports.step2 = (req, res) => {
  res.render('campaign/new/step2', {
    title: 'New Campaign'
  });
};


/**
* GET /campaign/new/resume/:id
* Campaign Editor
*/
exports.step3 = (req, res) => {
  Campaign.findOne({ _id: req.params.id }, (err, result) => {
    if (err) { return next(err); }

    res.render('campaign/new/step3', {
      title: 'Campaign ' + result.name,
      campaign: result
    });
  });
};


/**
* POST /campaign/new/link
* Campaign Editor
*/
exports.postLink = (req, res, next) => {
  const link = req.body.link;
  if(!link.match(new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi))){
    req.flash('errors', { msg: "Url not match pattern" });
    return res.redirect('/campaign/new/link');
  }

  const campaign = new Campaign({
    link: link
  });

  campaign.save((err) => {
    if (err) { return (err); }
    res.redirect(`/campaign/new/infos/${campaign._id}`);
  });
}


 /**
  * POST /campaign/new/link
  * Create a new local account.
  */
exports.postInfos = (req, res, next) => {
  Campaign.findOne({ _id: req.params.id }, (err, campaign) => {
    if (err) { return next(err); }
    campaign.name = req.body.name;
    campaign.message_to_share = req.body.message_to_share;
    campaign.message_backers = req.body.message_backers;
    campaign.date_release = req.body.date_release;

    campaign.save((err) => {
      if (err) {
        req.flash('errors', err);
        return res.redirect(`/campaign/new/infos/${campaign._id}`);
      }
      getSlackUsers((slackUsers) => {
        formatBackers(slackUsers, (backers) => {
          Campaign.findOneAndUpdate(
            { _id: campaign._id },
            { $set: { backers: backers } },
            { new: true },
            (err, updatedCampaign) => {
              if (err) { return (err); }

              // Bot.sendStartCampaign(updatedCampaign);
              res.redirect(`/campaign/new/resume/${campaign._id}`);
            }
          );
        });
      });
    });
  });
};

/**
* POST /campaign/new/link
* Campaign Editor
*/
exports.postCampaign = (req, res, next) => {

}


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


exports.createShare = (slackId, campaignId, socialAccount) => {
  User.findOne({ slack: slackId }, (err, user) => {
    if (err) {
      return (err);
    }

    Campaign.findOne({ _id: campaignId }, (err, campaign) => {
      if (err) {
        return (err);
      }

      const share = new Share();
      share = {
        campaign: campaign._id,
        backer: user.slack,
        social_account: socialAccount,
        message_to_share: campaign.message_to_share,
        link: campaign.link,
        image: campaign.image
      };
      share.save((err) => {
        done(err, share);
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

   Share.findOneAndUpdate(
     { _id: share._id },
     { clic: share.clic + 1  },
     (err, campaign) => {
       if (err) {
         console.log(err);
         return err;
       } else if (campaign) {
         console.log(`${user.profile.name} added to ${campaign.name}`);
       } else {
         console.log('An error ocured');
       }
   });
   return res.redirect(share.link);
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



// exports.addAuthBackerToCampaign = (slackId, campaignId) => {
//   User.findOne({ slack: slackId }, (err, user) => {
//     if (err) {
//       console.log(err);
//       return err;
//     }
//     Campaign.findOneAndUpdate(
//       { name: campaignName },
//       { $push: { backers: user._id } },
//       { new: true }, (err, campaign) => {
//         if (err) {
//           console.log(err);
//           return err;
//         } else if (campaign) {
//           console.log(`${user.profile.name} added to ${campaign.name}`);
//         } else {
//           console.log('An error ocured');
//         }
//       });
//   });
// };

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
    console.log("Tweet posté");
  });
};
