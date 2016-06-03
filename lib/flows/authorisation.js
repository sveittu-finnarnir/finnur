'use strict';
const Bluebird = require('bluebird');
const AUTHY_KEY = process.env['AUTHY_KEY'];

const authy = require('authy')(AUTHY_KEY);

function promisify (fun) {
  return function () {
    let args = Array.prototype.slice.call(arguments);
    return new Bluebird(function (resolve, reject) {
      args.push(function (err, res) {
        if (err) {
          let e = new Error('error when authorising');
          e.message = err.message;
          e.code = err.error_code;
          reject(e);
        } else {
          resolve(res);
        }
      });
      fun.apply(authy, args);
    });
  };
}

const sendToken = promisify(authy.request_sms);
const verifyToken = promisify(authy.verify);

let returnState;

function start(returnTo, user) {
  returnState = returnTo;
  console.log('starting auth flow.');
  return sendToken(user.authy_id).then(() => {
    return expectTokenState;
  }).catch(console.error);
}

function expectTokenState (input, user) {
  return verifyToken(user.authy_id, input)
  .then((res) => {
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
  start
};
