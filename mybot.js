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

//define help instructions
flint.hears('/help', function(bot, trigger) {
  bot.say('Hello %s!\n' +
  'If you want to search for an acronym, just send it to me!\n' +
  'If you want to add a new item to the library, please enter in this format: /add ACI Application Centric Infrastructure', 
  trigger.personDisplayName);
});

//add an item
flint.hears('/add', function(bot, trigger) {
  bot.say('Thanks for your contribution!');
  var text = trigger.text;
  var array = text.split(' ');
  console.log(array);
  var key = array[1];
  array.splice(0, 2);
  var value = array.join(' ');
  console.log('key: ' + key);
  console.log('value: '+ value);
  if(key == undefined || value == '') {
    bot.say('Please enter in this format: /add ACI Application Centric Infrastructure');
  }
  bot.store(key, value);
});

flint.hears('/hello', function(bot, trigger) {
    bot.say('Hello %s! Type /help to see more instructions.', trigger.personDisplayName);
});

// add flint event listeners
flint.on('message', function(bot, trigger, id) {
  //flint.debug('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.roomTitle);
  console.log('"%s" said "%s" in room "%s"', trigger.personEmail, trigger.text, trigger.roomTitle);
  var prefix = trigger.text.split(' ')[0];
  if(trigger.personEmail != 'acro@sparkbot.io' && prefix != '/add' && prefix != '/help' && prefix != '/hello') {
    var text = trigger.text;
    var value = bot.recall(text);
    if(value == undefined) {
      bot.say('No result. If you want to add this new item to the library, please enter in the format: /add ACI Application Centric Infrastructure');
    }else {
      bot.say(value);
    }
  }
});

flint.on('initialized', function(bot) {
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
