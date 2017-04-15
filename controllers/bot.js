const campaignsController = require('./campaign');
const Botkit = require('botkit');
const dotenv = require('dotenv');
const CronJob = require('cron').CronJob;

const User = require('../models/User');
const Campaign = require('../models/Campaign');

dotenv.load({ path: '.env' });

const controller = Botkit.slackbot({
});

const bot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  incoming_webhook: {
    url: process.env.SLACK_WEBHOOK_URL
  }
}).startRTM();


// JSON Messages with attachments
function formatFirstNoMessage(callbackId) {
  const firstNoMessage = {
    "attachments": [
      {
        "text": '😥 Are you sure?',
        "fallback": "Too bad.",
        "callback_id": callbackId,
        "color": "#3AA3E3",
        "attachment_type": "default",
        "actions": [
          {
            "name": "firstNo",
            "style": "primary",
            "text": "I made a mistake",
            "type": "button",
            "value": "helpMangrove",
            "color": "good"
          },
          {
            "name": "firstNo",
            "text": "I don't want to help",
            "style": "danger",
            "type": "button",
            "value": "stillNo"
          }
        ]
      }
    ]
  };
  return firstNoMessage;
}

function formatNewCampaignMessage(campaign, cb) {
  const newCampaignMessage = {
      "text": "🚀*New boost starting*🚀",
      "attachments": [
        {
          "title": `️${campaign.message_backers}`,
          "title_link": `${process.env.APP_URI}/campaign/view/${campaign._id}`,
          "fallback": "A new boost is starting:",
          "callback_id": campaign._id,
          "text": `Your Tweet: "${campaign.message_to_share}"`,
          "attachment_type": "default",
          "actions": [
            {
              "name": "newCampaign",
              "style": "primary",
              "text": "Tweet to help Mangrove ❤️",
              "type": "button",
              "value": "supportTwitter",
              "color": "good"
            },
            {
              "name": "newCampaign",
              "text": "I don't want to help",
              "style": "danger",
              "type": "button",
              "value": "noSupport"
            }
          ],
          "footer": "By Mangrove",
          "footer_icon": "https://pbs.twimg.com/profile_images/702777844976459776/fA19a6jo.png",
          "color": "#3AA3E3",
        }
      ],
      "response_type": "ephemeral",
  };
  return cb(newCampaignMessage);
}

function formatFollowUpMessage(campaign, cb) {
  let followUpMessage = {
      "text": "*We still haven't heard from you 🚀*",
      "attachments": [
        {
          "title": `️${campaign.message_backers}`,
          "title_link": `${process.env.APP_URI}/campaign/view/${campaign._id}`,
          "fallback": "Help mangrove make the buzz:",
          "callback_id": campaign._id,
          "text": `Your Tweet: "${campaign.message_to_share}"`,
          "attachment_type": "default",
          "actions": [
            {
              "name": "followUp",
              "style": "primary",
              "text": "Help Mangrove ❤️",
              "type": "button",
              "value": "supportTwitter",
              "color": "good"
            },
            {
              "name": "followUp",
              "text": "Don't help",
              "style": "danger",
              "type": "button",
              "value": "noSupport"
            }
          ]
        }
      ],
      "response_type": "ephemeral",
  };
  return cb(followUpMessage);
}

let optOutMessage = {
  "attachments": [
    {
      "text": "Fine then 😅 I'll keep you posted",
      "fallback": "That didn't work",
      "callback_id": "optOut",
      "color": "#3AA3E3"
    }
  ]
};

// IMPORTANT
// All incoming messages go through here
function handler(req, res) {
  const payload = JSON.parse(req.body.payload);
  const slack = payload.user;
  console.log(payload);
  if ((payload) && (payload.callback_id)) {
    // First time user refuses to support a campaign
    if (payload.actions[0].name === 'firstNo') {
      if (payload.actions[0].value === 'helpMangrove') {
        campaignsController.postTwitter(slack.id, payload.callback_id);
        return res.send(`Tweet sent! Way to go ${slack.name} 🙏`);
      } else if (payload.actions[0].value === 'stillNo') { // User confirms he doesn't want to share
        campaignsController.addBackerToRefusedGroup(slack.id, payload.callback_id);
        return res.send(optOutMessage);
      }
    } else if ((payload.actions[0].name === 'newCampaign') || (payload.actions[0].name === 'followUp')) { // When a new campaign starts
      if (payload.actions[0].value === 'noSupport') {
        return res.send(formatFirstNoMessage(payload.callback_id));
      }
      // Check if user exists
      User.findOne({ slack: slack.id }, (err, user) => {
        if (err) {
          return res.end(err);
        }
        if (!user) {
          // Ask user to sign up
          return res.send(`Sweet! You need to sign up first --> ${process.env.APP_URI}/login`);
        } else if (user) {
          if (payload.actions[0].value === 'supportTwitter') {
            // Check that Twitter account is linked
            if (!user.twitter) {
              return res.send(`Connect your Twitter account first: ${process.env.APP_URI}/login`);
            }
            campaignsController.addBackerToSharedGroup(slack.id, payload.callback_id);
            campaignsController.postTwitter(slack.id, payload.callback_id, (tweetData) => {
              return res.send(`BOOM! Way to go ${slack.name}. Here's your tweet: https://twitter.com/${tweetData.user.screen_name}/status/${tweetData.id_str}`);
            });
          }
        }
      });
    }
  } else {
    return res.send('Sorry I, didn\'t get that');
  }
}


// Whenever a user talks to the bot
controller.on('direct_message', (bot, message) => {
  bot.startPrivateConversation({ user: process.env.ANTONIN_SLACK_ID }, (res, convo) => {
    convo.say('I\'ll tell you when a new campaign starts.');
  });
});

// When campaign is created, bot pings slack users
function sendStartCampaign(campaign) {
  campaign.backers.waiting.forEach((backer) => {
    // IMPORTANT: Prevents from spamming whole team
    if (backer.user_slack_id !== process.env.ANTONIN_SLACK_ID) {
      return;
    }
    bot.startPrivateConversation({ user: backer.user_slack_id }, (res, convo) => {
      formatNewCampaignMessage(campaign, (campaignMessage) => {
        convo.say(campaignMessage);
      });
    });
  });
}

// Find all ongoing campaigns
function findOngoingCampaigns(callback) {
  Campaign.find({ end_date: { $gt: new Date() } }).exec((err, campaigns) => {
    if (err) {
      return callback(err);
    }
    return callback(campaigns);
  });
}

// for a given campaign, find all the waiting backers and ping them
function sendFollowUpMessage(campaign) {
  campaign.backers.waiting.forEach((backer) => {
    // IMPORTANT: Prevents from spamming whole team
    if (backer.user_slack_id !== process.env.ANTONIN_SLACK_ID) {
      return;
    }
    bot.startPrivateConversation({ user: backer.user_slack_id }, (res, convo) => {
      formatFollowUpMessage(campaign, (followUpMessage) => {
        convo.say(followUpMessage);
      });
    });
  });
}

// Background job that checks ongoing campaigns,
// and send follow up messages to waiting backers
// runs every day at 10am Paris time
new CronJob('10 * * *', () => {
  findOngoingCampaigns((campaigns) => {
    campaigns.forEach((campaign) => {
      sendFollowUpMessage(campaign);
    });
  });
}, null, true, 'Europe/Paris');

exports.handler = handler;
exports.sendStartCampaign = sendStartCampaign;
