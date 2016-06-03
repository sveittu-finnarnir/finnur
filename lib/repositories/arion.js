'use strict';

const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));

const AUTH_TOKEN = process.env['ARION_TOKEN'];
const BASE_URL = 'https://arionapi-sandbox.azure-api.net';
const SUBSCRIPTION_KEY = process.env['ARION_SUBSCRIPTION_KEY'];

function getAccounts (accountId) {
  let options = {
    url: `${BASE_URL}/accounts/v1/accounts`,
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
    },
    json: true
  };
  return request.getAsync(options)
  .then((res) => {
    return res.body.account;
  });
}

function getCreditcard () {
  let options = {
    url: `${BASE_URL}/creditcards/v1/creditCards`,
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
    json: true
  };
  return request.getAsync(options)
  .then((res) => {
    return res.body.creditCard;
  });
}

module.exports = {
  getAccounts,
  getCreditcard
};
