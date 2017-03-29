
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
  console.log('loggi,ng');
  return res.sendStatus(200);
}

const campaignMessage = {
    "text": "<https://mangrove-boost.herokuapp.com|A new campaign> is starting. Do you want to support it?",
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
                    "value": "no",
                    "confirm": {
                        "title": "Are you sure?",
                        "text": "Wouldn't you prefer to support it?",
                        "ok_text": "Yes",
                        "dismiss_text": "No"
                    }
                }
            ]
        }
    ],
    "replace_original": "true",
    "response_type": "ephemeral"
}


controller.on('direct_message,direct_mention,mention', (bot, message) => {
  bot.sendWebhook(campaignMessage, (err, res) => {
    if (err) {
      console.log(err);
    }
  });
});

exports.handler = handler;
