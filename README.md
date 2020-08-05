# sails-hook-bunyan

![dependencies](https://david-dm.org/building5/sails-hook-bunyan.svg)

A [sails hook][] replacing the Sails default logger with Bunyan. Supports sails
0.12.x.

> For Sails 0.10.x support, see the old [sails-bunyan][].

## Installation

To use, simply install the module.

```
$ npm install sails-hook-bunyan
```

## Configuration

By default, `sails-hook-bunyan` is configured in the `bunyan` config object,
however, this can be changed in your [hook configuration][].

```JavaScript
module.exports.bunyan = {
  /** If true, a child logger is injected on each request */
  injectRequestLogger: true,

  /** If true, log uncaughtExceptions and terminate the process */
  logUncaughtException: false,

  /** If given, signal to listen on for file rotation */
  rotationSignal: null,

  /** Convenience setting to log to file */
  filePath: null,

  logger: {
    /** Logger name */
    name: 'sails',
    /** Bunyan logging level; defaults to info */
    level: null,
    /** Bunyan serializers */
    serializers: bunyan.stdSerializers,
    /** Array of output streams */
    streams: null
  }
};
```

By default, `sails-hook-bunyan` will log to `stdout`. If a `filePath` is
specified, it will instead log to the named file. If both `filePath` and
`bunyan.streams` are specified, the file stream is appended to the list of given
streams.

For `rotationSignal`, it's recommended to use `SIGHUP`. `SIGUSR1` is reserved
by Node, and will start the debugger. `SIGUSR2` is reserved by Sails, and will
lower the sails app. Upon receiving the signal, `sails-hook-bunyan` will call
`bunyan.reopenFileStreams()`; allowing for something like [logrotate][] to
handle the actual file rotation logic.

## Add-ons

- [sails-hook-bunyan-request-logger](https://github.com/JeffAshtonCT/sails-hook-bunyan-request-logger) -
An extension which replaces the request logger with one that includes request ids


 [sails hook]: http://sailsjs.org/#!/documentation/concepts/extending-sails/Hooks
 [sails-bunyan]: https://github.com/building5/sails-bunyan
 [hook configuration]: http://sailsjs.org/#!/documentation/concepts/extending-sails/Hooks/usinghooks.html?q=changing-the-way-sails-loads-an-installable-hook
 [logrotate]: http://linux.die.net/man/8/logrotate
