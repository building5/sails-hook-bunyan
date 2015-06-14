// Copyright (c) 2015. David M. Lee, II
'use strict';

var bunyan = require('bunyan');
var uuid = require('uuid');

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
  log: 'debug' // default log is at the debug level
};
module.exports.logLevels = logLevels;

/**
 * Sails.js hook function.
 */
module.exports = function(sails) {
  var injectRequestLogger;
  var requestIdProperty;
  var requestIdProvider;
  var _this;

  return {
    defaults: function() {
      var _this = this;
      var fileStream;
      var config = {};
      var oldConfig = sails.config.log;
      var bunyanConfig = {
        /** If true, a child logger is injected on each request */
        injectRequestLogger: true,

        /** Name of the request id property assigned to the request logger */
        requestIdProperty: 'req_id',

        /**
         * Extension point for returning custom request ids
         *
         * Gets or generates a unique id for the request, and attaches it
         * to the request logger's options. If no id is returned, then the
         * request logger is unmodified.
         *
         * The default provider returns a new UUID v4 and attaches
         * it to req.id
         *
         * Note: Only called if injectRequestLogger is true.
         */
        requestIdProvider: function(req) {
          if (!req.id) {
            req.id = uuid.v4();
          }

          return req.id;
        },

        /** If true, log uncaughtExceptions and terminate the process */
        logUncaughtException: false,

        /** If given, signal to listen on for file rotation */
        rotationSignal: null,

        /** Extension point for returning custom loggers */
        getLogger: function() {
          return _this.logger;
        },

        /** Default configuration for bunyan logger */
        logger: {
          // I would put a default config here; but Sails doesn't merge
          // these config objects
        }
      };
      config[this.configKey] = bunyanConfig;

      if (oldConfig.bunyan) {
        bunyanConfig.logger = oldConfig.bunyan;
      }

      if (oldConfig.level !== 'info' && logLevels[oldConfig.level]) {
        bunyanConfig.logger.level = logLevels[oldConfig.level];
      }

      if (oldConfig.filePath) {
        bunyanConfig.logger.streams = bunyanConfig.logger.streams || [];
        fileStream = {
          path: oldConfig.filePath
        };

        if (bunyanConfig.logger.level) {
          fileStream.level = bunyanConfig.logger.level;
        }

        bunyanConfig.logger.streams.push(fileStream);
      }

      if (Object.hasOwnProperty.call(oldConfig, 'logUncaughtException')) {
        bunyanConfig.logUncaughtException = oldConfig.logUncaughtException;
      }

      if (oldConfig.requestIdProperty) {
        bunyanConfig.requestIdProperty = oldConfig.requestIdProperty;
      }

      if (oldConfig.requestIdProvider) {
        bunyanConfig.requestIdProvider = oldConfig.requestIdProvider;
      }

      if (oldConfig.rotationSignal) {
        bunyanConfig.rotationSignal = oldConfig.rotationSignal;
      }

      return config;
    },

    /**
     * Hook configuration function.
     */
    configure: function() {
      var config = sails.config[this.configKey];

      // the ship drawing looks pretty silly in JSON
      sails.config.log.noShip = true;

      // as do color codes
      sails.config.log.colors = false;

      // setup some defaults
      config.logger.name = config.logger.name || 'sails';
      config.logger.serializers =
        config.logger.serializers || bunyan.stdSerializers;

      this.reqSerializer = config.logger.serializers.req ||
        function(x) { return x; };

      this.logger = bunyan.createLogger(config.logger);

      // Inject custom log config
      sails.config.log.custom = {};

      Object.keys(logLevels).forEach(function(sailsLevel) {
        var bunyanLevel = logLevels[sailsLevel];
        if (bunyanLevel) {
          sails.config.log.custom[sailsLevel] = function() {
            var logger = config.getLogger();
            logger[bunyanLevel].apply(logger, arguments);
          };
        }
      });
    },

    /**
     * Hook initialization function.
     */
    initialize: function(done) {
      var config = sails.config[this.configKey];

      _this = this;

      // If a rotationSignal is given, listen for it
      if (config.rotationSignal) {
        process.on(config.rotationSignal, function() {
          _this.logger.reopenFileStreams();
        });
      }

      // If logUncaughtException is set, log those, too
      if (config.logUncaughtException) {
        process.on('uncaughtException', function(err) {
          _this.logger.fatal({err: err}, 'Uncaught exception');
          process.exit(1);
        });
      }

      // save off injectRequestLogger, requestIdProperty, and requestIdProvier
      // for middleware route
      injectRequestLogger = config.injectRequestLogger;
      requestIdProperty = config.requestIdProperty;

      requestIdProvider = config.requestIdProvider ||
          function() {return null;};

      done();
    },

    /**
     * Global route to inject a logger on each request.
     */
    routes: {
      before: {
        '/*': function(req, res, next) {
          if (injectRequestLogger) {

            var options = {req: _this.reqSerializer(req)};

            var requestId = requestIdProvider(req);
            if (requestId !== null) {
              options[requestIdProperty] = requestId;
            }

            req.log = _this.logger.child(options, true);
          }

          next();
        }
      }
    }
  };
};
