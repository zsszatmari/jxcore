// Copyright & License details are available under JXCORE_LICENSE file


/*
 * The goal of this test is to make sure that when a top-level error
 * handler throws an error following the handling of a previous error,
 * the process reports the error message from the error thrown in the
 * top-level error handler, not the one from the previous error.
 */

var domainErrHandlerExMessage = 'exception from domain error handler';
var internalExMessage = 'You should NOT see me';

if (process.argv[2] === 'child') {
  var domain = require('domain');
  var d = domain.create();

  d.on('error', function() {
    throw new Error(domainErrHandlerExMessage);
  });

  d.run(function doStuff() {
    process.nextTick(function () {
      throw new Error(internalExMessage);
    });
  });
} else {
  var fork = require('child_process').fork;
  var assert = require('assert');

  function test() {
    var child = fork(process.argv[1], ['child'], {silent:true});
    var gotDataFromStderr = false;
    var stderrOutput = '';
    if (child) {
      child.stderr.on('data', function onStderrData(data) {
        gotDataFromStderr = true;
        stderrOutput += data.toString();
      })

      child.on('exit', function onChildExited(exitCode, signal) {
        assert(gotDataFromStderr);
        assert(stderrOutput.indexOf(domainErrHandlerExMessage) !== -1);
        assert(stderrOutput.indexOf(internalExMessage) === -1);

        var expectedExitCode = 7;
        var expectedSignal = null;

        assert.equal(exitCode, expectedExitCode);
        assert.equal(signal, expectedSignal);
      });
    }
  }

  test();
}