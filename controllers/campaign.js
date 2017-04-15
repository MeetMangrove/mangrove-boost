const bluebird = require('bluebird');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const ShareController = require('./share');
const Bot = bluebird.promisifyAll(require('./bot'), { multiArgs: true });
const Twit = require('twit');
const path = require('path');

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
  // TODO:
  // Check REGEX match all url
  // if(!link.match(new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{0,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi))){
  //   req.flash('errors', { msg: "Url not match pattern" });
  //   return res.redirect('/campaign/new/link');
  // }

  const campaign = new Campaign({
    link: link,
    status: "draft"
  });

  campaign.save((err) => {
    if (err) { return (err); }
    res.redirect(`/campaign/new/infos/${campaign._id}`);
  });
}


/**
 * Get All Slack users
 */
function getSlackUsers(callback) {
  const token = process.env.SLACK_TOKEN;
  request.get({
    url: 'https://slack.com/api/users.list',
    qs: { token },
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
    backers.push(slackUsers[i].id);
    if (i === (slackUsers.length - 1)) {
      return callback(backers);
    }
  }
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
    campaign.end_date = req.body.end_date;
    campaign.image = req.file ? req.file.filename : "";

    campaign.save((err) => {
      if (err) {
        req.flash('errors', err);
        return res.redirect(`/campaign/new/infos/${campaign._id}`);
      }
      getSlackUsers((slackUsers) => {
        formatBackers(slackUsers, (backers) => {
          Campaign.findOneAndUpdate(
            { _id: campaign._id },
            { $set: { 'backers.waiting': backers } },
            { new: true },
            (err, updatedCampaign) => {
              if (err) { return (err); }
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
  Campaign.findOne({ _id: req.params.id }, (err, campaign) => {
    if (err) { return next(err); }

    campaign.status = "ongoing";
    campaign.start_date = new Date();
    campaign.save((err) => {
      if (err) { return (err); }
    });

    Bot.sendStartCampaign(campaign);
    req.flash('sucess', { msg: "Campaign send" });
    return res.redirect('/campaign/all');
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


// if backer supports the campaign, put it in the 'shared' group
exports.addBackerToSharedGroup = (slackId, campaignId) => {
  Campaign.findOneAndUpdate(
    { _id: campaignId },
    { $push: { 'backers.shared': slackId },
      $pull: { 'backers.waiting': slackId },
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
      $pull: { 'backers.waiting': slackId },
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

exports.testtwit = (req, res) => {
  this.postTwitter("U110CED2T", "58f1ff9a78a078798ac566ae", (tweetData) => {
    console.log(tweetData);
    console.log(`BOOM! Way to go. Here's your tweet: https://twitter.com/${tweetData.user.screen_name}/status/${tweetData.id_str}`);
  });
  res.render('home', {
    title: 'TESTTWITTER'
  });
};

exports.postTwitter = (slackId, campaignId, callback) => {
  Campaign.findOne({ _id: campaignId }, (err, campaign) => {
    if (err) { return (err); }
    if (campaign) {
      // Works until here
      User.findOne({ slack: slackId }, (err, user) => {
        if (err) {
          return (err);
        }
        if (user) {
          ShareController.createShare(user.slack, campaign._id, "twitter", (share) => {
            const token = user.tokens.find(token => token.kind === 'twitter');
            const T = new Twit({
              consumer_key: process.env.TWITTER_KEY,
              consumer_secret: process.env.TWITTER_SECRET,
              access_token: token.accessToken,
              access_token_secret: token.tokenSecret
            });
            //
            // post media via the chunked media upload API.
            const filePath = path.join(__dirname, '../', `uploads/${campaign.image}`);
            T.postMediaChunked({ file_path: filePath }, (err, data, response) => {
              if (err) { return err; }
              const mediaIdStr = data.media_id_string;
              // now we can reference the media and post a tweet (media will attach to the tweet)
              const params = {
                status: `${campaign.message_to_share} ${process.env.APP_URI}/share/${share._id} `,
                media_ids: [mediaIdStr]
              };
              // Call Twitter API and post Tweet
              T.post('statuses/update', params, (err, tweetData, response) => {
                if (err) { return (err); }
                console.log('Tweet sent');
                return callback(tweetData);
              });
            });
          });
        }
      });
    }
  });
};
