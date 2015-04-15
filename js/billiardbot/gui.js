/**
 * @file BilliardBot GUI module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    var GUIListener = require('guilistener');

    /**
     * Constructs a new pool GUI.
     * @constructor
     * @exports GUI
     * @param container {!Element} The container to use.
     */
    function GUI(container) {
        this.container = container;
    }

    /**
     * The width of the table, in meters.
     * @constant {number}
     */
    GUI.TABLE_WIDTH = 2.7;

    /**
     * The height of the table, in meters.
     * @constant {number}
     */
    GUI.TABLE_HEIGHT = GUI.TABLE_WIDTH / 2;

    /**
     * The width of the table, in pixels.
     * @constant {number}
     */
    GUI.WIDTH = 800;

    /**
     * The pixels per meter.
     * @constant {number}
     */
    GUI.PPM = GUI.WIDTH / GUI.TABLE_WIDTH;

    /**
     * The height of the table, in pixels.
     * @constant {number}
     */
    GUI.HEIGHT = GUI.TABLE_HEIGHT * GUI.PPM;

    /**
     * The radius of each ball, in pixels.
     * @constant {number}
     */
    GUI.BALL_RADIUS = (0.05715 * GUI.PPM) / 2;

    /**
     * The speed threshold.
     * @constant {number}
     */
    GUI.SPEED_THRESHOLD = 0.05;

    /**
     * Matter.js options for each ball.
     * @constant {object}
     */
    GUI.BALL_OPTIONS = {
        frictionAir: 0.015,
        friction: 0.0001,
        restitution: 0.92,
        render: {
            lineWidth: 1,
            strokeStyle: "transparent",
            fillStyle: "white"
        }
    };

    /**
     * The width of the wall, in pixels.
     * @constant {number}
     */
    GUI.WALL_WIDTH = 100;

    /**
     * Matter.js options for the wall.
     */
    GUI.WALL_OPTIONS = {
        isStatic: true
    }

    /**
     * The list of colors for each ball.
     * @const {Array.<string>}
     */
    GUI.BALL_COLORS = ["yellow", "blue", "red", "purple", "orange", "green", "maroon", "black",
        "yellow", "blue", "red", "purple", "orange", "green", "maroon"
    ];

    /**
     * The list of balls that should have a solid appearance.
     * @const {Array.<string>}
     */
    GUI.SOLID_BALLS = [1, 2, 3, 4, 5, 6, 7];

    /**
     * The list of balls that should have a striped appearance.
     * @const {Array.<string>}
     */
    GUI.STRIPE_BALLS = [9, 10, 11, 12, 13, 14, 15];

    /**
     * Whether the GUI is currently idle and waiting for someone to take a
     * shot.
     * @type {!boolean}
     * @private
     */
    GUI.prototype.waitingForShot = true;

    /**
     * The current listener.
     * @type {?GUIListener}
     * @private
     */
    GUI.prototype.listener = null;

    var Matter = require('third_party/matter');

    // Matter module aliases
    var Engine = Matter.Engine,
        World = Matter.World,
        Body = Matter.Body,
        Bodies = Matter.Bodies,
        Common = Matter.Common,
        Composites = Matter.Composites,
        Composite = Matter.Composite,
        Events = Matter.Events,
        MouseConstraint = Matter.MouseConstraint;

    /**
     * Sets the event listener.
     * @param {GUIListener} listener
     */
    GUI.prototype.setListener = function(listener) {
        this.listener = listener;
    }

    GUI.prototype.init = function() {
        var self = this;

        // Create the Matter.js engine.
        this.engine = Engine.create(this.container, {
            render: {
                options: {
                    width: GUI.WIDTH,
                    height: GUI.HEIGHT,
                    wireframes: false,
                    background: "#31B94D"
                }
            }
        });

        // Create the cue ball.
        this.cue = Bodies.circle(GUI.WIDTH / 4, GUI.HEIGHT / 2, GUI.BALL_RADIUS,
            GUI.BALL_OPTIONS);
        this.cue.label = "ball-cue";
        World.add(this.engine.world, this.cue);

        // Create the rack.
        this.setupRack();

        // Add some some walls to the world.
        var wallOffset = (GUI.WALL_WIDTH / 2);
        World.add(this.engine.world, [
            Bodies.rectangle(GUI.WIDTH / 2, -wallOffset, GUI.WIDTH, GUI.WALL_WIDTH, GUI.WALL_OPTIONS),
            Bodies.rectangle(GUI.WIDTH / 2, GUI.HEIGHT + wallOffset, GUI.WIDTH, GUI.WALL_WIDTH, GUI.WALL_OPTIONS),
            Bodies.rectangle(-wallOffset, GUI.HEIGHT / 2, GUI.WALL_WIDTH, GUI.HEIGHT, GUI.WALL_OPTIONS),
            Bodies.rectangle(GUI.WIDTH + wallOffset, GUI.HEIGHT / 2, GUI.WALL_WIDTH, GUI.HEIGHT, GUI.WALL_OPTIONS)
        ]);

        Events.on(this.engine, 'tick', function(event) {
            if (!self.waitingForShot) {
                var totalSpeed = self.calculateTotalBallSpeed();

                if (totalSpeed > 0 && totalSpeed < GUI.SPEED_THRESHOLD) {
                    self.waitingForShot = true;
                    if (self.listener) {
                        self.listener.onBallsStopped();
                    }
                }
            }

        });

        // Run the engine, turning off gravity.
        this.engine.world.gravity = {
            x: 0,
            y: 0
        };
        Engine.run(this.engine);
    };

    /**
     * Takes a shot from the given position with the given force vector.
     * @param {!object} The position.
     * @param {!forceVector} The force vector.
     */
    GUI.prototype.takeShot = function(position, forceVector) {
        Body.applyForce(this.cue, position, forceVector);
        this.waitingForShot = false;
    }

    /**
     * @return {!number} The width of the table, in pixels.
     */
    GUI.prototype.getWidth = function() {
        return WIDTH;
    }

    /**
     * @return {!number} The height of the table, in pixels.
     */
    GUI.prototype.getHeight = function() {
        return HEIGHT;
    }

    /**
     * @return {!object} The position of the cue ball.
     */
    GUI.prototype.getCuePosition = function() {
        var allBodies = Composite.allBodies(this.engine.world);
        return allBodies[0].position;
    }

    /**
     * Detects when all the balls have stopped moving on screen and alerts the
     * listener module to take its next turn.
     * @return {number} The total speed of the balls.
     */
    GUI.prototype.calculateTotalBallSpeed = function() {
        var allBodies = Composite.allBodies(this.engine.world);
        var totalSpeed = 0
        for (var i = 0; i < allBodies.length; i++) {
            var body = allBodies[i];
            if (body.label.indexOf("ball-") == 0) {
                totalSpeed += body.speed;
            }
        }

        return totalSpeed;
    }

    /**
     * Sets up the default rack.
     */
    GUI.prototype.setupRack = function() {
        var x = (3 * GUI.WIDTH / 4);
        var y = GUI.HEIGHT / 2;
        var ballsPerRow = 1;
        var ballList = this.createBallList();
        var currentBall = 0;

        for (var i = 0; i < 5; i++) {
            var currentY = y
            for (var j = 0; j < ballsPerRow; j++) {
                var ball = Bodies.circle(x, currentY, GUI.BALL_RADIUS, GUI.BALL_OPTIONS);
                ball.render.fillStyle = GUI.BALL_COLORS[ballList[currentBall] - 1];
                ball.label = "ball-" + ballList[currentBall];

                World.add(this.engine.world, ball);
                currentY += (GUI.BALL_RADIUS * 2);
                currentBall += 1;
            }
            ballsPerRow += 1;

            x += Math.sqrt(Math.pow(GUI.BALL_RADIUS * 2, 2) - Math.pow(GUI.BALL_RADIUS, 2));
            y -= GUI.BALL_RADIUS;
        }
    }

    /**
     * Creates a list of balls in the order that they will be racked. This
     * ensures the 8 ball will be in the middle, the bottom left will have a
     * solid and the bottom right will have a stripe, and the rest will be
     * randomly placed.
     */
    GUI.prototype.createBallList = function() {
        var ballList = [];
        var solidBalls = GUI.SOLID_BALLS.slice();
        var stripeBalls = GUI.STRIPE_BALLS.slice();

        // The 4th ball must be the 8 ball.
        ballList[4] = 8;

        // For simplicity, we will make the bottom left corner a solid and
        // bottom right a stripe every time.
        var bottomLeft = Common.choose(solidBalls);
        ballList[10] = bottomLeft;

        // Remove the ball from the list.
        var index = solidBalls.indexOf(bottomLeft);
        if (index != -1) {
            solidBalls.splice(index, 1);
        }

        var bottomRight = Common.choose(stripeBalls);
        ballList[14] = bottomRight;
        // Remove the ball from the list.
        index = stripeBalls.indexOf(bottomRight);
        if (index != -1) {
            stripeBalls.splice(index, 1);
        }

        // Fill in the rest of the positions randomly.
        var remainingBalls = solidBalls.concat(stripeBalls);
        for (var i = 0; i < 15; i++) {
            if (ballList[i] === undefined) {
                var ball = Common.choose(remainingBalls);
                ballList[i] = ball;
                index = remainingBalls.indexOf(ball);
                if (index != -1) {
                    remainingBalls.splice(index, 1);
                }
            }
        }

        return ballList;
    }

    return GUI;
});