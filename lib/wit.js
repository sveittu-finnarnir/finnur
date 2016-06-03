'use strict';

const util = require('util');
const token = 'CTJBQZWKT2PEZP6AONGLEFEIUWD5TALB';
const Wit = require('node-wit').Wit;
const Bluebird = require('bluebird');
const _ = require('lodash');

const actions = {
  say (sessionId, context, message, cb) {
    console.log('saying:', message);
    cb();
  },
  merge (sessionId, context, entities, message, cb) {
    console.log('entities:', entities);
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

    cb({
      balance: 500
    });
  }
};
const client = Bluebird.promisifyAll(new Wit(token, actions));

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

/*
let sessionId = 'banani';
converse(sessionId, 'What is my account balance?', {userId: 'krummi'})
.then(newContext => {
  return converse(sessionId, 'on the credit card', newContext);
});
*/

// Exports

module.exports.parse = parse;
module.exports.converse = converse;
