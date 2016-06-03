'use strict';
const Bluebird = require('bluebird');
const AUTHY_KEY = process.env['AUTHY_KEY'];

const authy = Bluebird.promisifyAll(require('authy')(AUTHY_KEY));

const sendToken = authy.request_smsAsync;
const verifyToken = authy.verifyAsync;

module.exports = {
  authy,
  sendToken,
  verifyToken
};
