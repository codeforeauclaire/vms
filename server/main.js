'use strict';
import { Meteor } from 'meteor/meteor';
import DigitalOceanApi from 'digital-ocean-api';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
	'spinUpNewVM': function() {
		console.log('spin it');
		console.log(Meteor.settings.digitalocean.apitoken);
		var api = new DigitalOceanApi({
			token: Meteor.settings.digitalocean.apitoken
		});
		Meteor._sleepForMs(2000);
		var requestBody = {
			name: 'test',
			region: 'nyc3',
			size: '512mb',
			image: 'ubuntu-14-04-x64',
			'ssh_keys': null,
			backups: false,
			ipv6: false,
			'user_data': null,
			'private_networking': null
		};
		api.createDroplet(requestBody, function(err, data) {
			if (err) {
				return false;
			}
			return data;
		});
	}
});
