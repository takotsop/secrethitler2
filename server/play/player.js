'use strict';

var Socket = require.main.require('./server/connect/io');

var uniquePlayers = {};
var playersData = {};

var privateRoomName = function(uid) {
	return 'pr' + uid;
};

module.exports = {

	add: function(uid, socket) {
		socket.join(privateRoomName(uid));
		uniquePlayers[uid] = socket;

		if (!playersData[uid]) {
			playersData[uid] = {};
			return true;
		}
	},

	remove: function(uid) {
		delete uniquePlayers[uid];
		delete playersData[uid];
	},

	all: function() {
		return uniquePlayers;
	},

	emitTo: function(uid, name, data) {
		Socket.to(privateRoomName(uid)).emit(name, data);
	},

	data: function(uid, key, value) {
		var playerData = playersData[uid];
		if (!playerData) {
			console.log('Invalid uid', uid, key, value);
			return;
		}
		if (value === undefined) {
			return playerData[key];
		}
		if (value === null) {
			delete playerData[key];
		} else {
			playerData[key] = value;
		}
	},

	setGame: function(socket, game) {
		socket.game = game;
		this.data(socket.uid, 'gid', game ? game.gid : null);
		if (!game) {
			this.data(socket.uid, 'joining', null);
		}
	},

};
