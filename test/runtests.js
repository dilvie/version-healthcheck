'use strict';
var test = require('tape'),
  request = require('supertest'),
  express = require('express'),
  configure = require('qconf'),
  version = require('../version.js'),

  config = configure(),
  port = config.get('version_test_port') || 5555,
  customPort = port + 1,
  callbackPort = customPort + 1,

  newApp = function (version, p) {
    var app = express();

    p = p || port;
    app.get('/version', version);
    return app.listen(p);
  },
  defaultServer = newApp(version),

  customServer = newApp(version.configure({
    buildPath: './test/BUILD'
  }), customPort),

  withCallback = newApp(version.configure({
    callback: function () {
      this.cb = true;
    },
    buildPath: './test/BUILD'
  }), callbackPort);


test('Default settings', function (t) {
  request('http://localhost:' + port)
    .get('/version')
    .set('Accept', 'application/json')
    .end(function (err, res) {
      var body = JSON.parse(res.text);

      t.error(err, 
        'should not throw error');

      t.equal(body.name, 'version-healthcheck',
        'Data should be returned from package.json.');

      t.equal(body.build, '1234',
        'Should read build # from ./config/BUILD');

      t.ok(res.status === 200,
        'should return 200 OK');

      t.end();
    });
});

test('Custom version', function (t) {
  request('http://localhost:' + customPort)
    .get('/version')
    .set('Accept', 'application/json')
    .end(function (err, res) {
      var body = JSON.parse(res.text);

      t.error(err, 
        'should not throw error');

      t.equal(body.name, 'version-healthcheck',
        'Data should be returned from package.json.');

      t.equal(body.build, '3456',
        'Should read build # from ./config/BUILD');

      t.ok(res.status === 200,
        'should return 200 OK');

      t.end();
    });
});

test('Custom version with callback', function (t) {
  request('http://localhost:' + callbackPort)
    .get('/version')
    .set('Accept', 'application/json')
    .end(function (err, res) {
      var body = JSON.parse(res.text);

      t.error(err, 
        'should not throw error');

      t.equal(body.name, 'version-healthcheck',
        'Data should be returned from package.json.');

      t.equal(body.build, '3456',
        'Should read build # from ./config/BUILD');

      t.equal(body.cb, true,
        'Should allow custom members using "this" in callback.');

      t.ok(res.status === 200,
        'should return 200 OK');

      t.end();
    });
});

test('Finished', function (t) {
  defaultServer.close();
  customServer.close();
  withCallback.close();
  t.end();
});
