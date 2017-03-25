const Botkit = require('botkit');
const dotenv = require('dotenv');

dotenv.load({ path: '.env' });


const controller = Botkit.slackbot({
  debug: true,
});

const bot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  incoming_webhook: {
    url: 'https://hooks.slack.com/services/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'
  }
}).startRTM();

controller.hears('', 'direct_mention', function(bot, message) {
  bot.reply(message, {
    attachments:[
      {
        title: 'Do you want to interact with my buttons?',
        callback_id: '123',
        attachment_type: 'default',
        actions: [
          {
            "name":"yes",
            "text": "Yes",
            "value": "yes",
            "type": "button",
          },
          {
            "name":"no",
            "text": "No",
            "value": "no",
            "type": "button",
          }
        ]
      }
    ]
  });
});
