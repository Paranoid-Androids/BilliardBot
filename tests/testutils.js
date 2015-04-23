define(function(require) {
    "use strict";

    var TestUtils = {};

    var Matter = require('third_party/matter');
    var GameLogic = require('gamelogic');

    TestUtils.startTestGame = function(gameType) {
        var canvas = document.getElementById('matter-canvas');
        var common = require('common');
        common.startGame(canvas, gameType);
    };

    TestUtils.addBallToWorld = function(gui, color, ballNo, x, y) {
        var ball = gui.createBall({
            x: x,
            y: y
        });

        ball.render.fillStyle = color;
        ball.label = GameLogic.BALL_LABEL_PREFIX + ballNo;
        Matter.World.add(gui.engine.world, ball);
    };

    return TestUtils;
});