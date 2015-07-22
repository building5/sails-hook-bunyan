// Copyright (c) 2015. David M. Lee, II
'use strict';

var Sails = require('sails').Sails;
var chai = require('chai');
var expect = chai.expect;
var bunyan = require('bunyan');

chai.use(require('dirty-chai'));
chai.use(require('sinon-chai'));

describe('sails-hook-bunyan', function() {
  var fakeLogger;
  var sails;
  var sinon;

  function liftSails(sailsConfig, done) {
    sailsConfig.hooks = {
      grunt: false,
      bunyan: require('../')
    };

    new Sails().load(sailsConfig, function(err, s) {
      expect(err).to.not.exist();
      expect(s).to.exist();
      sails = s;
      setImmediate(done);
    });
  }

  function buildFakeLogger() {
    return {
      reopenFileStreams: sinon.stub(),
      child: sinon.stub(),

      trace: sinon.stub(),
      debug: sinon.stub(),
      info: sinon.stub(),
      warn: sinon.stub(),
      error: sinon.stub(),
      fatal: sinon.stub()
    };
  }

  before(function() {
    // Lifting sails listens to a bunch of stuff
    process.setMaxListeners(0);
  });

  beforeEach(function() {
    sinon = require('sinon').sandbox.create();
  });

  beforeEach(function() {
    fakeLogger = buildFakeLogger();
  });

  beforeEach(function() {
    sinon.stub(bunyan, 'createLogger')
      .returns(fakeLogger);
  });

  afterEach(function() {
    sinon.restore();
    sinon = null;
  });

  afterEach(function(done) {
    if (sails) {
      return sails.lower(done);
    }

    done();
  });

  describe('for any config', function() {
    beforeEach(function(done) {
      liftSails({}, done);
    });

    it('should build a logger', function() {
      expect(bunyan.createLogger).to.be.called();
    });

    it('should disable ship ascii art', function() {
      expect(sails.config.log).to.have.property('noShip', true);
    });

    it('should disable log colors', function() {
      expect(sails.config.log).to.have.property('colors', false);
    });

    it('should expose the root bunyan logger', function() {
      expect(sails.hooks.bunyan).to.have.property('logger');
    });

    it('should log sails.log.crit as fatal', function() {
      sails.log.crit('some message');
      expect(fakeLogger.fatal)
        .to.have.been.called();
      expect(fakeLogger.fatal.firstCall)
        .to.have.been.calledWithExactly('some message');
    });

    it('should log default as debug', function() {
      sails.log('some other message');
      expect(fakeLogger.debug)
        .to.have.been.called();
      expect(fakeLogger.debug.firstCall)
        .to.have.been.calledWithExactly('some other message');
    });
  });

  describe('with routes configured', function() {
    var controller;

    beforeEach(function(done) {
      controller = sinon.spy(function(req, res) {
        expect(req).to.have.property('log');
        res.send(200, 'okay');
      });

      liftSails({
        routes: {
          '/test': controller
        }
      }, done);
    });

    it('should inject a request logger', function(done) {
      sails.request({
        method: 'get',
        url: '/test'
      }, function(err, clientRes) {
        expect(err).to.not.exist();
        expect(fakeLogger.child).to.be.called();
        expect(controller).to.be.called();
        expect(clientRes).to.have.property('statusCode', 200);
        return done();
      });
    });
  });

  describe('with request logger disabled', function() {
    var controller;

    beforeEach(function(done) {
      controller = sinon.spy(function(req, res) {
        expect(req).to.not.have.property('log');
        res.send(200, 'okay');
      });

      liftSails({
        bunyan: {
          injectRequestLogger: false
        },
        routes: {
          '/test': controller
        }
      }, done);
    });

    it('should not inject a request logger', function(done) {
      sails.request({
        method: 'get',
        url: '/test'
      }, function(err, clientRes) {
        expect(err).to.not.exist();
        expect(fakeLogger.child).to.not.be.called();
        expect(controller).to.be.called();
        expect(clientRes).to.have.property('statusCode', 200);
        return done();
      });
    });
  });

  describe('with no config', function() {
    beforeEach(function(done) {
      liftSails({}, done);
    });

    it('should build with default config', function() {
      expect(bunyan.createLogger).to.be.called();
      expect(bunyan.createLogger.firstCall).to.be.calledWithExactly({
        name: 'sails',
        serializers: bunyan.stdSerializers
      });
    });
  });

  describe('with a configured name', function() {
    beforeEach(function(done) {
      liftSails({
        bunyan: {
          logger: {
            name: 'foo'
          }
        }
      }, done);
    });

    it('should build with default config, and the given name', function() {
      expect(bunyan.createLogger).to.be.called();
      expect(bunyan.createLogger.firstCall).to.be.calledWithExactly({
        name: 'foo',
        serializers: bunyan.stdSerializers
      });
    });
  });

  describe('with a configured level', function() {
    beforeEach(function(done) {
      liftSails({
        bunyan: {
          logger: {
            level: 'error'
          }
        }
      }, done);
    });

    it('should build with default config, and the given name', function() {
      expect(bunyan.createLogger).to.be.called();
      expect(bunyan.createLogger.firstCall).to.be.calledWithExactly({
        name: 'sails',
        level: 'error',
        serializers: bunyan.stdSerializers
      });
    });
  });

  describe('with a configured serializers', function() {
    beforeEach(function(done) {
      liftSails({
        bunyan: {
          logger: {
            serializers: {foo: null}
          }
        }
      }, done);
    });

    it('should build with default config, and the given name', function() {
      expect(bunyan.createLogger).to.be.called();
      expect(bunyan.createLogger.firstCall).to.be.calledWithExactly({
        name: 'sails',
        serializers: {foo: null}
      });
    });
  });

  describe('with a configured stream', function() {
    beforeEach(function(done) {
      liftSails({
        bunyan: {
          logger: {
            streams: [{path: 'foo'}]
          }
        }
      }, done);
    });

    it('should build with default config, and the given stream', function() {
      expect(bunyan.createLogger).to.be.called();
      expect(bunyan.createLogger.firstCall).to.be.calledWithExactly({
        name: 'sails',
        serializers: bunyan.stdSerializers,
        streams: [{path: 'foo'}]
      });
    });
  });

  describe('with rotationSignal configured', function() {
    beforeEach(function(done) {
      liftSails({
        bunyan: {
          rotationSignal: 'SIGHUP'
        }
      }, done);
    });

    it('should reopen streams when signaled', function(done) {
      expect(fakeLogger.reopenFileStreams).to.not.be.called();
      process.kill(process.pid, 'SIGHUP');
      function waitForReopenFileStreamsToBeCalled() {
        if (!fakeLogger.reopenFileStreams.called) {
          return setImmediate(waitForReopenFileStreamsToBeCalled);
        }

        done();
      }

      waitForReopenFileStreamsToBeCalled();
    });
  });

  describe('with logUncaughtException configured', function() {
    var mochaUncaughtHandler;

    beforeEach(function(done) {
      mochaUncaughtHandler = process.listeners('uncaughtException').pop();
      liftSails({
        bunyan: {
          logUncaughtException: true
        }
      }, done);

      sinon.stub(process, 'exit')
        .withArgs(1);

    });

    it('should log uncaught exceptions and exit', function(done) {
      expect(sails.hooks.bunyan.logger.fatal).to.not.be.called();
      expect(process.exit).to.not.be.called();

      // Remove the mocha handler, since it would fail the test
      process.removeListener('uncaughtException', mochaUncaughtHandler);
      process.emit('uncaughtException', new Error('not an error'));
      setImmediate(function() {
        // put the mocha handler back, so it can fail the test
        process.on('uncaughtException', mochaUncaughtHandler);

        expect(sails.hooks.bunyan.logger.fatal).to.be.called();
        expect(process.exit).to.be.called();
        done();
      });
    });
  });

  describe('with custom getLogger', function() {
    var customFakeLogger;
    beforeEach(function(done) {
      customFakeLogger = buildFakeLogger();
      liftSails({
        bunyan: {
          getLogger: function() {
            return customFakeLogger;
          }
        }
      }, done);
    });

    it('should use the custom logger', function() {
      sails.log.debug('some message');
      expect(customFakeLogger.debug)
        .to.have.been.called();
      expect(customFakeLogger.debug.firstCall)
        .to.have.been.calledWithExactly('some message');
    });

  });

  describe('with old sails.log config', function() {
    describe('configuring level', function() {
      beforeEach(function(done) {
        liftSails({
          log: {
            level: 'error'
          }
        }, done);
      });

      it('should be used for sails.bunyan.logger.level', function() {
        expect(sails.config.bunyan.logger).to.have.property('level', 'error');
      });
    });

    describe('configuring filePath', function() {
      beforeEach(function(done) {
        liftSails({
          log: {
            filePath: 'some.log'
          }
        }, done);
      });

      it('should add a stream to sails.bunyan.logger.streams', function() {
        expect(sails.config.bunyan.logger).to.have.property('streams')
          .that.deep.equals([{path: 'some.log'}]);
      });
    });

    describe('configuring filePath and level', function() {
      beforeEach(function(done) {
        liftSails({
          log: {
            level: 'error',
            filePath: 'some.log'
          }
        }, done);
      });

      it('should add a stream to sails.bunyan.logger.streams', function() {
        expect(sails.config.bunyan.logger).to.have.property('streams')
          .that.deep.equals([{path: 'some.log', level: 'error'}]);
      });
    });

    describe('configuring logUncaughtException', function() {
      beforeEach(function(done) {
        liftSails({
          log: {
            logUncaughtException: true
          }
        }, done);
      });

      it('should set that on sails.bunyan.logUncaughtException', function() {
        expect(sails.config.bunyan).to.have
          .property('logUncaughtException', true);
      });
    });

    describe('configuring rotationSignal', function() {
      beforeEach(function(done) {
        liftSails({
          log: {
            rotationSignal: 'SIGHUP'
          }
        }, done);
      });

      it('should set that on sails.bunyan.rotationSignal', function() {
        expect(sails.config.bunyan).to.have
          .property('rotationSignal', 'SIGHUP');
      });
    });

    describe('configuring bunyan', function() {
      beforeEach(function(done) {
        liftSails({
          log: {
            bunyan: {
              name: 'some-name',
              serializers: {foo: null}
            }
          }
        }, done);
      });

      it('should set that on sails.bunyan.logger', function() {
        expect(sails.config.bunyan).to.have.property('logger')
          .that.deep.equals({
            name: 'some-name',
            serializers: {foo: null}
          });
      });
    });
  });
});
