/**
 * @file BilliardBot Game Logic module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    /**
     * @constructor
     * @exports GameLogic
     * @param gui {GUI} The GUI that this class should use.
     */
    function GameLogic(gui) {
        this.gui = gui;
    }

    /** @const */
    GameLogic.BREAK_VECTOR = {
        x: .02,
        y: 0
    };

    GameLogic.prototype.init = function() {
        this.takeShot(this.gui.getCuePosition(), GameLogic.BREAK_VECTOR);
    };

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