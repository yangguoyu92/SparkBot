var Flint = require('node-flint');
var webhook = require('node-flint/webhook');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require("fs");
var redisDriver = require('node-flint/storage/redis');


app.use(bodyParser.json());

// flint options
var config = {
  webhookUrl: 'http://13.250.176.104:8080/flint',
  token: 'Njc0MzdlNTUtZGNjMS00M2U5LWFlY2YtOGI3YzU3MDQ4NzY1ZWQ4YjhlMzQtZTk1',
  port: 8080,
  removeWebhooksOnStart: false,
  maxConcurrent: 5,
  minTime: 50
};

// init flint
var flint = new Flint(config);
flint.start();

//set redis as storage
flint.storageDriver(redisDriver('redis://localhost'));

var state = 'query';
var inputAcro;
// add flint event listeners
flint.on('message', function(bot, trigger, id) {
  //flint.debug('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.roomTitle);
  console.log('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.roomTitle);
  if(trigger.personEmail != 'acro@sparkbot.io') {
    var text = trigger.text;
    
    switch (state) {
      case 'query':
        var value = bot.recall(text);
        console.log(value);
        if(value == undefined) {
          state = 'ask';
          inputAcro = text;
          bot.say('No result. Would you like to add this to the library? (yes/no)');
        }else {
          bot.say(value);
        }
        break;
      case 'ask':
        if(text == 'yes') {
          state = 'add';
          bot.say('Please send me the explaination.');
        }else {
          state = 'query';
        }
        break;
      case 'add':
        bot.store(inputAcro, text);
        state = 'query';
        bot.say('Thanks for your contribution!');
        break;
      default:
        // code
    }
  }
});

flint.on('initialized', function() {
  //flint.debug('initialized %s rooms', flint.bots.length);
  console.log('initialized %s rooms', flint.bots.length);
});

// define express path for incoming webhooks
app.post('/flint', webhook(flint));

// start express server
var server = app.listen(config.port, function () {
  //flint.debug('Flint listening on port %s', config.port);
  console.log('Flint listening on port %s', config.port);
});

// gracefully shutdown (ctrl-c)
process.on('SIGINT', function() {
  flint.debug('stoppping...');
  server.close();
  flint.stop().then(function() {
    process.exit();
  });
});
