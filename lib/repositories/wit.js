'use strict';

const util = require('util');
const token = 'CTJBQZWKT2PEZP6AONGLEFEIUWD5TALB';
const WitLogger = require('node-wit').Logger;
const LOG_LEVELS = require('node-wit').logLevels;
const Wit = require('node-wit').Wit;
const Bluebird = require('bluebird');
const _ = require('lodash');
const uuid = require('node-uuid');

const userToSession = {};
const messageToSend = {};

const actions = {
  say (sessionId, context, message, cb) {
    console.log('saying:', message);
    messageToSend[sessionId] = message;
    cb();
  },
  merge (sessionId, context, entities, message, cb) {
    console.log('{context:', context, ', entities:', entities, '}');
    if (_.has(entities, 'intent')) {
      context.intent = entities.intent[0].value;
    }
    if (_.has(entities, 'account_type')) {
      context.account = entities.account_type[0].value;
    }
    cb(context);
  },
  error (sessionId, context, error) {
    console.log(error.message);
  },
  getAccountBalance (sessionId, context, cb) {
    console.log('getAccountBalance for:', context);

    let session = _.find(userToSession, { sessionId });
    console.log('fetching balance for userId:', session.userId, ' - resetting context');
    session.context = {};
    session.isFinished = true;

    let res = _.merge(context, { balance: 500 });
    console.log('res:', res);
    cb(res);
  }
};

const logger = new WitLogger(LOG_LEVELS.WARN);
const client = Bluebird.promisifyAll(new Wit(token, actions, logger));

function parse(message) {
  const context = {};
  return client.messageAsync(message, context)
  .then(data => {
    console.log('wit.ai response:', util.inspect(data, { depth: null }));
    return data;
  });
}

function converse(sessionId, message, context) {
  console.log(`[${sessionId}] parsing: "${message}" with context:`, context);
  return client.runActionsAsync(sessionId, message, context)
  .then(newContext => {
    console.log(`[${sessionId}] new state for: ${JSON.stringify(newContext)}`);
    return newContext;
  });
}

function processMessage(input, user) {
  // Create a session for the user if it doesn't exist
  if (!_.has(userToSession, user.id)) {
    userToSession[user.id] = {
      sessionId: uuid.v4(),
      context: {},
      userId: user.id
    };
  }
  let session = userToSession[user.id];
  let sessionId = session.sessionId;
  let context = session.context;

  return converse(sessionId, input, context)
  .then(newContext => {
    if (!session.isFinished) {
      session.context = newContext;
    } else {
      delete session.isFinished;
      session.context = {};
    }

    return messageToSend[sessionId];
  });
}

/*
let sessionId = 'banani';
converse(sessionId, 'What is my account balance?', {userId: 'krummi'})
.then(newContext => {
  console.log('newContext:', newContext);
  return converse(sessionId, 'on the credit card', newContext);
});
*/

// Exports

module.exports = {
  processMessage
};
