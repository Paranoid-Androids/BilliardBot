/**
 * @file BilliardBot Game Logic module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    function GameLogic(gui) {
        this.gui = gui;
    }

    GameLogic.BREAK_VECTOR = {
        x: .02,
        y: 0
    };

    GameLogic.prototype.init = function() {
        this.takeShot(this.gui.getCuePosition(), GameLogic.BREAK_VECTOR);
    };

    GameLogic.prototype.takeShot = function(position, vector) {
        this.gui.takeShot(position, vector);
    };

    GameLogic.prototype.takeNextTurn = function() {
        console.log("next turn!");
    };

    return GameLogic;
});