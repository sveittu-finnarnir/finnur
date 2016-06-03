'use strict';
const Bluebird = require('bluebird');
const AUTHY_KEY = process.env['AUTHY_KEY'];

const authy = require('authy')(AUTHY_KEY);

function promisify (fun) {
  return function () {
    let args = Array.prototype.slice.call(arguments);
    return new Bluebird(function (resolve, reject) {
      args.push(function (err, res) {
        console.log(res);
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
      console.log(args);
      fun.apply(authy, args);
    });
  };
}

const sendToken = promisify(authy.request_sms);
const verifyToken = promisify(authy.verify);

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
      returnState,
      `Great, thanks for authenticating! :D`
    ];

  }).catch((err) => {
    console.log(err);
    return [
      expectTokenState,
      `That's not the same token that I sent you!\n
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
