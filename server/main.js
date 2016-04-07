'use strict';
/*globals Meteor, _, moment*/

import { Meteor } from 'meteor/meteor';
import DigitalOceanApi from 'digital-ocean-api';
import Future from 'fibers/future';

function getApi(ii) {
	return new DigitalOceanApi({
		token: Meteor.settings.digitalocean.apitoken[ii]
	});
}

function selfDestructOldServers() {
	console.log('selfDestructOldServers(...)');
	var api = getApi(0);
	api.listDroplets(function(err, droplets) {
		if (err) {
			throw err;
		}
		_.each(droplets, function(droplet) {
			var key = 'created_at';
			var serverShutdownAfter = moment(droplet[key])
				.add(Meteor.settings.public.serverlifespanhours, 'hours')
				.subtract(20, 'minutes');
			var pastShutdownAfter = (moment().diff(serverShutdownAfter) > 0);

			// Delete old servers with our name
			if (pastShutdownAfter && (droplet.name === 'vms-virtual-machine')) {
				api.deleteDroplet(droplet.id, function(err, data) {
					if (err) {
						console.log('Problem shutting down droplet #' + droplet.id);
						console.log(err);
					} else {
						console.log('Shut down droplet #' + droplet.id);
					}
				});
			}
		});
	});
}

Meteor.startup(() => {
	selfDestructOldServers();

	// Self destruct old servers every 10 minutes
	setInterval(selfDestructOldServers, 10 * 60 * 1000);
});

Meteor.methods({
	'spinUpNewVM': function() {
		console.log('spinUpNewVM');
		var api = getApi(0);
		var requestBody = {
			name: 'vms-virtual-machine',
			region: 'nyc3',
			size: '512mb',
			image: 'ubuntu-14-04-x64',
			'ssh_keys': [ Meteor.settings.public.sshkey.fingerprint ],
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
		var api = getApi(0);
		var fut = new Future();
		api.getDroplet(serverId, function(err, data) {
			if (err) {
				return fut.throw(err);
			}
			fut.return(data);
		});
		return fut.wait();
	},
	'destroyOldVM': function(serverId) {
		console.log('destroyOldVM:' + serverId);
		var api = getApi(0);
		var fut = new Future();
		api.deleteDroplet(serverId, function(err, data) {
			if (err) {
				return fut.throw(err);
			}
			fut.return(data);
		});
		return fut.wait();
	}
});
