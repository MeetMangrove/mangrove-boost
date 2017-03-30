
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
      return res.send('You clicked yes');
    } else if (payload.actions[0].name === 'No') {
      return res.send('You clicked no');
    }
    return res.send('Sorry I, didn\'t get that');
  }
}

function addBackerToCampaign(slackUserId, campaignId) {
  // Find related campaign
  // Add user id to list of subscribers
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
                  "value": "no"
                }
            ]
        }
    ],
    "replace_original": "true",
    "response_type": "ephemeral",
    'parse' : 'full',
    'username': 'Bitch bot' ,
    'icon_url': 'https://media.giphy.com/media/LhVGZXspUHbhK/giphy.gif',
    'channel': '#mangrove-boost'
};

controller.on('direct_message,direct_mention,mention', (bot, message) => {
  bot.sendWebhook(campaignMessage, (err, res) => {
    if (err) {
      console.log(err);
    }
  });
});



exports.sendStartCampaign = () => {
  bot.startPrivateConversation({user: 'U110CED2T'}, function(res, convo){
    convo.say("Coucou");
  });
};

exports.handler = handler;
