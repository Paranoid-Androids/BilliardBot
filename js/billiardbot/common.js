/**
 * @file Main BilliardBot module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    /** @exports Common */
    var common = {};

    /**
     * Enum for the type of game we're playing.
     * @enum {string}
     */
    common.GameType = {
        /** Allows us to configure various parts of the table to write tests. */
        TESTS: 'TESTS',
        /** Basic game of pool where the AI plays by itself. */
        SINGLE_AI: 'Single AI Game',
        /** Two AIs play against each other. */
        DOUBLE_AI: 'Two-player AI Game'
    };

    /**
     * Starts a new pool game in the given container.
     * @param container {!Element} The container that contains the pool table.
     * @param gameType {!common.GameType} The type of game we're playing.
     * @param debugParams {?object} Additional parameters to specify.
     */
    common.startGame = function(canvas, gameType, debugParams) {
        console.log('Starting a new pool game: ' + gameType);

        var GUI = require('gui');
        var GameLogic = require('gamelogic');
        var AI = require('ai');

        var gui = new GUI(canvas);
        var gameLogic = new GameLogic(gui, gameType);
        gui.setListener(gameLogic);

        switch (gameType) {
            case common.GameType.SINGLE_AI:
                var ai = new AI(gameLogic);
                break;
            case common.GameType.SINGLE_AI:
                var ai0 = new AI(gameLogic);
                var ai1 = new AI(gameLogic);
                break;
            default:
                console.error('Unknown game type!')
        }

        gui.init();
        gameLogic.init();
    };

    return common;
});