'use strict';

var Config = require.main.require('./server/tools/config');
var SendGrid = require('sendgrid')(Config.SENDGRID_API_KEY);

module.exports = {

	sendPasskey: function(name, email, passcode) {
		var appName = 'Secret Hitler Online';
		var passcodeMail = new SendGrid.Email({
			to: email,
			from: 'hello@secrethitler.online',
			subject: passcode,
			text: ' ',
			html: ' ',
		});
		passcodeMail.setSubstitutions({
			':app': [appName, appName],
			':name': [name],
			':passcode': [passcode, passcode]
		});
		passcodeMail.setFilters({
			'templates': {
				'settings': {
					'enable': 1,
					'template_id': '4784414d-60fd-4d66-8fc8-e0b46053d986',
				}
			}
		});

		SendGrid.send(passcodeMail, function(err, json) {
			if (err) {
				console.error('sendPasskey', err);
			}
		});
	},

};
