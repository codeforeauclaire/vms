'use strict';
/*globals Meteor, _, moment, Curl, EJSON */

import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import DigitalOceanApi from 'digital-ocean-api';
import Future from 'fibers/future';

function getApiToken(apiTokenNumber) {
	return Meteor.settings.digitalocean.apitokens[apiTokenNumber];
}
function getApi(apiTokenNumber) {
	return new DigitalOceanApi({ token: getApiToken(apiTokenNumber) });
}

function selfDestructOldServers(apiTokenNumber) {
	console.log('selfDestructOldServers(' + apiTokenNumber + ')');
	var api = getApi(apiTokenNumber);
	api.listDroplets(function(err, droplets) {
		if (err) {
			throw err;
		}
		_.each(droplets, function(droplet) {
			var hoursLive = Meteor.settings.public.serverlifespanhours;
			// Larger servers only get 1/2 the life
			if (droplet.memory !== 512) {
				hoursLive /= 2;
			}
			var key = 'created_at';
			var serverShutdownAfter = moment(droplet[key])
				.add(hoursLive, 'hours')
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

// TODO: Make this, and other stuff isomorphic; DRY
function hasSettings() {
	return (_.size(Meteor.settings.public) > 0);
}

function getSSHKeys(apiToken) {
	var fut = new Future();
	Curl.request({
		url: 'https://api.digitalocean.com/v2/account/keys',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + apiToken
		}
	}, function(err, stdout, meta) {
		if (err) {
			throw err;
		}

		// Construct id:key pair object
		var keys = {};
		var kk = 'ssh_keys';
		_.each(EJSON.parse(stdout)[kk], function(key, ii) {
			var kk = 'public_key';
			keys[key.id] = key[kk];
		});

		fut.return(keys);
	});

	return fut.wait();
}
function getSSHKeyId(apiToken, publicKey) {
	var ret = false;
	_.each(getSSHKeys(apiToken), function(pubKey, id) {
		if (pubKey === publicKey) {
			ret = id;
		}
	});
	return ret;
}
// Creates an SSH key on DigitalOcean, and returns it's DigitalOcean id
function createSSHKey(key, apiToken) {
	var data = {
		name: 'vmscustom_' +  moment().toISOString() + '_' + _.random(0, 999999)
	};
	var ii = 'public_key';
	data[ii] = key;
	var fut = new Future();
	Curl.request({
		url: 'https://api.digitalocean.com/v2/account/keys',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + apiToken
		},
		data: JSON.stringify(data)
	}, function(err, stdout, meta) {
		if (err) {
			console.log('Error creating SSH key: Returned error');
			console.log(err);
			return fut.throw(err);
		}
		var ii = 'ssh_key';
		if (!stdout || !stdout[ii] || !stdout[ii].id) {
			console.log('Error creating SSH key: Returned no key');
			console.log(stdout);
			return fut.throw('cant-find-key-id');
		}
		return fut.return(stdout[ii].id);
	});

	return fut.wait();
}

Meteor.startup(() => {
	if (!hasSettings()) {
		return false;
	}
	selfDestructOldServersAllApiTokens();

	// Self destruct old servers every 10 minutes
	setInterval(selfDestructOldServersAllApiTokens, 10 * 60 * 1000);
});

Meteor.methods({
	'spinUpNewVM': function(size, publicKey) {
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
			// Set users public key if it was passed
			if (publicKey) {
				console.log('* publicKey passed');
				var sshKeyId = getSSHKeyId(getApiToken(apiTokenNumber), publicKey);
				if (!sshKeyId) {
					console.log(' * createSSHKey(' + apiTokenNumber + ')');
					sshKeyId = createSSHKey(publicKey, getApiToken(apiTokenNumber));
				}
				console.log(' * SSHKeyID: ' + sshKeyId);
				var kk = 'ssh_keys';
				requestBody[kk] = [ sshKeyId ];
			}

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
