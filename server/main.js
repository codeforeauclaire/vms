'use strict';
/*globals Meteor, _, moment*/

import { Meteor } from 'meteor/meteor';
import DigitalOceanApi from 'digital-ocean-api';
import Future from 'fibers/future';

function getApi(apiTokenNumber) {
	var token = Meteor.settings.digitalocean.apitokens[apiTokenNumber];
	return new DigitalOceanApi({ token: token });
}

function selfDestructOldServers(apiTokenNumber) {
	console.log('selfDestructOldServers(' + apiTokenNumber + ')');
	var api = getApi(apiTokenNumber);
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

function selfDestructOldServersAllApiTokens() {
	_.each(Meteor.settings.digitalocean.apitokens, function(apitoken, apiTokenNumber) {
		selfDestructOldServers(apiTokenNumber);
	});
}

Meteor.startup(() => {
	selfDestructOldServersAllApiTokens();

	// Self destruct old servers every 10 minutes
	setInterval(selfDestructOldServersAllApiTokens, 10 * 60 * 1000);
});

Meteor.methods({
	'spinUpNewVM': function(size) {
		if ( (size !== '512mb') && (size !== '1gb') ) {
			throw new Error('invalid-input', 'Only 512mb and 1gb sizes allowed');
		}
		console.log('spinUpNewVM');
		var requestBody = {
			name: 'vms-virtual-machine',
			region: 'nyc3',
			size: size,
			image: 'ubuntu-14-04-x64',
			backups: false,
			ipv6: false,
			'ssh_keys': [ Meteor.settings.public.sshkey.fingerprint ],
			'user_data': null,
			'private_networking': null
		};

		var fut = new Future();

		// Call recursively returning in the future when successful or final failure
		var create = function(apiTokenNumber) {
			console.log('* create(' + apiTokenNumber + ')');
			// TOKEN-AND-FINGERPRINT-TESTER
			// * Uncomment and tweak number to test different DigOcean apiTokenNumber
			/*
			if (apiTokenNumber < 1) {
				return create(apiTokenNumber + 1);
			}
			*/

			var api = getApi(apiTokenNumber);
			api.createDroplet(requestBody, function(err, data) {
				if (err) {
					console.log(err);
					// Problem creating a droplet. If we have another DO token / account, try it.
					if (Meteor.settings.digitalocean.apitokens.length > (apiTokenNumber + 1)) {
						return create(apiTokenNumber + 1);
					}
					return fut.throw(err);
				}
				// TODO: Abstract this tagging on on apiTokenNumber as used in a all methods?
				data.apiTokenNumber = apiTokenNumber;
				return fut.return(data);
			});
		};
		create(0);

		return fut.wait();
	},
	'getVmInfo': function(serverId, apiTokenNumber) {
		console.log('getVmInfo(' + serverId + ',' + apiTokenNumber + ')');
		var api = getApi(apiTokenNumber);
		var fut = new Future();
		api.getDroplet(serverId, function(err, data) {
			if (err) {
				return fut.throw(err);
			}
			data.apiTokenNumber = apiTokenNumber;
			fut.return(data);
		});
		return fut.wait();
	},
	'destroyOldVM': function(serverId, apiTokenNumber) {
		console.log('destroyOldVM(' + serverId + ',' + apiTokenNumber + ')');
		var api = getApi(apiTokenNumber);
		var fut = new Future();
		api.deleteDroplet(serverId, function(err, data) {
			if (err) {
				return fut.throw(err);
			}
			data.apiTokenNumber = apiTokenNumber;
			fut.return(data);
		});
		return fut.wait();
	}
});
