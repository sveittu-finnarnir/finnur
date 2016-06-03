'use strict';
const Bluebird = require('bluebird');
const request = Bluebird.promisifyAll(require('request'));

const PAGE_TOKEN = process.env['PAGE_TOKEN'];


function sendMessage(sender, text) {
  let messageData = { text };
  return request.postAsync({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_TOKEN },
    json: {
      recipient: { id: sender },
      message: messageData,
    }
  }).then(function (response) {
    if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  }).catch(function (err) {
    console.error(err);
  });
}

function getUserDetails (userId) {
  return request.getAsync(`https://graph.facebook.com/v2.6/` +
    `${userId}?fields=first_name,last_name,gender&access_token=${PAGE_TOKEN}`)
  .then((res) => {
    if (res.statusCode !== 200) {
      throw new Error('Non-200 response from facebook');
    }
    return JSON.parse(res.body);
  });
}

module.exports = {
  sendMessage,
  getUserDetails,
};
