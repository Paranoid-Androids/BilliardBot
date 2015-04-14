GameLogic = new function() {
	var BREAK_VECTOR = {x: .02, y: 0};

	this.init = function() {
		GUI.init();
		this.takeShot(GUI.getCuePosition(), BREAK_VECTOR);
	}

	this.takeShot = function(position, vector) {
		GUI.takeShot(position, vector);
	}

	this.takeNextTurn = function() {
		console.log("next turn!");
	}
}