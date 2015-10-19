# sails-hook-bunyan changelog

## vNEXT (XXXX-XX-XX)

 * Updated `jscs` and `chai`. Fixed new style issues, which was mostly just
   adding a whole bunch of commas.

## v2.1.3 (2015-08-21)

 * #8 Doc fixes

## v2.1.2 (2015-07-22)

 * #5 Fix `injectRequestLogger` when set to false
 * #6 Add an Add-ons section to the README

## v2.1.1 (2015-06-12)

 * #1 Run the request serializer when building the child logger.

## v2.1.0 (2015-06-02)

 * Added `getLogger` extension point, so other hooks can provide their own
   logger.

## v2.0.0 (2015-06-02)

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
