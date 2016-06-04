'use strict';

const token = 'CTJBQZWKT2PEZP6AONGLEFEIUWD5TALB';
const WitLogger = require('node-wit').Logger;
const LOG_LEVELS = require('node-wit').logLevels;
const Wit = require('node-wit').Wit;
const Bluebird = require('bluebird');
const _ = require('lodash');
const uuid = require('node-uuid');
const arion = require('./arion');
const meniga = require('./meniga');
const facebook = require('./facebook');

const userToSession = {};
const messageToSend = {};

function extractEntities (entities, list) {
  let newContext = {};
  _.forEach(list, (entity) => {
    if (_.has(entities, entity)) {
      newContext[entity] = _.first(entities[entity]).value;
    }
  });
  return newContext;
}

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
      switch(context.intent) {
      case 'balance':
        context = _.merge(context, extractEntities(entities, ['account_type']));
        break;
      case 'savings':
        context = _.merge(context, extractEntities(entities,
                                                  ['timespan',
                                                   'expense_category',
                                                   'number']));
      }
    }
    cb(context);
  },
  error (sessionId, context, error) {
    console.log(error.message);
  },
  getAccountBalance (sessionId, context, cb) {
    let session = _.find(userToSession, { sessionId });
    console.log('fetching balance for userId:', session.userId, ' - resetting context');
    session.context = {};
    session.isFinished = true;

    switch(context.account) {
    case 'credit card':
      return arion.getCreditcard(session.user.arion_token).then(cc => {
        let res = _.merge(context, { balance: cc.balance });
        cb(res);
      });
    case 'debit card':
      return arion.getAccount(session.user.arion_token).then(account => {
        let res = _.merge(context, { balance: account.balance });
        cb(res);
      });
    default:
      console.log(context);
    }
  },
  setSpendingLimit (sessionId, context, cb) {
    console.log('setting spending limit');
    console.log(context);
    let session = _.find(userToSession, { sessionId });
    _spendingLimit(session, context);
    cb(context);
  }
};

function _spendingLimit (session, context) {
  meniga.getSpend(context.expense_category, context.timespan)
  .then((transactions) => {
    let spendInPeriod = _.reduce(transactions, (acc, t) => {
      return acc + parseInt(t.amount, 10);
    }, 0);
    console.log('Period spend:', spendInPeriod);
    let delta = context.number - spendInPeriod;
    // Magic threshold constant
    if (delta < 0) {
      facebook.sendMessage(session.user.id,
                          `Oh no! You're over the limit for expenses on` +
`${context.expense_category}. You've spent ${spendInPeriod} kr. so far.`);
    } else if (delta < 1500) {
      facebook.sendMessage(session.user.id,
                          `Be careful! You're expenses for the period are` +
`getting close to the limit you've set. You have spent ${spendInPeriod} kr. so far.`);
    } else {
      // Call self repeatedly each minute
      setTimeout(() => {
        _spendingLimit(session, context);
      }, 60*1000);
    }
  });
}

const logger = new WitLogger(LOG_LEVELS.WARN);
const client = Bluebird.promisifyAll(new Wit(token, actions, logger));

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
      userId: user.id,
      user: user
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

// Exports

module.exports = {
  processMessage
};
