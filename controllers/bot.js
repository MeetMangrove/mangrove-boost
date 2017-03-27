
const Botkit = require('botkit');
const dotenv = require('dotenv');

dotenv.load({ path: '.env' });


const controller = Botkit.slackbot({
  incoming_webhook: {
    url: 'https://hooks.slack.com/services/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'
  }
});

const bot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  incoming_webhook: {
    url: process.env.SLACK_WEBHOOK_URL
  }
}).startRTM();

controller.on('direct_message,direct_mention,mention', (bot, message) => {
  bot.sendWebhook({
    text: 'Ce bot va casser des culs',
    channel: '#mangrove-boost',
    username: 'booster',
    icon_emoji: ':zap:',
  }, (err, res) => {
    if (err) {
      // ...
    }
  });
  console.log('message:', message);
  // start a conversation to handle this response.
  // bot.startConversation(message, (err, convo) => {
  //   convo.say('Hey dude!');
  //   convo.ask({
  //     attachments: [
  //       {
  //         title: 'Wanna support the next campaign?',
  //         callback_id: '123',
  //         attachment_type: 'default',
  //         actions: [
  //           {
  //             "name":"yes",
  //             "text": "Yes",
  //             "value": "yes",
  //             "type": "button",
  //           },
  //           {
  //             "name":"no",
  //             "text": "No",
  //             "value": "no",
  //             "type": "button",
  //           }
  //         ]
  //       }
  //     ]
  //   });
  // });
});


// EXAMPLE MESSAGE
// message: { type: 'message',
//   channel: 'D4PMUAB0C',
//   user: 'U0QKVT0HF',
//   text: 'Hello',
//   ts: '1490624192.494859',
//   source_team: 'T0QJH8NJK',
//   team: 'T0QJH8NJK',
//   event: 'direct_message',
//   match: [ 'Hello', index: 0, input: 'Hello' ] }
