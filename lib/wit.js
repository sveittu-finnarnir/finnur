'use strict';

const util = require('util');
const token = 'CTJBQZWKT2PEZP6AONGLEFEIUWD5TALB';
const Wit = require('node-wit').Wit;

const actions = {
  say (sessionId, context, message, cb) {
    console.log(message);
    cb();
  },
  merge (sessionId, context, entities, message, cb) {
    cb(context);
  },
  error (sessionId, context, error) {
    console.log(error.message);
  }
};
const client = new Wit(token, actions);

let message = "What's the balance on my debit card?";

function parse(message) {
  const context = {};
  return client.message(message, context, (error, data) => {
    if (error) {
      console.log('Oops! Got an error: ' + error);
    } else {
      console.log('wit.ai response:', util.inspect(data, { depth: null }));
    }
  });
}

module.exports.parse = parse;
