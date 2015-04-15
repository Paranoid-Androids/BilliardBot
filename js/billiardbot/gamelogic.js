/**
 * @file BilliardBot Game Logic module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    var GUI = require('gui');
    var GUIListener = require('guilistener');

    /**
     * Constructs a new GameLogic.
     * @class
     * @implements GUIListener
     * @exports GameLogic
     * @param gui {GUI} The GUI that this class should use.
     */
    function GameLogic(gui) {
        this.gui = gui;
    }

    /**
     * The break vector.
     * @const {x: number, y: number}
     */
    GameLogic.BREAK_VECTOR = {
        x: .02,
        y: 0
    };

    /**
     * Initializes the game logic.
     */
    GameLogic.prototype.init = function() {
        // TODO: replace this with something else.
        this.takeShot(this.gui.getCuePosition(), GameLogic.BREAK_VECTOR);
    };

    /** @override */
    GameLogic.prototype.onBallsStopped = function() {
        this.takeNextTurn();
    }

    /**
     * Takes a shot.
     * @param position {*} The position.
     * @param vector {*} The vector.
     */
    GameLogic.prototype.takeShot = function(position, vector) {
        this.gui.takeShot(position, vector);
    };

    /**
     * Takes the next turn.
     */
    GameLogic.prototype.takeNextTurn = function() {
        this.takeShot(this.gui.getCuePosition(), GameLogic.BREAK_VECTOR);
    };

    return GameLogic;
});