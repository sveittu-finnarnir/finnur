'use strict';

const _ = require('lodash');
const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));

const BASE_URL = 'https://api.test.rb.is/v1/';

function createClaim(token, phoneNumber) {
  return request.getAsync({
    url: `${BASE_URL}/accounts/identifier?identifierId=${phoneNumber}`,
    json: true,
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => {
    if (res.statusCode === 404) {
      return null;
    }
    return res.body;
  });
}

module.exports = {
  createClaim
};
