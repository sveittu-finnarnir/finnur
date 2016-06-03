'use strict';
const Bluebird = require('bluebird');
const AUTHY_KEY = process.env['AUTHY_KEY'];

const authy = Bluebird.promisifyAll(require('authy')(AUTHY_KEY));

const sendToken = authy.request_smsAsync;
const verifyToken = authy.verifyAsync;

function startState (input, user) {
  return sendToken('23734474').then(() => {
    return [
      expectTokenState,
      `To continue, I'm going to have to verify that you are.
       Please type in the token I just sent you!`
    ];
  });
}

function expectTokenState (input) {
  return verifyToken('23734474', input)
  .then((res) => {
    console.log(res);
    return [
      expectTokenState,
      `Great, thanks for authenticating! :D`
    ];

  }).catch((err) => {
    console.log(err);
    return [
      expectTokenState,
      `That's not the same token that I sent you!
       Please try that one more time.`
    ];
  });
}

module.exports = {
  authy,
  sendToken,
  verifyToken,
  startState
};
