'use strict';

const _ = require('lodash');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));

const app = express();
const PAGE_TOKEN = process.env['PAGE_TOKEN'];

<<<<<<< 737402c6b21977dd838dadbb8deff9b7f7f1f780
const flows = {
  authorisation: require('./flows/authorisation')
};
const authy = flows.authorisation.authy;

=======
const authy = Bluebird.promisifyAll(require('authy')(AUTHY_KEY));
const wit = require('./lib/wit');
>>>>>>> Things

const db = {};

// view engine setup
// app.set('views', path.join(__dirname, '../views'));
// app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Routing

app.get('/', function (req, res, next) {
  // log.debug('DATABASE_URL:', conf.get('DATABASE_URL'));
  // console.log(knex.select('*').from('Videos'));

  res.json('dawg');
});

app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'my_body_is_my_temple') {
    res.send(req.query['hub.challenge']);
  }
  res.status(400);
  res.json({ error: 'Error, wrong validation token' });
});

app.post('/webhook/', function (req, res) {
  let messaging_events = req.body.entry[0].messaging;
  _.forEach(messaging_events, (event) => {
    let sender = event.sender;
    runStateMachine(sender, event.message.text)
    .then((reply) => {
      sendFacebookMessage(sender.id, reply);
    });
  });
  res.status(200).send();
});

function runStateMachine(user, message) {
  let handler = db[user.id] || loggedOutState;
  return handler(message, user)
  .then((result) => {
    db[user.id] = result[0];
    return result[1];
  }).catch((err) => {
    console.error(err);
  });
}

// pragma mark - states

function loggedOutState (input, user) {
  return flows.authorisation.start().then((nextState) => {
    return [
      nextState,
      `Hi ${user.id}, Thanks for getting in touch!\n
To continue, I'm going to have to verify that you are.
Please type in the token I just sent you!`
    ];
  });
}

// pragma mark - Functions

function registerUser (email, phone) {
  return authy.register_userAsync(email, phone, '354', false)
  .then((res) => {
    return res.user.id;
  })
  .catch((err) => {
    console.error('error communicating with authy');
    console.error(err);
  });
}

function sendFacebookMessage(sender, text) {
  let messageData = { text };
  return request.postAsync({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_TOKEN },
    json: {
      recipient: { id: sender },
      message: messageData,
    }
  }).then(function (response) {
    if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  }).catch(function (err) {
    console.error(err);
  });
}

// Setup the development environment.
if (app.get('env') === 'development') {
  // Error handling.
  app.use(function(err, req, res, next) {
    console.error({ err: err }, 'Error hit in development.');
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.error({ err: err }, 'Error hit in development.');
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: {}
  });
});

app.set('port', process.env.PORT || 3000);

module.exports = app;
