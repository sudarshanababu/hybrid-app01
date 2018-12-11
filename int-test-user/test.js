'use strict';

const AWS = require('aws-sdk');
AWS.config.update({
  region: process.env.AWS_REGION
});

const codepipeline = new AWS.CodePipeline();
const hippie = require('hippie');

exports.lambda_handler = (event, context, callback) => {
  var api = event.api_url + '/users/';
  var user = build_user();

  Promise.resolve()
    .then(result => {
      return list_users(api, user);
    })
    .then(result => {
      return update_user(api, user);
    })
    .then(result => {
      return view_user_found(api, user);
    })
    .then(result => {
      return view_user_not_found(api, user);
    })
    .then(result => {
      return remove_user(api, unicorn);
    })
    .then(result => {
      console.log('SUCCESS');
      complete_job(event.job_id, result, callback);
    })
    .catch(reason => {
      console.log('ERROR: ' + reason.test_name + ' | ' + reason.message);
      fail_job(event.job_id, reason, context.invokeid, callback);
    });
};

var list_users = function(api, user) {
  return hippie().get(api).expectStatus(200).end()
    .catch(reason => {
      reason.test_name = 'list_users';
      throw reason;
    });
};

var update_user = function(api, user) {
  return hippie().put(api + user.name).send(user).json().expectStatus(200).end()
    .catch(reason => {
      reason.test_name = 'update_user';
      throw reason;
    });
};

var view_user_found = function(api, user) {
  return hippie().get(api + user.name).expectStatus(200).end()
    .catch(reason => {
      reason.test_name = 'view_user_found';
      throw reason;
    });
};

var view_user_not_found = function(api, user) {
  return hippie().get(api + user.name + random_string()).expectStatus(404).end()
    .catch(reason => {
      reason.test_name = 'view_user_not_found';
      throw reason;
    });
};

var remove_user = function(api, user) {
  return hippie().del(api + unicorn.name).expectStatus(200).end()
    .catch(reason => {
      reason.test_name = 'remove_user';
      throw reason;
    });
};

var fail_job = function(job_id, reason, invokeid, callback) {
  var message = "Test: " + reason.test_name + " | Actual: " + reason.actual + " | Expected: " + reason.expected;
  var params = {
    jobId: job_id,
    failureDetails: {
      message: message,
      type: 'JobFailed',
      externalExecutionId: invokeid
    }
  };
  console.log("fail_job: ", JSON.stringify(params));
  codepipeline.putJobFailureResult(params, function(err, data) {
    callback(null, message);
  });
};

var complete_job = function(job_id, message, callback) {
  var params = {
    jobId: job_id
  };
  console.log("complete_job: ", JSON.stringify(params));
  codepipeline.putJobSuccessResult(params, function(err, data) {
    if (err) {
      callback(err);
    } else {
      callback(null, message);
    }
  });
};

var random_string = function() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

var build_user = function() {
  return {
    name: random_string(),
    email: random_string(),
    description: random_string()
  };
};
