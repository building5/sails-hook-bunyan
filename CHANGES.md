# sails-hook-bunyan changelog

## v2.0.0 (2015-05-31)

 * Updated for Sails 0.11.x.
   * Re-implemented as a Sails hook.
 * Changed name to `sails-hook-bunyan`.
 
## v1.0.2 (2015-03-04)

 * PR#3 export logLevels, so sails-hook-bunyan extensions can make their
   own mappings.

## v1.0.1 (2015-01-06)

 * Doc updates.
 * Fix level setting when using `config.filePath`.

## v1.0.0 (2014-11-06)

 * `config.filePath` for file logging.
 * `config.rotationSignal` for file rotation.
 * `config.logUncaughtException` to log uncaught exceptions with Bunyan
   and exit.

## v0.1.0 (2014-08-27)

 * Initial Release.
