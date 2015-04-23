define(function(require) {
    "use strict";

    var TestUtils = {};

    TestUtils.startTestGame = function(gameType) {
        var canvas = document.getElementById('matter-canvas');
        var common = require('common');
        common.startGame(canvas, gameType);
    }

    return TestUtils;
});