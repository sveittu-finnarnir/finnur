'use strict';
const Bluebird = require('bluebird');
const AUTHY_KEY = process.env['AUTHY_KEY'];

const authy = Bluebird.promisifyAll(require('authy')(AUTHY_KEY));

const sendToken = authy.request_smsAsync;
const verifyToken = authy.verifyAsync;

let returnState;

function start(returnTo) {
  returnState = returnTo;
  console.log('starting auth flow.');
  return sendToken('23734474').then(() => {
    return expectTokenState;
  }).catch(console.error);
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
  start
};
