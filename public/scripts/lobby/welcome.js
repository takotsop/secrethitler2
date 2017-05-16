'use strict';

require('styles/lobby/welcome');

var $ = require('jquery');

var CommonValidate = require('common/validate');

var Config = require('util/config');
var Data = require('util/data');
var Util = require('util/util');

var App = require('ui/app');
var Chat = require('ui/chat');

var Socket = require('socket/socket');

//LOCAL

var submittedEmail;

//PUBLIC

var hideWelcomeSplash = function() {
	$('#welcome-splash').hide();
	$('#welcome-signin').show();
};

var showSignin = function() {
	Data.uid = null;
	Data.auth = null;
	Util.storage('uid', null);
	Util.storage('auth', null);

	$('.input-error').hide();

	App.showSection('welcome');

	$('#s-signin-email').show();
	$('#s-signin-passkey').hide();
	$('#s-signin-username').hide();

	$('#i-signin-email').focus();

	if (Config.TESTING && (!Config.manual && Util.storage('manual') == null)) {
		setTimeout(function() {
			$('#start-playing').click();
			$('#guest-signin').click();
			$('#i-signin-email').focus();
		}, 200);
	}

	$('#voice-unsupported').toggle(!Chat.supportsVoice());
};

var finishSignin = function(response) {
	$('.input-signin').blur();
	$('#welcome-signin').hide();

	Data.uid = response.id;
	Data.auth = response.auth_key;
	Util.storage('uid', Data.uid);
	Util.storage('auth', Data.auth);
};

var signinError = function(name, errorText) {
	var inputElement = $('#i-signin-'+name);
	var inputError = inputElement.next('.input-error');
	var hasError = errorText != null;
	inputError.toggle(hasError);

	if (hasError) {
		inputElement.focus();
		if (errorText !== true) {
			inputError.text(errorText + '. Please try again.');
		}
	}

	$('#s-signin-'+name).show();

	return hasError;
};

var checkSigninError = function(name, rawValue) {
	var processedValue = CommonValidate[name+'Process'](rawValue);
	if (processedValue != rawValue) {
		$('#i-signin-'+name).val(processedValue);
	}
	var errorText = CommonValidate[name](processedValue);
	return signinError(name, errorText);
};

//GUEST

$('#guest-signin').on('click', function() {
	Socket.emit('guest signin', null, finishSignin);
});

//EMAIL

var signinEmail = function(email) {
	email = email.trim();
	if (checkSigninError('email', email)) {
		return;
	}

	$('.sd-signin').hide();
	Socket.emit('signin email', {email: email}, function(response) {
		if (response.error) {
			signinError('email', response.error);
		} else {
			submittedEmail = response.email;
			if (submittedEmail) {
				$('.signin-email-address').text(submittedEmail);
			}
			if (response.register) {
				$('#s-signin-username').show();
				$('#i-signin-username').focus();
			} else if (response.signin) {
				$('#s-signin-passkey').show();
				$('#i-signin-passkey').focus();
			} else {
				$('#s-signin-email').show();
				$('#i-signin-email').focus();
			}
		}
	});
};

//PASSKEY

var signinPasskey = function(passkey) {
	if (checkSigninError('passkey', passkey)) {
		return;
	}

	$('.sd-signin').hide();
	Socket.emit('signin passkey', {email: submittedEmail, pass: passkey}, function(response) {
		if (response.error) {
			signinError('passkey', response.error);
		} else {
			finishSignin(response);
		}
	});
};

//REGISTER

var signinRegister = function(username) {
	username = CommonValidate.usernameProcess(username);
	$('#i-signin-username').val(username);

	if (checkSigninError('username', username)) {
		return;
	}

	$('.sd-signin').hide();
	Socket.emit('signin name', {email: submittedEmail, name: username}, function(response) {
		if (response.error) {
			signinError('username', response.error);
		} else {
			finishSignin(response);
		}
	});
};

//EVENTS

$('#start-playing').on('click', function() {
	hideWelcomeSplash();
});

$('.signin-restart').on('click', function() {
	$('.sd-signin').hide();
	$('#s-signin-email').show();
	$('#i-signin-email').focus();
});

$('#signin-start-form').on('submit', function(event) {
	event.preventDefault();

	var submitted = $('#i-signin-email').val();
	signinEmail(submitted);
});

$('input.input-signin').on('keypress', function(event) {
	var keyPressed = event.which || event.keyCode;
	if (keyPressed != 13) {
		return true;
	}
	if (!$(this).hasClass('error')) {
		var submitted = this.value;
		if (this.id == 'i-signin-email') {
			signinEmail(submitted);
		} else if (this.id == 'i-signin-passkey') {
			signinPasskey(submitted);
		} else if (this.id == 'i-signin-username') {
			signinRegister(submitted);
		}
	}
	return false;
});

//PUBLIC

module.exports = {

	hideSplash: hideWelcomeSplash,

	showSignin: showSignin,

};
