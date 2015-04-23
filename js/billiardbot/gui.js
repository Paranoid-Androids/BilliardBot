/**
 * @file BilliardBot GUI module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    var GUIListener = require('guilistener');
    var GameLogic = require('gamelogic');

    /**
     * Constructs a new pool GUI.
     * @constructor
     * @exports GUI
     * @param container {!Element} The container to use.
     */
    function GUI(container) {
        this.canvas = container;
    }

    /**
     * The simulation speed of the engine. 1.0 is normal; higher values make
     * the game faster.
     */
    GUI.TIME_SCALE = 0.8;

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
     * Matter.js options for each ball.
     * @constant {object}
     */
    GUI.BALL_OPTIONS = {
        frictionAir: 0.015,
        friction: 0.0001,
        restitution: 0.92,
        render: {
            lineWidth: 0,
            strokeStyle: "transparent",
            fillStyle: "white"
        }
    };

    // TODO: if needed, improve the appearance of the pockets.
    /**
     * The radius of the pocket mouth on the corners, in pixels.
     * @constant {number}
     */
    GUI.POCKET_RADIUS_CORNER = (0.115 * GUI.PPM) / 2 * 1.75;

    /**
     * The radius of the pocket mouth on the side, in pixels.
     * @constant {number}
     */
    GUI.POCKET_RADIUS_SIDE = (0.129 * GUI.PPM) / 2;

    /**
     * Matter.js options for each ball.
     * @constant {object}
     */
    GUI.POCKET_OPTIONS = {
        isStatic: true,
        label: 'pocket',
        slop: 3,
        render: {
            lineWidth: 1,
            strokeStyle: "white",
            fillStyle: "black"
        }
    };

    /**
     * The speed of the fastest ball below which the turn is considered to be
     * over.
     * @constant {number}
     */
    GUI.SPEED_THRESHOLD = 0.05;

    /**
     * The width of the wall, in pixels.
     * @constant {number}
     */
    GUI.WALL_WIDTH = 40;

    /**
     * Matter.js options for the wall.
     */
    GUI.WALL_OPTIONS = {
        isStatic: true,
        slop: 0.02,
        render: {
            lineWidth: 3,
            strokeStyle: "white",
            fillStyle: "brown"
        }
    }

    var pocketTargetOffset = (Math.cos(Math.PI / 4) * GUI.POCKET_RADIUS_CORNER) - 5;
    GUI.POCKETS = [
        {x: 0, y: 0, radius: GUI.POCKET_RADIUS_CORNER, target: {x: pocketTargetOffset, y: pocketTargetOffset}},
        {x: GUI.WIDTH, y: 0, radius: GUI.POCKET_RADIUS_CORNER, target: {x: GUI.WIDTH - pocketTargetOffset, y: pocketTargetOffset}},
        {x: 0, y: GUI.HEIGHT, radius: GUI.POCKET_RADIUS_CORNER, target: {x: pocketTargetOffset, y: GUI.HEIGHT - pocketTargetOffset}},
        {x: GUI.WIDTH, y: GUI.HEIGHT, radius: GUI.POCKET_RADIUS_CORNER, target: {x: GUI.WIDTH - pocketTargetOffset, y: GUI.HEIGHT - pocketTargetOffset}},
        {x: GUI.WIDTH / 2, y: 0, radius: GUI.POCKET_RADIUS_SIDE, target: {x: GUI.WIDTH / 2, y: pocketTargetOffset}},
        {x: GUI.WIDTH / 2, y: GUI.HEIGHT, radius: GUI.POCKET_RADIUS_SIDE, target: {x: GUI.WIDTH / 2, y: GUI.HEIGHT - pocketTargetOffset}},
    ]

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

    /**
     * The number of balls that have fallen into a pocket.
     * @type {!number}
     */
    GUI.prototype.numPocketedBalls = 0;

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
        MouseConstraint = Matter.MouseConstraint,
        Runner = Matter.Runner;

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
        this.canvas.width = GUI.WIDTH;
        this.canvas.height = GUI.HEIGHT;
        this.engine = Engine.create({
            render: {
                canvas: this.canvas,
                options: {
                    width: GUI.WIDTH,
                    height: GUI.HEIGHT,
                    wireframes: false,
                    background: "#31B94D"
                }
            }
        });

        // TODO: Temporary fix: show balls sunk as text.
        this.ballsSunk = document.getElementById("balls-sunk");
        this.gameStatus = document.getElementById("game-status");

        // Add some some walls to the world.
        // Note that these values were carefully calculated by first hiding all the pockets and
        // seeing that the balls could fit.
        var wallOffset = GUI.WALL_WIDTH / 4;
        var pocketOffset = GUI.POCKET_RADIUS_CORNER * 2;
        World.add(this.engine.world, [
            // Left wall.
            Bodies.rectangle(-wallOffset, GUI.HEIGHT / 2, GUI.WALL_WIDTH, GUI.HEIGHT -
                pocketOffset, GUI.WALL_OPTIONS),
            // Right wall.
            Bodies.rectangle(GUI.WIDTH + wallOffset, GUI.HEIGHT / 2, GUI.WALL_WIDTH,
                GUI.HEIGHT - pocketOffset, GUI.WALL_OPTIONS),
            // Top wall (broken up into two).
            Bodies.rectangle(GUI.WIDTH / 4 + pocketOffset / 12, -wallOffset, (
                GUI.WIDTH - pocketOffset * 7 / 5) / 2, GUI.WALL_WIDTH, GUI.WALL_OPTIONS),
            Bodies.rectangle(GUI.WIDTH * 3 / 4 - pocketOffset / 12, -wallOffset, (
                GUI.WIDTH - pocketOffset * 7 / 5) / 2, GUI.WALL_WIDTH, GUI.WALL_OPTIONS),
            // Bottom wall (broken up into two).
            Bodies.rectangle(GUI.WIDTH / 4 + pocketOffset / 12, GUI.HEIGHT +
                wallOffset, (GUI.WIDTH - pocketOffset * 7 / 5) / 2, GUI.WALL_WIDTH,
                GUI.WALL_OPTIONS
            ),
            Bodies.rectangle(GUI.WIDTH * 3 / 4 - pocketOffset / 12, GUI.HEIGHT +
                wallOffset, (GUI.WIDTH - pocketOffset * 7 / 5) / 2, GUI.WALL_WIDTH,
                GUI.WALL_OPTIONS
            )
        ]);

        // Add pockets.
        GUI.POCKETS.forEach(function (pocket) {
            World.add(self.engine.world, Bodies.circle(pocket.x, pocket.y, pocket.radius, GUI.POCKET_OPTIONS));
        });

        // Create the rack.
        this.setupRack();

        // Create the cue ball.
        this.placeCue();

        Events.on(this.engine, 'afterTick', function(event) {
            if (self.ballsHalted) {
                self.setBallsHalted(false);
            }
            if (!self.waitingForShot) {
                // Remove balls that fall in pockets.
                self.removePocketedBalls();

                // Detect when the balls have stopped moving.
                var totalSpeed = self.calculateMaximumBallSpeed();
                if (totalSpeed >= 0 && totalSpeed < GUI.SPEED_THRESHOLD) {
                    self.setBallsHalted(true);
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
        this.engine.timing.timeScale = GUI.TIME_SCALE;
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

    GUI.prototype.takeShot2 = function(ball, position, forceVector) {
        Body.applyForce(ball, position, forceVector);
        this.waitingForShot = false;
    }

    GUI.prototype.setBallsHalted = function(halt) {
        this.ballsHalted = halt;
        this.getBallsOnTable().forEach(function(ball) {
            if (halt) {
                ball.oldFrictionAir = ball.frictionAir;
                ball.frictionAir = 1;
                ball.positionPrev.x = ball.position.x;
                ball.positionPrev.y = ball.position.y;
                ball.anglePrev = ball.angle;
                ball.angularVelocity = 0;
                ball.speed = 0;
                ball.angularSpeed = 0;
                ball.motion = 0;
            } else {
                ball.frictionAir = ball.oldFrictionAir;
                delete ball.oldFrictionAir;
            }
        });
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
    GUI.prototype.getCue = function() {
        return this.cue;
    }

    GUI.prototype.createBall = function(position) {
        var ball = Bodies.circle(position.x, position.y, GUI.BALL_RADIUS, GUI.BALL_OPTIONS);
        Body.setMass(ball, .17);
        return ball;
    }

    GUI.prototype.placeBall = function(position, ball) {
        ball.position = position;
        World.add(this.engine.world, ball);
    }

    GUI.prototype.placeCueWithP = function(position) {
        this.cue = this.createBall(position);
        this.cue.label = GameLogic.BALL_LABEL_PREFIX + "cue";
        this.placeBall(position, this.cue);
    }

    GUI.prototype.placeCue = function() {
        this.placeCueWithP({x: GUI.WIDTH / 4, y: GUI.HEIGHT / 2});
    }

    /**
     * Shows which player is currently taking their turn.
     * @param {number} player The active player.
     */
    GUI.prototype.updateCurrentPlayer = function(player) {
        this.updateGameStatus(player + 1);
    }

    /**
     * Updates the page with the status of the game.
     * @param {string} gameStatus The game status.
     */
    GUI.prototype.updateGameStatus = function(gameStatus) {
        this.gameStatus.innerHTML = gameStatus;
    }

    GUI.prototype.getBallsOnTable = function() {
        var allBodies = Composite.allBodies(this.engine.world);
        var ballsOnTable = [];
        allBodies.forEach(function(ball) {
            if (ball.label.indexOf(GameLogic.BALL_LABEL_PREFIX) == 0) {
                ballsOnTable.push(ball);
            }
        });

        return ballsOnTable;
    }

    GUI.prototype.getPockets = function() {
        return GUI.POCKETS;
    }

    /**
     * Used to detect when all the balls have stopped moving on screen in order
     * to alert the listener module to take its next turn.
     * @return {number} The speed of the fastest balls.
     */
    GUI.prototype.calculateMaximumBallSpeed = function() {
        var allBodies = Composite.allBodies(this.engine.world);
        var biggestSpeed = 0;
        for (var i = 0; i < allBodies.length; i++) {
            var ball = allBodies[i];
            if (ball.label.indexOf(GameLogic.BALL_LABEL_PREFIX) == 0) {
                biggestSpeed = Math.max(biggestSpeed, ball.speed);
            }
        }

        return biggestSpeed;
    }

    /**
     * Sets up the default rack.
     */
    GUI.prototype.setupRack = function() {
        var ball_x = (3 * GUI.WIDTH / 4);
        var ball_y = GUI.HEIGHT / 2;
        var ballsPerRow = 1;
        var ballList = this.listener.createInitialBallList();
        var currentBall = 0;

        for (var i = 0; i < 5; i++) {
            var currentY = ball_y
            for (var j = 0; j < ballsPerRow; j++) {

                var ball = this.createBall({x:ball_x, y:currentY});
                ball.render.fillStyle = GameLogic.BALL_COLORS[ballList[currentBall] - 1];
                ball.render.strokeStyle = GameLogic.BALL_OUTLINES[ballList[currentBall] - 1];
                ball.render.lineWidth = 1.8;
                ball.label = GameLogic.BALL_LABEL_PREFIX + ballList[currentBall];

                World.add(this.engine.world, ball);
                currentY += (GUI.BALL_RADIUS * 2);
                currentBall += 1;
            }
            ballsPerRow += 1;

            ball_x += Math.sqrt(Math.pow(GUI.BALL_RADIUS * 2, 2) - Math.pow(GUI.BALL_RADIUS, 2));
            ball_y -= GUI.BALL_RADIUS;
        }
    }

    /**
     * Remove any balls that have fallen into pockets.
     */
    GUI.prototype.removePocketedBalls = function() {
        var self = this;

        var allBodies = Composite.allBodies(this.engine.world);
        var activeBalls = allBodies.filter(function(b) {
            return b.label.indexOf(GameLogic.BALL_LABEL_PREFIX) == 0;
        });
        var wallOffset = GUI.WALL_WIDTH / 3 * (1 - GUI.WALL_OPTIONS.slop);

        activeBalls.forEach(function(ball) {
            if (ball.position.x < wallOffset || ball.position.x > GUI.WIDTH -
                wallOffset || ball.position.y < wallOffset || ball.position.y >
                GUI.HEIGHT - wallOffset) {
                Composite.removeBody(self.engine.world, ball)

                self.numPocketedBalls++;

                if(self.listener) {
                    self.listener.ballSunk(ball);
                }
            }
        });
    };

    GUI.prototype.endGame = function(winningPlayer, isMultiplayer) {
        console.log("end game");
        Runner.stop(this.engine);
        this.updateGameStatus(isMultiplayer
            ? ("Player " + (winningPlayer + 1) + " won!")
            : (winningPlayer == 0 ? "You won!" : "You lost."));
    }

    return GUI;
});