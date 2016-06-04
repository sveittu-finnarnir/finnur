'use strict';

const _ = require('lodash');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const Bluebird = require('bluebird');
const co = require('co');

const app = express();
const facebook = require('./repositories/facebook');

const stateMap = {};
const flows = {
  authorisation: require('./flows/authorisation')
};
const wit = require('./repositories/wit');

// Set up database connection.
if (!_.has(process.env, 'DATABASE_URL')) {
  console.log('DATABASE_URL env variable missing');
  process.exit(-1);
}
var knex = require('knex')({
  client: 'postgres',
  connection: process.env.DATABASE_URL,
//  debug: process.env.NODE_ENV !== 'prod'
});

// view engine setup
// app.set('views', path.join(__dirname, '../views'));
// app.set('view engine', 'html');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Routing

app.get('/', function (req, res, next) {
  knex('Users')
  .then(users => {
    console.log(users);
    res.json('dawg');
  });
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
    getUser(sender.id).then((user) => {
      //console.log('Current user:', user);
      return runStateMachine(user, event.message.text);
    }).then((reply) => {
      if(process.env.NODE_ENV === 'prod') {
        facebook.sendMessage(sender.id, reply);
        res.status(200).send();
      } else {
        res.status(200).send('Finnur says: ' + reply);
      }
    });
  });
});

function runStateMachine(user, message) {
  let initialState = process.env.NODE_ENV === 'prod' ? loggedOutState : loggedInState;
  let handler = stateMap[user.id] || initialState;
  return handler(message, user)
  .then((result) => {
    stateMap[user.id] = result[0];
    return result[1];
  }).catch((err) => {
    console.error(err);
  });
}

function getUser(fbid) {
  return knex('Users').where('id', fbid)
  .then(user => {
    if (!user) {
      return facebook.getUserDetails(fbid)
      .then(fbUser => {
        return _.merge(fbUser, { id: fbid });
      })
      .then(user => {
        return knex('Users').insert(user).returning('*');
      })
      .then(_.first);
    } else if (!user.first_name) {
      return facebook.getUserDetails(fbid)
      .then(user => {
        return knex('Users').where('id', fbid)
        .update(user).returning('*')
      .then(_.first);
      });
    }
    return user;
  });
}

// pragma mark - states

function loggedOutState (input, user) {
  return flows.authorisation.start(loggedInState, user).then((nextState) => {
    return [
      nextState,
      `Hi ${user.first_name}, Thanks for getting in touch!\n
To continue, I'm going to have to verify your identity.
Please type in the token I just sent you!`
    ];
  });
}

let loggedInState = co.wrap(loggedInStateStuff);
function* loggedInStateStuff (input, user) {
  console.log('input:', input);
  let message = yield wit.processMessageNew(input, user);
  console.log('message:', message);
  return [loggedInState, message];
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
