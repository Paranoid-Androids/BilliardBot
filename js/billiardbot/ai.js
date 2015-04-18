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


    return AI;
});