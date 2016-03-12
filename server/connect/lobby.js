'use strict';

var DB = require.main.require('./server/tools/db');
var Utils = require.main.require('./server/tools/utils');

var Game = require.main.require('./server/play/game');

//LOCAL

var openNewGameFor = function(startSocket, size, isPrivate) {
	new Game(null, size, isPrivate, startSocket);
};

var joinGameById = function(socket, gid) {
	var oldGame = socket.game;
	if (!oldGame || oldGame.finished) {
		var game = Game.get(gid);
		if (game) {
			if (game.started) {
				return 'started';
			}
			if (game.isFull()) {
				return 'full';
			}
			if (game.isOpen()) {
				game.addPlayer(socket);
				return true;
			}
		}
	}
	return false;
};

var joinOngoingGame = function(socket) {
	var oldGame = socket.game;
	if (oldGame && !oldGame.finished) {
		oldGame.addPlayer(socket);
		return true;
	}
};

var joinAvailableGame = function(socket) {
	var games = Game.games();
	for (var gidx in games) {
		var game = games[gidx];
		if (!game.private && game.isOpen()) {
			game.addPlayer(socket);
			return true;
		}
	}
	openNewGameFor(socket, 10, false);
	return true;
};

var leaveOldGame = function(socket) {
	var oldGame = socket.game;
	if (oldGame) {
		oldGame.disconnect(socket);
	}
};

//PUBLIC

module.exports = function(socket) {

	socket.on('lobby join', function(data, callback) {
		leaveOldGame(socket);
		Game.emitLobby(socket);

		if (!joinOngoingGame(socket)) {
			if (!data || !data.join || joinGameById(socket, data.join) == false) {
				socket.join('lobby');
			}
		}
	});

	socket.on('lobby afk', function(data, callback) {
		if (socket.game) {
			socket.game.resetAutostart();
		}
	});

	socket.on('room create', function(data, callback) {
		leaveOldGame(socket);

		var gameMaxSize = Utils.rangeCheck(data.size, 5, 10, 10);
		openNewGameFor(socket, gameMaxSize, data.private);
	});

	socket.on('room quickjoin', function(data, callback) {
		if (!joinOngoingGame(socket)) {
			var response = {};
			if (joinAvailableGame(socket)) {
				response.success = true;
			}
			callback(response);
		}
	});

	socket.on('room join', function(data, callback) {
		var response = {};
		var gid = data.gid;
		if (!gid) {
			response.error = 'Invalid game code';
		} else {
			var joined = joinGameById(socket, data.gid);
			if (joined == 'full') {
				response.error = 'Game full';
			} else if (joined == 'started') {
				response.error = 'Game started';
			} else if (joined == true) {
				response.success = true;
			} else {
				response.error = 'Game not found';
			}
		}
		callback(response);
	});

	socket.on('feedback', function(data, callback) {
		DB.insert('feedback', {user_id: socket.uid, report_type: data.type, feedback: data.body}, null, callback);
	});

};
