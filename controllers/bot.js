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

// All incoming messages go through here
function handler(req, res) {
  const payload = JSON.parse(req.body.payload);
  const slack = payload.user;
  console.log(slack);
  if ((payload) && (payload.callback_id)) {
    if (payload.actions[0].name === 'yes') {
      // Prepare the tweet
      campaignsController.postTwitter(slack.id, payload.callback_id);
      return res.send(`Sweet ${slack.name}, let's make ${payload.callback_id} buzz!`);
    } else if (payload.actions[0].name === 'No') {
      return res.send('You clicked no');
    }
    return res.send('Sorry I, didn\'t get that');
  }
}

function formatNewCampaignMessage(campaign, cb) {
  const newCampaignMessage = {
      "text": `New buzz starting: ⚡️${campaign.name}⚡️\n ${campaign.message_backers}`,
      "attachments": [
        {
          "text": "Want to help the buzz?",
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
              "value": "yes"
            },
            {
              "name": "No",
              "text": "No",
              "style": "danger",
              "type": "button",
              "value": "no"
            }
          ]
        }
      ],
      "response_type": "ephemeral",
  };
  return cb(newCampaignMessage);
}

controller.on('direct_message', (bot, message) => {
  bot.startPrivateConversation({ user: process.env.SLACK_USER_ID }, (res, convo) => {
    convo.say(`I'll tell you when a new campaign starts.`);
  });
});

function sendStartCampaign(campaign) {
  // console.log('BACKERS', campaign.backers);
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
