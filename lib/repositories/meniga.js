'use strict';

const _ = require('lodash');
const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));
const moment = require('moment');

const BASE_URL = 'http://services.fintechparty.meniga.com/v1/';
const API_KEY = process.env.MENIGA_API_KEY;

const categoryMap = {
  food: 116,
  alcohol: 81
};

function translateTimespan (span) {
  let period;
  if (span.match(/month/)) {
    period = 'month';
  } else if (span.match(/week/)) {
    period = 'week';
  } else if (span.match(/day/)) {
    period = 'day';
  }
  if (!period) {
    return null;
  }
  return {
    start: moment().startOf(period).format(),
    end: moment().endOf(period).format()
  };
}

function getSpend(category, timespan) {
  let url = BASE_URL + 'transactions';
  let params = [];
  if (category && categoryMap[category]) {
    params.push(`categoryIds=${categoryMap[category]}`);
  }
  if (timespan) {
    let translatedSpan = translateTimespan(timespan);
    if (translatedSpan) {
      params.push(`periodFrom=${encodeURIComponent(translatedSpan.start)}`);
      params.push(`periodTo=${encodeURIComponent(translatedSpan.end)}`);
    }
  }
  if (!_.isEmpty(params)) {
    url += '?' + params.join('&');
  }
  return request.getAsync({
    url: url,
    json: true,
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  }).then(res => {
    if (res.statusCode !== 200) {
      _.forEach(res.body.errors, console.error);
      throw new Error('MenigaError');
    }
    return res.body.data;
  });
}

module.exports = {
  getSpend
};
