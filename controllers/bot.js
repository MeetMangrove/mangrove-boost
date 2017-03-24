var Botkit = require('botkit');


var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token,
    incoming_webhook: {
        url: ""
    }
}).startRTM();
