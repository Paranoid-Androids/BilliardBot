GUI = new function() {

    var TABLE_WIDTH = 2.7, //in meters
        TABLE_HEIGHT = TABLE_WIDTH / 2, //height is half the width
        WIDTH = 800, //in pixels
        PPM = WIDTH / TABLE_WIDTH, //Pixels per meter
        HEIGHT = TABLE_HEIGHT * PPM,
        BALL_RADIUS = (0.05715 * PPM) / 2,
        SPEED_THRESHOLD = 0.1;

    var ballOptions = {
            frictionAir: 0.015, 
            friction: 0.0001,
            restitution: 0.92
        };

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

    this.init = function() {


        // create a Matter.js engine
        this.container = document.getElementById("canvas-container");
        this.engine = Engine.create(this.container, {
            render: {
                options: {
                    width: WIDTH,
                    height: HEIGHT,
                    showAngleIndicator:true
                }
            }
        });    

        //create the cue ball
        this.cue = Bodies.circle(WIDTH / 4, HEIGHT / 2, BALL_RADIUS, ballOptions);
        World.add(this.engine.world, this.cue);

        //create the rack
        setupRack(this.engine);

        // add some some walls to the world
        World.add(this.engine.world, [
          Bodies.rectangle(WIDTH / 2, 0, WIDTH, 1, { isStatic: true }),
          Bodies.rectangle(WIDTH / 2, HEIGHT, WIDTH, 1, { isStatic: true }),
          Bodies.rectangle(0, HEIGHT / 2, 1, HEIGHT, { isStatic: true }),
          Bodies.rectangle(WIDTH, HEIGHT / 2, 1, HEIGHT, { isStatic: true }),
        ]);

        Events.on(this.engine, 'tick', function(event) {

            if (!waitingForShot) {
                calculateTotalBallSpeed();
            }

        });

        // run the engine, turning off gravity
        this.engine.world.gravity = {x:0, y:0};
        Engine.run(this.engine);
    };

    this.takeShot = function(position, forceVector) {
        Body.applyForce(GUI.cue, position, forceVector);
        waitingForShot = false;
    }

    this.getWidth = function() {
        return WIDTH;
    }

    this.getHeight = function() {
        return HEIGHT;
    }

    this.getCuePosition = function() {
        allBodies = Composite.allBodies(this.engine.world);
        console.log(allBodies[0].position);
        return allBodies[0].position;
    }

    function calculateTotalBallSpeed() {
        allBodies = Composite.allBodies(GUI.engine.world);
        totalSpeed = 0
        for (i = 0; i < allBodies.length; i++) {
            body = allBodies[i];
            if (body.label == "Circle Body") {
                totalSpeed += body.speed;
            }
        }
        if (totalSpeed > 0 && totalSpeed < SPEED_THRESHOLD) {
            waitingForShot = true;
            GameLogic.takeNextTurn();
        }
    }

    // sets up the default rack
    function setupRack(engine) {
        x = (3 * WIDTH / 4);
        y = HEIGHT / 2;
        ballsPerRow = 1;

        for (i = 0; i < 5; i++) {
            currentY = y
            for (j = 0; j < ballsPerRow; j++) {
                World.add(engine.world, Bodies.circle(x, currentY, BALL_RADIUS, ballOptions));
                currentY += (BALL_RADIUS * 2);
            }
            ballsPerRow += 1;
            x += (BALL_RADIUS * 2);
            y -= BALL_RADIUS;
        }
    }
}
