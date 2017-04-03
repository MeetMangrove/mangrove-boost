const campaignsController = require('./campaign');
const Botkit = require('botkit');
const dotenv = require('dotenv');

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
const noMessage = {
  "attachments": [
    {
      "text": '😥 Are you sure you don\'t want to help your friends at Mangrove?',
      "fallback": "Too bad.",
      "callback_id": "firstNo",
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [
        {
          "name": "yes",
          "style": "primary",
          "text": "Help Mangrove",
          "type": "button",
          "value": "helpMangrove",
          "color": "good"
        },
        {
          "name": "no",
          "text": "Be selfish",
          "style": "danger",
          "type": "button",
          "value": "stillNo"
        }
      ]
    }
  ]
};

function formatNewCampaignMessage(campaign, cb) {
  const newCampaignMessage = {
      "text": `⚡*New boost starting*⚡`,
      "attachments": [
        {
          "title": `Help ️${campaign.name} Make The Buzz`,
          "text": `Click on *'Yes'* to tweet this: ${campaign.message_to_share}`,
          "fallback": "You are unable to support the campaign",
          "callback_id": campaign._id,
          "color": "#3AA3E3",
          "attachment_type": "default",
          "actions": [
            {
              "name": "yes",
              "style": "primary",
              "text": "Yes",
              "type": "button",
              "value": "support",
              "color": "good"
            },
            {
              "name": "no",
              "text": "No",
              "style": "danger",
              "type": "button",
              "value": "noSupport"
            }
          ]
        }
      ],
      "response_type": "ephemeral",
  };
  return cb(newCampaignMessage);
}

const optOutMessage = {
  "attachments": [
    {
      "text": 'Fine then 😞 Do you still want to be notified for the next boost? 🐣',
      "fallback": "That didn't work",
      "callback_id": "optOut",
      "color": "#3AA3E3",
      "attachment_type": "default",
      "actions": [
        {
          "name": "yes",
          "style": "primary",
          "text": "Yes, notify me ❤️",
          "type": "button",
          "value": "userStays",
          "color": "good"
        },
        {
          "name": "no",
          "text": "No, no, and no!",
          "style": "danger",
          "type": "button",
          "value": "userLeaves"
        }
      ]
    }
  ]
};

// IMPORTANT
// All incoming messages go through here
function handler(req, res) {
  const payload = JSON.parse(req.body.payload);
  const slack = payload.user;
  if ((payload) && (payload.callback_id)) {
    // The first time a user says no to supporting a campaign
    if (payload.callback_id === 'firstNo') {
      if (payload.actions[0].value === 'helpMangrove') {
        campaignsController.postTwitter(slack.id, payload.callback_id);
        return res.send(`Tweet sent! Way to go ${slack.name} 🙏`);
      } else if (payload.actions[0].value === 'stillNo') {
        return res.send(optOutMessage);
      }
      // When user is sure he doesn't want to share
    } else if (payload.callback_id === 'optOut') {
      if (payload.actions[0].value === 'userStays') {
        return res.send('You\'re a charm ❤️ We\'ll keep you posted');
      } else if (payload.actions[0].value === 'userLeaves') {
        return res.send('Fine, you\'re out! Reach out when you change your mind. I don\'t hold grudges 😘');
      }
    }
    if (payload.actions[0].value === 'support') {
      // Send tweet immediately
      campaignsController.postTwitter(slack.id, payload.callback_id);
      return res.send(`Tweet sent! Way to go ${slack.name} 🙏`);
    } else if (payload.actions[0].value === 'noSupport') {
      return res.send(noMessage);
    }
    return res.send('Sorry I, didn\'t get that');
  }
}

// Whenever a user talks to the bot
controller.on('direct_message', (bot, message) => {
  bot.startPrivateConversation({ user: process.env.SLACK_USER_ID }, (res, convo) => {
    convo.say('I\'ll tell you when a new campaign starts.');
  });
});

// When a campaign is created, the bot pings slack users
function sendStartCampaign(campaign) {
  campaign.backers.forEach((backer) => {
    if (backer.user_slack_id !== process.env.SLACK_USER_ID) {
      return;
    }
    bot.startPrivateConversation({ user: backer.user_slack_id }, (res, convo) => {
      formatNewCampaignMessage(campaign, (campaignMessage) => {
        convo.say(campaignMessage);
      });
    });
  });
}

exports.handler = handler;
exports.sendStartCampaign = sendStartCampaign;
