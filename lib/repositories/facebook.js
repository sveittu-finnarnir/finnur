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
    let fbUser = JSON.parse(res.body);
    return {
      firstName: fbUser.first_name,
      lastName: fbUser.last_name,
      gender: fbUser.gender
    };
  });
}

module.exports = {
  sendMessage,
  getUserDetails,
};
