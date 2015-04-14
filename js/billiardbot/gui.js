/**
 * @file BilliardBot GUI module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

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
    GUI.SPEED_THRESHOLD = 0.1;

    GUI.BALL_OPTIONS = {
        frictionAir: 0.015,
        friction: 0.0001,
        restitution: 0.92
    };

    var Matter = require('third_party/matter');
    var waitingForShot = true;

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

    GUI.prototype.init = function() {
        var self = this;

        // create a Matter.js engine
        this.container = document.getElementById("canvas-container");
        this.engine = Engine.create(this.container, {
            render: {
                options: {
                    width: GUI.WIDTH,
                    height: GUI.HEIGHT,
                    showAngleIndicator: true
                }
            }
        });

        //create the cue ball
        this.cue = Bodies.circle(GUI.WIDTH / 4, GUI.HEIGHT / 2, GUI.BALL_RADIUS,
            GUI.BALL_OPTIONS);
        World.add(this.engine.world, this.cue);

        //create the rack
        this.setupRack();

        // add some some walls to the world
        World.add(this.engine.world, [
            Bodies.rectangle(GUI.WIDTH / 2, 0, GUI.WIDTH, 1, {
                isStatic: true
            }),
            Bodies.rectangle(GUI.WIDTH / 2, GUI.HEIGHT, GUI.WIDTH, 1, {
                isStatic: true
            }),
            Bodies.rectangle(0, GUI.HEIGHT / 2, 1, GUI.HEIGHT, {
                isStatic: true
            }),
            Bodies.rectangle(GUI.WIDTH, GUI.HEIGHT / 2, 1, GUI.HEIGHT, {
                isStatic: true
            }),
        ]);

        Events.on(this.engine, 'tick', function(event) {
            if (!waitingForShot) {
                self.calculateTotalBallSpeed();
            }

        });

        // run the engine, turning off gravity
        this.engine.world.gravity = {
            x: 0,
            y: 0
        };
        Engine.run(this.engine);
    };

    GUI.prototype.takeShot = function(position, forceVector) {
        Body.applyForce(this.cue, position, forceVector);
        waitingForShot = false;
    }

    GUI.prototype.getWidth = function() {
        return WIDTH;
    }

    GUI.prototype.getHeight = function() {
        return HEIGHT;
    }

    GUI.prototype.getCuePosition = function() {
        var allBodies = Composite.allBodies(this.engine.world);
        console.log(allBodies[0].position);
        return allBodies[0].position;
    }


    GUI.prototype.calculateTotalBallSpeed = function() {
        var allBodies = Composite.allBodies(this.engine.world);
        var totalSpeed = 0
        for (var i = 0; i < allBodies.length; i++) {
            var body = allBodies[i];
            if (body.label == "Circle Body") {
                totalSpeed += body.speed;
            }
        }
        if (totalSpeed > 0 && totalSpeed < GUI.SPEED_THRESHOLD) {
            console.log(totalSpeed);
            waitingForShot = true;
            GameLogic.takeNextTurn();
        }
    }

    // sets up the default rack
    GUI.prototype.setupRack = function() {
        var x = 3 * GUI.WIDTH / 4;
        var y = GUI.HEIGHT / 2;
        var ballsPerRow = 1;

        for (var i = 0; i < 5; i++) {
            var currentY = y
            for (var j = 0; j < ballsPerRow; j++) {
                World.add(this.engine.world,
                    Bodies.circle(x, currentY, GUI.BALL_RADIUS, GUI.BALL_OPTIONS));
                currentY += GUI.BALL_RADIUS * 2;
            }
            ballsPerRow += 1;
            x += GUI.BALL_RADIUS * 2;
            y -= GUI.BALL_RADIUS;
        }
    }

    return GUI;
});