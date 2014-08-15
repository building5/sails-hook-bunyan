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

To configure Bunyan, put a `bunyan` object in `config/log.js`.

```JavaScript
module.exports.log = {
  level: 'info', // Sails logging level, for backward compatability
  bunyan: {
    name: 'sails', // Logger name
    level: 'debug', // Bunyan logging level
    serializers: bunyan.stdSerializers, // Bunyan serializers
    streams: [] // Output streams. Defaults to stdout.
  }
};
```

## Request Logger

`sails-bunyan` also provides a middleware function that can inject a Bunyan
child logger onto every request. This is configured in your app's
`config/http.js`.

```JavaScript
var requestLogger = require('sails-bunyan').requestLogger;

module.exports.http = {
  order: [
    'requestLogger',
    // Other middleware
  ],

  requestLogger: requestLogger
};
```
