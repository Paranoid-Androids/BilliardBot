/**
 * @file BilliardBot Game Logic module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    var GUIListener = require('guilistener');
    var Matter = require('third_party/matter');
    var Common = Matter.Common;


    /**
     * Constructs a new GameLogic.
     * @class
     * @implements GUIListener
     * @exports GameLogic
     * @param gui {GUI} The GUI that this class should use.
     */
    function GameLogic(gui) {
        this.gui = gui;
        this.ballsSunk = [];
        this.players = [];
        this.currentPlayer = 0;
        this.goAgain = false;
        this.initialBreak = true;
        this.scratched = 0;
        this.SPECIAL_BALL = 8;
    }

    /**
     * The list of colors for each ball.
     * @const {Array.<string>}
     */
    GameLogic.BALL_COLORS = ["yellow", "blue", "red", "purple", "orange", "green", "maroon",
        "black",
        "LemonChiffon", "SkyBlue", "Tomato", "MediumPurple", "LightSalmon", "LightGreen", "IndianRed"
    ];

    /**
     * holds the different sets of balls [solid, stripe]
     */
    GameLogic.BALL_SETS = [[1, 2, 3, 4, 5, 6, 7], [9, 10, 11, 12, 13, 14, 15], [8]];

    GameLogic.BALL_LABEL_PREFIX = "ball-";

    /**
     * Initializes the game logic.
     */
    GameLogic.prototype.init = function() {
        if (this.players.length > 0 && this.players.length <= 2) {
            this.notifyPlayer();
            this.initialBreak = false;
        }
        else {
            return new Error("Invalid amount of players!");
        }
    };

    /**
     * Creates a list of balls in the order that they will be racked. This
     * ensures the 8 ball will be in the middle, the bottom left will have a
     * solid and the bottom right will have a stripe, and the rest will be
     * randomly placed.
     */
    GameLogic.prototype.createInitialBallList = function() {
        var ballList = [];
        var solidBalls = GameLogic.BALL_SETS[0].slice();
        var stripeBalls = GameLogic.BALL_SETS[1].slice();

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
        if (this.scratched && this.specialSink) {
            this.playerLose();
            return;
        }
        else if (this.scratched){
            this.onScratch();
        }
        else if (this.specialSink){
            this.playerWin();
            return;
        }
        this.scratched = 0;
        this.specialSink = 0;
        this.takeNextTurn();
    }

    GameLogic.prototype.onScratch = function() {
        //TODO we should ask the AI agent to place the cue ball in a smart location
        // for now, we'll just place it back in the same spot that we broke
        this.gui.placeCue();
        var self = this;
        // return a ball belonging to the scratcher
        var returnPlayersBall = this.currentPlayer;

        console.log("Player " + returnPlayersBall + " scratched!");

        self.ballsSunk.forEach(function(ball){
            var ballNum = self.getBallNumber(ball);
            self.BALL_SETS[self.getCurrentPlayer().ballSet].forEach(function(tryNum){
                if (ballNum == tryNum) {
                    gui.placeBall(ball, {x: 3 * GUI.WIDTH / 4, y: GUI.HEIGHT / 2});
                    self.ballsSunk.splice(self.ballsSunk.indexOf(ball), 1);
                    console.log("Returning " + ballNum + " to player " + returnPlayersBall);
                    self.gui.ballsSunk.innerHTML += self.getBallNumber(ball) + " replaced, ";
                    return;
                }
            });
        });
        console.log("No balls to return to player " + returnPlayersBall);
        return;
    }

    GameLogic.prototype.ballSunk = function(ball) {
        var self = this;
        var ballNum = this.getBallNumber(ball);
        console.log("ball " + ballNum + " sunk!");

        if (ballNum == 0) {
            this.scratched = 1;
        }
        else if (ballNum == this.SPECIAL_BALL) {
            console.log("sunk "+this.SPECIAL_BALL+" ball!");
            this.specialSink = 1;
        }
        else {
            GameLogic.BALL_SETS.forEach(function(set){
                if (set.indexOf(ballNum) != -1) {
                    var player = self.getCurrentPlayer();
                    var setIndex = GameLogic.BALL_SETS.indexOf(set);
                    if (player.ballSet === undefined) {
                        self.assignBalls(player, setIndex);
                    }
                    
                    if (player.ballSet == setIndex){
                        console.log("sunk my ball!");
                        self.goAgain = true;
                    }
                    else {
                        console.log("sunk opponent ball!");
                    }
                    set.splice(set.indexOf(ballNum), 1);
                }
            });

            self.ballsSunk.push(ball);
            self.gui.ballsSunk.innerHTML += self.getBallNumber(ball) + " sunk, ";
            
            if(self.getMyBalls(self.getCurrentPlayer()).length == 0) {
                self.getCurrentPlayer().ballSet = 3;
            }
        }
    }

    /**
     * gets the ball number from the ball's label
     * the cue ball has a number of 0
     */
    GameLogic.prototype.getBallNumber = function(ball) {
        if (ball.label.indexOf(GameLogic.BALL_LABEL_PREFIX) == 0) {
            var ballNumberString = ball.label.substring(GameLogic.BALL_LABEL_PREFIX.length);
            if (ballNumberString == "cue") {
                return 0;
            }
            return parseInt(ballNumberString);
        }
    }

    /**
     * registers an AI agent with the system
     */
    GameLogic.prototype.registerPlayer = function(player) {
        this.players.push(player);
    }

    /**
     * Takes a shot.
     * @param vector {*} The vector.
     */
    GameLogic.prototype.takeShot = function(vector) {
        this.gui.takeShot(this.gui.getCue().position, vector);
    };

    GameLogic.prototype.takeShot2 = function(vector, ball) {
        this.gui.takeShot2(ball, ball.position, vector);  
    }


    GameLogic.prototype.getCue = function() {
        return this.gui.getCue();
    }

    /**
     * Takes the next turn.
     */
    GameLogic.prototype.takeNextTurn = function() {
        if (!this.goAgain) {
           this.incrementPlayer();
        }
        else {
            this.goAgain = false;
        }
        this.notifyPlayer();
    };

    GameLogic.prototype.incrementPlayer = function() {
        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
    }

    GameLogic.prototype.notifyPlayer = function() {
        console.log("Notifying player " + this.currentPlayer + " to make a move");
        this.gui.updateCurrentPlayer(this.currentPlayer);
        this.getCurrentPlayer().makeMove();
    }

    GameLogic.prototype.getCurrentPlayer = function() {
        return this.players[this.currentPlayer];
    }

    GameLogic.prototype.assignBalls = function(player, setIndex) {
        player.ballSet = setIndex;
        var otherIndex = (setIndex + 1) % GameLogic.BALL_SETS.length;
        console.log(setIndex);
        console.log(otherIndex);
        for (var i = 0; i < this.players.length; i++) {
            if (this.currentPlayer != i) {
                this.players[i].ballSet = otherIndex;
            }
        }

    }

    GameLogic.prototype.getMyBalls = function(player) {
        var self = this;
        var ballsOnTable = this.gui.getBallsOnTable();
        var myBallNumbers = [];
        var myBalls = [];
        if (player.ballSet === undefined) {
            myBallNumbers = myBallNumbers.concat.apply(myBallNumbers, GameLogic.BALL_SETS);
        }
        else {
            myBallNumbers = GameLogic.BALL_SETS[player.ballSet];
        }

        ballsOnTable.forEach(function(ball) {
            if (myBallNumbers.indexOf(self.getBallNumber(ball)) != -1) {
                myBalls.push(ball);
            }
        });
        return myBalls;
    }

    GameLogic.prototype.getBallsOnTable = function() {
        return this.gui.getBallsOnTable();
    }

    GameLogic.prototype.getPockets = function() {
        return this.gui.getPockets();
    }

    /**
     * determines whether the current player has won or lost
     */
    GameLogic.prototype.endGame = function() {
        var player = this.getCurrentPlayer();
        var playersBalls  = this.getMyBalls(player);
        if (playersBalls.length == 0) {
            console.log("Player: " + this.currentPlayer + " wins!");
        }
        else {
            console.log("Player: " + this.currentPlayer + " lost!");
        }
        this.gui.endGame();
    }

    GameLogic.prototype.playerLose = function() {
        var player = this.getCurrentPlayer();
        console.log("Player: " + this.currentPlayer + " lost!");
        this.gui.endGame();
    }

    GameLogic.prototype.playerWin = function() {
        var player = this.getCurrentPlayer();
        console.log("Player: " + this.currentPlayer + " Won!");
        this.gui.endGame();
    }

    return GameLogic;
});