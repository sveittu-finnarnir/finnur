'use strict';

const TOKEN = 'CTJBQZWKT2PEZP6AONGLEFEIUWD5TALB';
const Bluebird = require('bluebird');
const _ = require('lodash');
const uuid = require('node-uuid');
const request = Bluebird.promisifyAll(require('request'));
const co = require('co');
const util = require('util');

const arion = require('./arion');
const meniga = require('./meniga');
const facebook = require('./facebook');
const rb = require('./rb');

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

function setSpendingLimit (sessionId, context) {
  console.log('setting spending limit');
  console.log(context);
  let session = _.find(userToSession, { sessionId });
  _spendingLimit(session, context);
  return context;
}

function _spendingLimit (session, context) {
  meniga.getSpend(session.user, context.expense_category, context.timespan)
  .then((transactions) => {
    let spendInPeriod = _.reduce(transactions, (acc, t) => {
      return acc + parseInt(t.amount, 10);
    }, 0);
    console.log('Period spend:', spendInPeriod);
    console.log('Context:', context);
    let delta = context.number - spendInPeriod;
    // Magic threshold constant
    if (delta < 0) {
      facebook.sendMessage(session.user.id,
                          `Oh no! You're over the limit for expenses` +
                           (context.expense_category ? ` on ${context.expense_category}` : '') +
                           `. You've spent ${spendInPeriod} kr. so far.`);
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

function* processMessageNew(input, user) {
  // Create a session for the user if it doesn't exist
  let session = userToSession[user.id];
  if (!session || session.shouldResetSession) {
    console.log('resetting the session!');
    session = userToSession[user.id] = {
      sessionId: uuid.v4(),
      context: {},
      userId: user.id,
      user: user
    };
  }
  let sessionId = session.sessionId;
  let context = session.context;

  // Merge, execute and things until done
  let args = { q: input };
  let shouldSay = null;
  while (true) {
    console.log('request, args:', args, 'context:', context);
    let body = yield post(sessionId, args);
    console.log('response:', util.inspect(body, { depth: null }));
    let entities = body.entities;

    if (body.type === 'merge') {

      // Break early if we have no idea what's going on
      if (!_.has(context, 'intent') && !_.has(entities, 'intent')) {
        console.log('no ongoing intent and no new recognized!!!');
        session.shouldResetSession = true;
        return "Sorry, I have no idea what you are saying!";
      }

      // Merge
      if (_.has(entities, 'intent')) {
        context.intent = entities.intent[0].value;
        if (context.intent === 'gratitude') {
          session.overwriteWhatToSay = 'You\'re welcome, puny human.';
        }
      }

      switch(context.intent) {
      case 'balance':
        context = _.merge(context, extractEntities(entities, ['account_type']));
        break;
      case 'savings':
        context = _.merge(context, extractEntities(entities,
                                                  ['timespan',
                                                   'expense_category',
                                                   'number']));
        break;
      case 'claim':
        context = _.merge(context, extractEntities(entities, ['contact', 'number', 'phone_number']));
        break;
      }

    } else if (body.type === 'action') {
      session.shouldResetSession = true;
      if (body.action === 'getAccountBalance') {
        let res = yield getAccountBalance(sessionId, context);
        context = _.merge(context, res);
      } else if (body.action === 'setSpendingLimit') {
        context = setSpendingLimit(sessionId, context);
      } else if (body.action === 'sendClaim') {
        console.log(`sending a claim to ${context.phone_number} for ${context.number} kr.`);
        let claim = yield sendClaim(sessionId, context);
        if (!claim) {
          session.overwriteWhatToSay = 'Sorry but it looks like there is no user associated with this phone number :(';
          console.log('overwriting what to say:', session.overwriteWhatToSay);
        }
      }
    } else if (body.type === 'msg') {
      shouldSay = body.msg;
    } else if (body.type === 'stop') {
      if (session.overwriteWhatToSay) {
        let msg = session.overwriteWhatToSay;
        delete session.overwriteWhatToSay;
        return msg;
      }
      return shouldSay;
    }

    args = { context: context };
  }
}

function sendClaim(sessionId, context) {
  let session = _.find(userToSession, { sessionId });

  console.log('rb token:', session.user.rb_token, 'phone:', context.phone_number);

  return rb.createClaim(session.user.rb_token, context.phone_number);
}

function post(sessionId, args) {
  let options = {
    url: `https://api.wit.ai/converse`,
    json: true,
    headers: {
      Authorization: `Bearer ${TOKEN}`
    },
    qs: {
      v: '20160526',
      session_id: sessionId
    }
  };
  if (args.q) {
    options.qs.q = args.q;
  }
  if (args.context) {
    options.body = args.context;
  }
  return request.postAsync(options)
  .then(res => {
    if (res.statusCode !== 200) {
      throw new Error('non-200 response from wit.ai');
    }
    return res.body;
  });
}

function getAccountBalance (sessionId, context) {
  let session = _.find(userToSession, { sessionId });
  console.log('fetching balance for userId:', session.userId, ' - resetting context');
  session.context = {};
  session.isFinished = true;

  switch(context.account_type) {
  case 'credit card':
    return arion.getCreditcard(session.user.arion_token)
    .then(cc => {
      return _.merge(context, { balance: cc.balance });
    });
  case 'debit card':
    return arion.getAccount(session.user.arion_token)
    .then(account => {
      return _.merge(context, { balance: account.balance });
    });
  default:
    return context;
  }
}

// Exports

module.exports = {
  processMessage,
  processMessageNew
};
