define(function(require) {
    "use strict";

    var Matter = require('third_party/matter');
    var Vector = Matter.Vector;
    var Query = Matter.Query;
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
        if (this.gameLogic.initialBreak) {
            this.gameLogic.takeShot(AI.BREAK_VECTOR);
        }
        else {
            
            var startNode = {balls: this.gameLogic.getMyBalls(this), cue: this.gameLogic.getCue()};
            var bestShot = this.expectimax(startNode, 1, 0);
            var force = bestShot.action.force;
            this.gameLogic.takeShot(force);
        }
    }

    AI.prototype.legalActions = function(balls, cue) {
        var self = this;
        var pockets = this.gameLogic.getPockets();
        var actions = [];

        balls.forEach(function(ball) {
            var bestTheta = Math.PI / 2;
            var bestShot;
            var totalObstacles = balls.length; //set to be the number of balls as an upper bound
            pockets.forEach(function(pocket) {
                var currentShot = self.getCueForceToBall(cue, ball, pocket);
                var thetaToBall = self.getThetaToBall(cue, ball);
                var numberOfObstacles = self.getObstacleCount(cue, currentShot.cueContact, ball, pocket);

                var deltaTheta = Math.abs(currentShot.theta - thetaToBall);

                if (deltaTheta < (Math.PI / 2)) {

                    // number of obstacles is > 0 but <= totalObstacles
                    // take the better theta value
                    if (numberOfObstacles > 0 && numberOfObstacles <= totalObstacles) {
                        if (deltaTheta < bestTheta) {
                                bestTheta = deltaTheta;
                                bestShot = currentShot;
                                totalObstacles = numberOfObstacles;
                            }
                    }
                    else if (numberOfObstacles == 0){
                        // there are no obstacles, and the current best shot has obstacles
                        // automatically take this new shot
                        if (totalObstacles != 0) {
                            totalObstacles = 0;
                            bestTheta = deltaTheta;
                            bestShot = currentShot;
                        }
                        // no obstacles, but the current shot also has no obstacles
                        // only take a better theta value
                        else {
                            if (deltaTheta < bestTheta) {
                                bestTheta = deltaTheta;
                                bestShot = currentShot;
                            }
                        }
                    }
                }
            });
            actions.push({
                ball: ball,
                force: bestShot.force,
                deltaTheta: bestTheta,
                theta: bestShot.theta,
                newCue: bestShot.cueFinal,
                obstacles: totalObstacles
            });
        });

        console.log("shooting at: " + shootingAtBall.label + " " + shootingAtBall.render.fillStyle + "-" + shootingAtBall.render.strokeStyle);
        this.gameLogic.takeShot(force);
        return actions;
    }

    AI.prototype.minVtoPocket = function(ball, pocket) {
        var frictionConstant = ball.frictionAir;

        var distance = {x: pocket.target.x - ball.position.x, y: pocket.target.y - ball.position.y};

        // r = mv/b, v = br/m
        return {x: frictionConstant * distance.x / ball.mass, y: frictionConstant * distance.y / ball.mass};
    }

    AI.prototype.getCueForceToBall = function(cue, ball, pocket) {
        var minV2P = this.minVtoPocket(ball, pocket);

        var theta = Math.atan2(minV2P.y, minV2P.x);
        var hypotenuese = 2 * ball.circleRadius;

        var contactPoint = {x: ball.position.x - hypotenuese * Math.cos(theta), y: ball.position.y - hypotenuese * Math.sin(theta)};

        // find req cue velocity
        var velocityMagnitude = Vector.magnitude(minV2P) / Math.cos(theta);
        var cueDistanceTraveled = {x: contactPoint.x - cue.position.x, y: contactPoint.y - cue.position.y};
        var velocityVector = Vector.mult(Vector.normalise(cueDistanceTraveled), velocityMagnitude);

        // find force required to impart that velocity
        var forceX = (Math.pow(velocityVector.x, 2) * ball.mass) / (2 * cueDistanceTraveled.x);
        var forceY = (Math.pow(velocityVector.y, 2) * ball.mass) / (2 * cueDistanceTraveled.y);

        var force = {x: forceX, y: forceY};
        force = Vector.mult(Vector.normalise(force), 0.01);
        return {cueContact: contactPoint, force: force, theta: theta, cueFinal: this.getCueBallPosition( cue, ball, theta, velocityMagnitude )};
    }
    
    AI.prototype.getCueBallPosition = function(cue,ball,theta,velocityMagnitude){
        var veloctiyCueBall = velocityMagnitude * Math.cos(theta);
        var distance = Math.sqrt(veloctiyCueBall) / (2 * ball.frictionAir);
        var distanceInX = (ball.position.x + distance * Math.cos(theta));
        var distanceInY = (ball.position.y + distance * Math.sin(theta));
        var cueBallPosition = {x: distanceInX , y:distanceInY};
        return cueBallPosition;
    }


    AI.prototype.getThetaToBall = function(cue, ball) {
        var distanceX = ball.position.x - cue.position.x;
        var distanceY = ball.position.y - cue.position.y;
        return Math.atan2(distanceY, distanceX);
    }

    AI.prototype.getObstacleCount = function(cue, cueContact, ball, pocket) {
        var ballsOnTable = this.gameLogic.getBallsOnTable();
        var ballIndex = ballsOnTable.indexOf(ball);
        if (ballIndex != -1) {
            ballsOnTable.splice(ballIndex, 1);
        }

        var cueIndex = ballsOnTable.indexOf(cue);
        if (cueIndex != -1) {
            ballsOnTable.splice(cueIndex, 1);
        }

        var cueToBallObstacles = Query.ray(ballsOnTable, cue.position, cueContact, ball.radius * 2);
        var ballToPocketObstacles = Query.ray(ballsOnTable, ball.position, pocket, ball.radius * 2);

        return cueToBallObstacles.length + ballToPocketObstacles.length;
    }

    AI.prototype.totalAgents = function() {
        return 2;
    }

    // node = {balls, cue}
    AI.prototype.expectimax = function(node, depth, agent) {
        var self = this;

        if (depth == 0) {//} || node.isWin() || node.isLose()) {
            return {score: this.evaluationFunction(node)};
        } else if (agent == 0) {
            // get list of best shots for each of this agents balls (legalActions)
            // for each shot...
            // generate a successor board for success (made the ball, move the cue to the new position)
            // and generate a successor board for failure(do something with the ball, move the cue to the new position)
            // accumulator += probability(successor) * expectimax(successor)
            var bestScore = -Infinity;
            var bestAction;
            this.legalActions(node.balls, node.cue).forEach(function(action) {
                var currentScore = 0;
                var successors = self.generateSuccessors(node.balls, node.cue, agent, action);
                successors.forEach(function(successor) {
                    currentScore += successor.probability * (self.expectimax(successor.node, depth - 1, successor.agent).score);
                })
                if (currentScore >= bestScore) {
                    bestScore = currentScore;
                    bestAction = action;
                }
            });

            return {score: bestScore, action: bestAction};



//             return this.legalActions[agent].reduce(function(m, k) {
//                 // TODO: memoize for performance.
//                 successor = self.generateSuccessor(agent, k);
//                 score = self.expectimax(successor, depth, (agent + 1) % self.totalAgents());
//                 if (m == null || score > m.score) {
//                     return {score: score, successor: successor}
//                 } else {
//                     return m;
//                 }

//             });
// //            spawnChildren(node, depth);
        } else {
            // actions = node.getLegalActions[agent];

            // return actions.reduce(function(m, k) {
            //     // TODO: memoize for performance.
            //     successor = self.generateSuccessor(agent, k);
            //     if (agent == self.totalAgents() - 1) {
            //         score = self.expectimax(successor, depth - 1, (agent + 1) % self.totalAgents());
            //     } else {
            //         score = self.expectimax(successor, depth, (agent + 1) % self.totalAgents());
            //     }

            //     if (m == null || score > m.score) {
            //         return {score: score, successor: successor}
            //     } else {
            //         return m;
            //     }
            // });
        }
    }

    AI.prototype.generateSuccessors = function(balls, cue, agent, action) {
        var self = this;
        var successors = [];
        var probability = 1;

        // success successor and a failure successor
        if (action.obstacles == 0) {
            var successProbability = 1 - (action.deltaTheta / (Math.PI / 2));
            probability -= successProbability;
            var newBalls = balls.slice();
            var ballIndex = newBalls.indexOf(action.ball);
            if (ballIndex != -1) {
                newBalls.splice(ballIndex, 1);
            }
            successors.push({
                probability: successProbability,
                agent: agent,
                node: {
                    balls: newBalls,
                    cue: action.newCue
                }
            });
        }

        // failure successor
        var newBalls = balls.slice();
        successors.push({
            probability: probability,
            agent: (agent + 1) % self.totalAgents(),
            node: {
                balls: newBalls,
                cue: action.newCue
            }
        });

        return successors;

    }

    /**
     * This basic function prefers less of the player's balls and more of
     * the opponent's balls.
     */ 
    AI.prototype.basicEvaluationFunction = function(node) {
        var score = 0;
        // Assuming agent #0 is this agent.
        var ballSets = node.balls;
        for (var i = 0; i < node.balls.length; i++) {
            if (i == 0) {
                score -= node.balls[0];
            } else {
                score += node.balls[i];
            }
        }
        return 5;
    }

    AI.prototype.evaluationFunction = AI.prototype.basicEvaluationFunction;

    return AI;
});