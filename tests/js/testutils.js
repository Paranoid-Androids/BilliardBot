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

    /**
     * Adds a selector to the body when the game finishes so that 'run.js' knows
     * when the game ends.
     */
    TestUtils.notifyOnEndGame = function(GUI) {
        var oldEndGame = GUI.prototype.endGame;
        GUI.prototype.endGame = function(winningPlayer, isMultiplayer) {
            oldEndGame.call(this);
            var notifier = document.createElement('div');
            notifier.style.display = 'none';
            notifier.id = 'gameEnded';
            document.body.appendChild(notifier);
        };
    }

    return TestUtils;
});