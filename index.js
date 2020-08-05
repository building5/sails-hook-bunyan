// Copyright (c) 2015. David M. Lee, II
'use strict';

var bunyan = require('bunyan');

/**
 * Mapping of Sails log levels to Bunyan.
 */
var logLevels = {
  silly: null, // no place for silly around here
  verbose: 'trace',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  crit: 'fatal',
  log: 'debug', // default log is at the debug level
};
module.exports.logLevels = logLevels;

/**
 * Sails.js hook function.
 */
module.exports = function (sails) {
  var injectRequestLogger;
  var _this;

  return {
    defaults: function () {
      var _this = this;
      var fileStream;
      var bunyanConfigObject = {};
      var oldConfig = sails.config.log;
      var bunyanConfig = {
        /** If true, a child logger is injected on each request */
        injectRequestLogger: true,

        /** If true, log uncaughtExceptions and terminate the process */
        logUncaughtException: false,

        /** If given, signal to listen on for file rotation */
        rotationSignal: null,

        /** Extension point for returning custom loggers */
        getLogger: function () {
          return _this.logger;
        },

        /** Default configuration for bunyan logger */
        logger: {
          // I would put a default config here; but Sails doesn't merge
          // these config objects
        },
      };
      bunyanConfigObject[this.configKey] = bunyanConfig;

      if (oldConfig.bunyan) {
        bunyanConfig.logger = oldConfig.bunyan;
      }

      if (oldConfig.level !== 'info' && logLevels[oldConfig.level]) {
        bunyanConfig.logger.level = logLevels[oldConfig.level];
      }

      if (oldConfig.filePath) {
        bunyanConfig.logger.streams = bunyanConfig.logger.streams || [];
        fileStream = {
          path: oldConfig.filePath,
        };

        if (bunyanConfig.logger.level) {
          fileStream.level = bunyanConfig.logger.level;
        }

        bunyanConfig.logger.streams.push(fileStream);
      }

      if (Object.hasOwnProperty.call(oldConfig, 'logUncaughtException')) {
        bunyanConfig.logUncaughtException = oldConfig.logUncaughtException;
      }

      if (oldConfig.rotationSignal) {
        bunyanConfig.rotationSignal = oldConfig.rotationSignal;
      }

      var oldInjectRequestLogger = oldConfig.injectRequestLogger;
      if (oldInjectRequestLogger || oldInjectRequestLogger === false) {
        bunyanConfig.injectRequestLogger = oldConfig.injectRequestLogger;
      }

      return bunyanConfigObject;
    },

    /**
     * Hook configuration function.
     */
    configure: function () {
      var bunyanConfigObject = sails.config[this.configKey];

      // the ship drawing looks pretty silly in JSON
      sails.config.log.noShip = true;

      // as do color codes
      sails.config.log.colors = false;

      // setup some defaults
      bunyanConfigObject.logger.name = bunyanConfigObject.logger.name || 'sails';
      bunyanConfigObject.logger.serializers =
          bunyanConfigObject.logger.serializers || bunyan.stdSerializers;

      this.reqSerializer = bunyanConfigObject.logger.serializers.req ||
          function (x) { return x; };

      this.logger = bunyan.createLogger(bunyanConfigObject.logger);
    },

    /**
     * Hook initialization function.
     */
    initialize: function (done) {
      var bunyanConfigObject = sails.config[this.configKey];

      _this = this;

      // If a rotationSignal is given, listen for it
      if (bunyanConfigObject.rotationSignal) {
        process.on(bunyanConfigObject.rotationSignal, function () {
          _this.logger.reopenFileStreams();
        });
      }

      // If logUncaughtException is set, log those, too
      if (bunyanConfigObject.logUncaughtException) {
        process.on('uncaughtException', function (err) {
          _this.logger.fatal({ err: err }, 'Uncaught exception');
          process.exit(1);
        });
      }

      // save off injectRequestLogger for middleware route
      injectRequestLogger = sails.config[this.configKey].injectRequestLogger;

      // Inject log methods
      var log = sails.log = this.logger.debug.bind(this.logger);

      Object.keys(logLevels).forEach(function (sailsLevel) {
        var bunyanLevel = logLevels[sailsLevel];
        if (bunyanLevel) {
          log[sailsLevel] = function () {
            var logger = bunyanConfigObject.getLogger();
            logger[bunyanLevel].apply(logger, arguments);
          };
        } else {
          // no-op
          log[sailsLevel] = function () {};
        }
      });

      done();
    },

    /**
     * Global route to inject a logger on each request.
     */
    routes: {
      before: {
        '/*': function (req, res, next) {
          if (injectRequestLogger) {
            req = _this.reqSerializer(req);
            req.log = _this.logger.child({ req: req }, true);
          }

          next();
        },
      },
    },
  };
};
