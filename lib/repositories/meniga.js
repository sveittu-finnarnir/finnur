'use strict';

const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));

const BASE_URL = 'http://services.fintechparty.meniga.com/v1/';

function getSpend(category, timeSpan) {
  request.get({
    url: `${BASE_URL}/`
  })
}

module.exports = {
  sync
}
