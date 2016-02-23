var Utils = require.main.require('./tools/utils');

var allPlayers = {};

var Player = function(socket, uid, name, oldPlayer) {
	this.uid = uid;
	this.name = name;

	if (oldPlayer) {
		this.game = oldPlayer.game;
	}

	allPlayers[uid] = this;

	// Emit

	this.emit = function(name, data) {
		socket.emit(name, data);
	};

	this.emitStartPerspective = function() {
		socket.emit('lobby game data', this.game.gameData(this.uid));
	};

	this.emitToOthers = function(name, data) {
		socket.broadcast.to(this.game.gid).emit(name, data);
	};

	this.emitAction = function(name, data) {
		return this.game.emitAction(name, data);
	};

	// Helpers

	this.equals = function(data) {
		return this.uid == data.uid;
	};

	this.gamePlayer = function(socket) {
		return this.game ? this.game.players[this.gameState().index] : null;
	};

	this.getParty = function(socket) {
		return this.gameState().allegiance == 0 ? 0 : 1;
	};

	this.isPresident = function() {
		return this.gameState().index == this.game.presidentIndex;
	};

	this.isChancellor = function() {
		return this.uid == this.game.turn.chancellor;
	};

	this.isHitler = function() {
		return this.game.isHitler(this.uid);
	};

	this.kill = function(quitting) {
		return this.game.kill(this, quitting);
	};

	this.gameState = function() {
		return this.game ? this.game.playerState[this.uid] : {};
	};

	this.leaveCurrentGame = function() {
		if (this.game) {
			return this.game.disconnect(socket);
		}
	};

	return this;
};

Player.get = function(uid) {
	return allPlayers[uid];
};

module.exports = Player;
