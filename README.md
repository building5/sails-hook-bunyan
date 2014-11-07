# sails-bunyan

A module replacing the Sails default logger with Bunyan. Support sails 0.10.x.

To use, simply inject the logger in `config/bootstrap.js`.

```JavaScript
var injectBunyan = require('sails-bunyan').injectBunyan;

module.exports.bootstrap = function (done) {
  injectBunyan();
  done();
}
```

To configure Bunyan, put a `bunyan` object in `config/log.js`. The defaults are

```JavaScript
module.exports.log = {
  /** Sails logging level, for backward comparability */
  level: 'info',
  /** If true, log uncaughtExceptions and terminate the process */
  logUncaughtException: false,
  /** If given, file to log to instead of stdout */
  filePath: null,
  /** If given, signal to listen on for file rotation */
  rotationSignal: null,
  /** Configuration to pass to the Bunyan logger */
  bunyan: {
    /** Logger name */
    name: 'sails',
    /** Bunyan logging level */
    level: 'debug',
    /** Bunyan serializers */
    serializers: bunyan.stdSerializers,
    /** Array of output streams */
    streams: null
  }
};
```

By default, `sails-bunyan` will log to `stdout`. If a `filePath` is specified,
it will instead log to the named file. If both `filePath` and `bunyan.streams`
are specified, the file stream is appended to the list of given streams.

For `rotationSignal`, it's recommended to use `SIGHUP`. `SIGUSR1` is reserved
by Node, and will start the debugger. `SIGUSR2` is reserved by Sails, and will
lower the sails app.

## Request Logger

`sails-bunyan` also provides a middleware function that can inject a Bunyan
child logger onto every request. This is configured in your app's
`config/http.js`.

```JavaScript
var injectRequestLogger = require('sails-bunyan').injectRequestLogger;

module.exports.http = {
  order: [
    'injectRequestLogger',
    // Other middleware
  ],

  injectRequestLogger: injectRequestLogger
};
```
