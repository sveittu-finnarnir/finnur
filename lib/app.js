'use strict';

const _ = require('lodash');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Set up database connection.
// var knex = require('knex')({
//  client: 'postgres',
//  connection: conf.get('DATABASE_URL')
//});

var app = express();

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
    let sender = event.sender.id;
    if (event.message && event.message.text) {
      let text = event.message.text;
      // Handle a text message from this sender
      console.log(sender, text);
    } else {
      res.status(400).send();
    }
  });
  res.status(200).send();
});

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
