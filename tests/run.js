/**
 * Run "casperjs test run.js" to run all the tests in this folder.
 * Note: install CasperJS v1.9.2.
 */

var fs = require('fs');

// Config.
var TIMEOUT = 60000;
var SHOW_CONSOLE_LOG = false;
var DONE_SELECTOR = '#gameEnded';

// Show log messages in the console if needed.
if (SHOW_CONSOLE_LOG) {
    casper.on('remote.message', function(message) {
        this.echo('[LOG]: ' + message);
    });
}

// Find all the .html files in the tests directory.
var files = fs.list(fs.workingDirectory);
var tests = [];
files.forEach(function(file) {
    if (file.indexOf('.html', file.length - '.html'.length) !== -1) {
        tests.push(file);
    }
});

// Run all the tests!
casper.echo('Running ' + tests.length + ' test' + (tests.length != 1 ? 's' : '') +
    ' with a timeout of ' + TIMEOUT / 1000 + ' seconds.\n');

var testIndex = 0;
for (var i = 0; i < tests.length; i++) {
    casper.test.begin(tests[i], 3, function suite(test) {
        var errors = [];
        casper.on('page.error', function onError(msg, trace) {
            errors.push(msg + ': ' + trace);
        });

        casper.start(tests[i]);

        // Wait for either the game to end or an error to appear.
        var timedOut = false;
        casper.waitFor(
            function check() {
                return errors.length != 0 || this.exists(DONE_SELECTOR);
            },
            function gameEnded() {
                test.assertEquals(errors, []);
                test.assertExists('#gameEnded');
            },
            function timedOut() {
                timedOut = true;
                test.assertEquals([], []); // intentional
                test.assertExists('#gameEnded');
            }, TIMEOUT);

        casper.then(function() {
            test.assertFalsy(timedOut);
        });

        casper.run(function() {
            test.done();
        });
    });
}