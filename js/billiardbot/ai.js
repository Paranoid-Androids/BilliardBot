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
            var bestTheta = Math.PI / 2;
            var force;
            balls.forEach(function(ball) {
                pockets.forEach(function(pocket) {
                    var bestShot = self.getCueVelocityToBall(cue, ball, pocket);
                    if (Math.abs(bestShot.theta - (Math.PI / 2)) < bestTheta) {
                        bestTheta = Math.abs(bestShot.theta - (Math.PI / 2));
                        force = bestShot.force;
                    }
                });
            });

            console.log(force);
            this.gameLogic.takeShot(force);
        }

        // Alex Work
        // options = [];
        // balls.forEach(function(ball) {
        //     ballOpts = [];
        //     pockets.forEach(function(pocket) {
        //         var attempt = this.minVtoPocket();
        //         var obstacles = Matter.Query.ray(balls, {x: cue.x, y: cue.y}, attempt.newCue, ball.radius);
        //         if (obstacles.size() > 2) {
        //            ballOpts.add(attempt);
        //         }
        //     });
        //     options.add(expectimax(ballOpts));
        // });
        // this.gameLogic.takeShot(expectimax(options));
    }

    AI.prototype.minVtoPocket = function(ball, pocket) {
        var frictionConstant = ball.frictionAir;

        var distance = {x: pocket.x - ball.position.x, y: pocket.y - ball.position.y};

        // r = mv/b, v = br/m
        return {x: frictionConstant * distance.x / ball.mass, y: frictionConstant * distance.y / ball.mass};
    }

    AI.prototype.getCueForceToBall = function(cue, ball, pocket) {
        var minV2P = this.minVtoPocket(ball, pocket);

        var theta = Math.atan(minV2P.y / minV2P.x);
        var hypotenuese = 2 * ball.circleRadius;

        var contactPoint = {x: ball.position.x - hypotenuese * Math.cos(theta), y: ball.position.y - hypotenuese * Math.sin(theta)};

        // find req cue velocity
        var velocityMagnitude = Vector.magnitude(minV2P) / Math.cos(theta);
        var cueDistanceTraveled = {x: contactPoint.x - cue.position.x, y: contactPoint.y - cue.position.y};
        var velocityVector = Vector.mult(Vector.normalise(cueDistanceTraveled), velocityMagnitude);

        // find force required to impart that velocity
        var forceX = (Math.pow(velocityVector.x, 2) * ball.mass) / (2 * cueDistanceTraveled.x);
        var forceY = (Math.pow(velocityVector.y, 2) * ball.mass) / (2 * cueDistanceTraveled.y);

        var force = Vector.div({x: forceX, y: forceY}, 200);
        return {cueContact: contactPoint, force: force, theta: theta};
    }

    // node = {balls, cue, shot, children, score}
    AI.prototype.expectimax = function(node, depth) {
        if (depth == 0) {
            return node.score;
        } else {
            spawnChildren(node, depth);
        }
    }

    return AI;
});