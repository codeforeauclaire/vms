'use strict';
import { Meteor } from 'meteor/meteor';
import DigitalOceanApi from 'digital-ocean-api';
import Future from 'fibers/future';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
	'spinUpNewVM': function() {
		console.log('spingUpNewVM');
		var api = new DigitalOceanApi({
			token: Meteor.settings.digitalocean.apitoken
		});
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

		var fut = new Future();

		api.createDroplet(requestBody, function(err, data) {
			if (err) {
				return fut.throw(err);
			}
			fut.return(data);
		});

		return fut.wait();
	},
	'getVmInfo': function(serverId) {
		console.log('getVmInfo:' + serverId);
		var api = new DigitalOceanApi({
			token: Meteor.settings.digitalocean.apitoken
		});
		var fut = new Future();
		api.getDroplet(serverId, function(err, data) {
			if (err) {
				return fut.throw(err);
			}
			fut.return(data);
		});
		return fut.wait();
	}
});
