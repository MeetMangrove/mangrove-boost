
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

function handler(req, res) {
  const payload = JSON.parse(req.body.payload);
  if ((payload) && (payload.callback_id === 'new_campaign')) {
    if (payload.actions[0].name === 'yes') {
      console.log(req.body);
      return res.send('You clicked yes');
    } else if (payload.actions[0].name === 'No') {
      return res.send('You clicked no');
    }
    return res.send('Sorry I, didn\'t get that');
  }
}

const campaignMessage = {
    "text": "A new campaign is starting. Do you want to support it?",
    "attachments": [
      {
        "text": "Choose an answer",
        "fallback": "You are unable to support the campaign",
        "callback_id": "new_campaign",
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
    "replace_original": "true",
    "response_type": "ephemeral",
};

controller.on('direct_message', (bot, message) => {
  bot.startPrivateConversation({ user: process.env.SLACK_USER_ID }, (res, convo) => {
    convo.say(campaignMessage);
  });
});

exports.sendStartCampaign = (campaign) => {
  // console.log('BACKERS', campaign.backers);
  campaign.backers.forEach((backer) => {
    if (backer.user_slack_id !== process.env.SLACK_USER_ID) {
      return;
    }

    bot.startPrivateConversation({ user: backer.user_slack_id }, (res, convo) => {
      convo.say(campaignMessage);
    });
  });
};

exports.handler = handler;
