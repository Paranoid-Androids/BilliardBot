define(function(require) {
    "use strict";

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

        balls.forEach(function(ball) {
            pockets.forEach(function(pocket) {

            });
        });
        this.gameLogic.takeShot(AI.BREAK_VECTOR);
    }

    AI.prototype.minVtoPocket = function(ball, pocket) {
        var frictionConstant = ball.frictionAir;

        var distance = {x: pocket.x - ball.position.x , y: pocket.y - ball.position.y};

        // r = mv/b, v = br/m
        var vel = (x: frictionConstant * distance.x / ball.mass, y: frictionConstant * distance.y / ball.mass);
    }


    AI.prototype.getTheta = function(cue, ball, pocket) {
        var minV = this.minVtoPocket(ball, pocket);
    }

    AI.prototype.getVectorCueToBall = function(cue, ball) {
    }


    return AI;
});