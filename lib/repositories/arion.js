'use strict';

const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));

const BASE_URL = 'https://arionapi-sandbox.azure-api.net';
const SUBSCRIPTION_KEY = process.env['ARION_SUBSCRIPTION_KEY'];

function getAccount (token) {
  let options = {
    url: `${BASE_URL}/accounts/v1/accounts`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY
    },
    json: true
  };
  return request.getAsync(options)
  .then((res) => {
    return _.first(res.body.account);
  });
}

function getCreditcard (token {
  let options = {
    url: `${BASE_URL}/creditcards/v1/creditCards`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
    json: true
  };
  return request.getAsync(options)
  .then((res) => {
    return _.first(res.body.creditCard);
  });
}

module.exports = {
  getAccounts,
  getCreditcard
};
