/**
 * Run "casperjs _run.js" to run all the tests in this folder.
 * Note: install CasperJS v1.9.2.
 */

var fs = require('fs');
var casper = require('casper').create({
    logLevel: 'debug'
});

// Set the timeout.
var TIMEOUT = 60000;

// Handle JS errors.
casper.once('page.error', function onError(msg, trace) {
    // Workaround for GUI.endGame() causing some errors here.
    if (!this.exists('#gameEnded')) {
        this.die('Test error: ' + msg + '\n\n' + trace);
    }
});

// Show log messages in the console.
casper.on('remote.message', function(message) {
    this.echo('[LOG]: ' + message);
});

// Find all the .html files in the tests directory.
var files = fs.list(fs.workingDirectory);
var tests = [];
files.forEach(function(file) {
    if (file.indexOf('.html', file.length - '.html'.length) !== -1) {
        tests.push(file);
    }
});

// Run all the tests!
casper.echo('Running ' + tests.length + ' tests with a timeout of '
    + TIMEOUT / 1000 + ' s.\n');

var runHtmlTest = function() {
    var path = this.getCurrentUrl();
    var filename = path.substring(path.lastIndexOf('/') + 1);
    this.echo('Running ' + filename + '...');
};

var onTimeout = function() {
    this.die('Test timed out.');
};

var testIndex = 0;
for (var i = 0; i < tests.length; i++) {
    if (i == 0) {
        casper.start(tests[i], runHtmlTest);
        casper.waitForSelector('#gameEnded', null, onTimeout, TIMEOUT);
    } else {
        casper.thenOpen(tests[i], runHtmlTest);
        casper.waitForSelector('#gameEnded', null, onTimeout, TIMEOUT);
    }
}

casper.run();