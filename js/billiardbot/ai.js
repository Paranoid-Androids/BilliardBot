define(function(require) {
    "use strict";

    var Matter = require('third_party/matter');
    var Vector = Matter.Vector;
    var GUI = require('gui');

    /**
     * The break vector.
     * @const {x: number, y: number}
     */
    AI.BREAK_VECTOR = {
        x: .02,
        y: 0
    };

    function AI(gameLogic) {
        this.gameLogic = gameLogic;
        this.gameLogic.registerPlayer(this);
    }

    AI.prototype.makeMove = function() {
        var self = this;
        var pockets = this.gameLogic.getPockets();
        var balls = this.gameLogic.getMyBalls(this);
        var cue = this.gameLogic.getCue();

        if (this.gameLogic.initialBreak) {
            this.gameLogic.takeShot(AI.BREAK_VECTOR);
        }
        else {
            var ball = balls[10];
            var pocket = pockets[4];
            var velocityVector = self.getVectorCueToBall(cue, ball, pocket);            
            console.log(velocityVector);
            this.gameLogic.takeShot(velocityVector);
            // balls.forEach(function(ball) {
            //     pockets.forEach(function(pocket) {
            //         var velocityVector = self.getVectorCueToBall(cue, ball, pocket);
            //         console.log("Ball: " + ball.label + "\tvector: " +velocityVector.x + ", " + velocityVector.y + "\tfor pocket: " + pocket.x + ", " + pocket.y);
            //     });
            // });
        }
    }

    AI.prototype.minVtoPocket = function(ball, pocket) {
        var frictionConstant = ball.frictionAir;

        var distance = {x: pocket.x - ball.position.x, y: pocket.y - ball.position.y};

        // r = mv/b, v = br/m
        return {x: frictionConstant * distance.x / ball.mass, y: frictionConstant * distance.y / ball.mass};
    }

    AI.prototype.getVectorCueToBall = function(cue, ball, pocket) {
        var minV = this.minVtoPocket(ball, pocket);

        // var forceX = (Math.pow(minV.x, 2) * ball.mass) / (2 * (pocket.x - ball.position.x));
        // var forceY = (Math.pow(minV.y, 2) * ball.mass) / (2 * (pocket.y - ball.position.y));
        // console.log(forceX);
        // console.log(forceY);
        // var force = Vector.div({x: forceX, y: forceY}, 50);
        // console.log(force);
        // return force;
        var theta = Math.atan(minV.y / minV.x);

        var hyp = 2 * ball.circleRadius;
        var newCue = {x: ball.position.x + hyp * Math.cos(theta), y: ball.position.y + hyp * Math.sin(theta)};

        var velocityMagnitude = Vector.magnitude(minV) / Math.cos(theta);
        var cueDistanceTraveled = {x: newCue.x - cue.position.x, y: newCue.y - cue.position.y};
        var velocityVector = Vector.mult(Vector.normalise(cueDistanceTraveled), velocityMagnitude);
        console.log(minV);
        console.log(cueDistanceTraveled);
        console.log(velocityVector);
        console.log(newCue);

        var forceX = (Math.pow(velocityVector.x, 2) * ball.mass) / (2 * cueDistanceTraveled.x);
        var forceY = (Math.pow(velocityVector.y, 2) * ball.mass) / (2 * cueDistanceTraveled.y);

        var force = Vector.div({x: forceX, y: forceY}, 100);
        console.log(force);
        return force;
    }


    return AI;
});