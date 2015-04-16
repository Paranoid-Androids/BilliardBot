/**
 * @file BilliardBot Game Logic module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    var GUIListener = require('guilistener');
    var Matter = require('third_party/matter');
    var Common = Matter.Common;

    var ballsSunk = [];

    /**
     * Constructs a new GameLogic.
     * @class
     * @implements GUIListener
     * @exports GameLogic
     * @param gui {GUI} The GUI that this class should use.
     */
    function GameLogic(gui) {
        this.gui = gui;
    }

    /**
     * The list of colors for each ball.
     * @const {Array.<string>}
     */
    GameLogic.BALL_COLORS = ["yellow", "blue", "red", "purple", "orange", "green", "maroon",
        "black",
        "yellow", "blue", "red", "purple", "orange", "green", "maroon"
    ];

    /**
     * The list of balls that should have a solid appearance.
     * @const {Array.<string>}
     */
    GameLogic.SOLID_BALLS = [1, 2, 3, 4, 5, 6, 7];

    /**
     * The list of balls that should have a striped appearance.
     * @const {Array.<string>}
     */
    GameLogic.STRIPE_BALLS = [9, 10, 11, 12, 13, 14, 15];

    /**
     * The break vector.
     * @const {x: number, y: number}
     */
    GameLogic.BREAK_VECTOR = {
        x: .02,
        y: 0
    };

    /**
     * Initializes the game logic.
     */
    GameLogic.prototype.init = function() {
        // TODO: replace this with something else.
        this.takeShot(this.gui.getCuePosition(), GameLogic.BREAK_VECTOR);
    };

    /**
     * Creates a list of balls in the order that they will be racked. This
     * ensures the 8 ball will be in the middle, the bottom left will have a
     * solid and the bottom right will have a stripe, and the rest will be
     * randomly placed.
     */
    GameLogic.prototype.createInitialBallList = function() {
        var ballList = [];
        var solidBalls = GameLogic.SOLID_BALLS.slice();
        var stripeBalls = GameLogic.STRIPE_BALLS.slice();

        // The 4th ball must be the 8 ball.
        ballList[4] = 8;

        // For simplicity, we will make the bottom left corner a solid and
        // bottom right a stripe every time.
        var bottomLeft = Common.choose(solidBalls);
        ballList[10] = bottomLeft;

        // Remove the ball from the list.
        var index = solidBalls.indexOf(bottomLeft);
        solidBalls.splice(index, 1);

        var bottomRight = Common.choose(stripeBalls);
        ballList[14] = bottomRight;
        // Remove the ball from the list.
        index = stripeBalls.indexOf(bottomRight);
        stripeBalls.splice(index, 1);

        // Fill in the rest of the positions randomly.
        var remainingBalls = solidBalls.concat(stripeBalls);
        for (var i = 0; i < 15; i++) {
            if (ballList[i] === undefined) {
                var ball = Common.choose(remainingBalls);
                ballList[i] = ball;
                index = remainingBalls.indexOf(ball);
                remainingBalls.splice(index, 1);
            }
        }

        return ballList;
    }

    /** @override */
    GameLogic.prototype.onBallsStopped = function() {
        this.takeNextTurn();
    }

    GameLogic.prototype.ballSunk = function(ball) {
        console.log("ball " + ball.label + " sunk!");
        ballsSunk.push(ball);
    }

    /**
     * Takes a shot.
     * @param position {*} The position.
     * @param vector {*} The vector.
     */
    GameLogic.prototype.takeShot = function(position, vector) {
        this.gui.takeShot(position, vector);
    };

    /**
     * Takes the next turn.
     */
    GameLogic.prototype.takeNextTurn = function() {
        this.takeShot(this.gui.getCuePosition(), GameLogic.BREAK_VECTOR);
    };

    return GameLogic;
});