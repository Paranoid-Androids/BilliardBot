/**
 * @file BilliardBot GUI module.
 * @author paranoid-androids@googlegroups.com
 */

define(function(require) {
    "use strict";

    /**
     * Interface for classes that can listen to events from the GUI.
     *
     * @interface
     */
    function GUIListener() {}

    /**
     * Invoked once all the balls on the GUI have stopped moving,
     * and a new turn can be made.
     */
    GUIListener.prototype.onBallsStopped = function() {
        throw new Error('abstract method');
    };

    return GUIListener;
});