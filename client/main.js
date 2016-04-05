'use strict';
/* global Meteor */

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var getStatus = function() {
	return JSON.parse(localStorage.getItem('status'));
};
var setStatus = function(statusSetTo, reactiveStatus) {
	reactiveStatus.set(statusSetTo);
	return localStorage.setItem('status', JSON.stringify(statusSetTo));
};
var isReady = function(serverData) {
	return serverData &&
			serverData.status &&
			(serverData.status === 'active');
};
var runPoller = function(serverId, reactiveStatus) {
	var poller = setInterval(function() {
		Meteor.call('getVmInfo', serverId, function(err, result) {
			if (err) {
				setStatus(
					{
						human: 'Error getting server info'
					},
				reactiveStatus);
			}
			if (isReady(result)) {
				setStatus({ human: null, serverData: result }, reactiveStatus);
				clearInterval(poller);
			} else {
				var estimatedSecondsLeft = 45;
				var oldStatus = reactiveStatus.get();
				if (oldStatus && oldStatus.estimatedSecondsLeft) {
					estimatedSecondsLeft = oldStatus.estimatedSecondsLeft - 5;
				}
				setStatus(
					{
						estimatedSecondsLeft: estimatedSecondsLeft,
						human: 'Server info received, awaiting active status' +
							' (expected to finish within ' + estimatedSecondsLeft + ' seconds)',
						serverData: result
					},
				reactiveStatus);
			}
		});
	}, 5000);
};
var spinNewVM = function(reactiveStatus) {
	setStatus({ human: 'Requesting to spin up a new server' }, reactiveStatus);
	Meteor.call('spinUpNewVM', function(err, result) {
		if (err) {
			setStatus(
				{
					human: 'Error spinning up a new server'
				},
				reactiveStatus
			);
			return;
		}
		setStatus({ human: 'Spinning up a new server', serverData: result }, reactiveStatus);
		runPoller(result.id, reactiveStatus);
	});
};
var destroyOldVM = function(serverId, reactiveStatus) {
	console.log('destroyOldVM(...)');
	setStatus(
		{
			human: 'Destroying existing server',
			destroying: true,
			serverData: reactiveStatus.get().serverData
		},
	reactiveStatus);
	Meteor.call('destroyOldVM', serverId, function(err, res) {
		if (err) {
			setStatus(
				{
					human: 'Error destroying existing server (Try again by refreshing)',
					serverData: reactiveStatus.get().serverData,
					destroying: true
				},
				reactiveStatus
			);
			return;
		}

	});
};

Template.main.onCreated(function() {
	this.status = new ReactiveVar();
	var status = getStatus();
	if (status) {
		this.status.set(status);
		if (status.destroying) {
			destroyOldVM(status.serverData.id, this.status);
			return;
		}
		if (!isReady(status.serverData)) {
			if (status.serverData && status.serverData.id) {
				runPoller(status.serverData.id, this.status);
			}
		}
	} else {
		spinNewVM(this.status);
	}
});

Template.main.helpers({
	counter: function() {
		return Template.instance().counter.get();
	},
	loadingStatus: function() {
		return Template.instance().status.get().human;
	},
	ready: function() {
		var status = Template.instance().status.get();
		return isReady(status.serverData) && !status.destroying;
	},
	ip: function() {
		var serverData = Template.instance().status.get().serverData;
		var key = 'ip_address';
		return serverData.networks.v4[0][key];
	},
	selfDestructTimeLeftHuman: function() {
		// TODO: Return real value
		return '5 hours 50 minutes and 10 seconds';
	}
});

Template.main.events({
	'click button' (event, instance) {
		var msg = 'Are you sure you want to do this?' +
			'  Your current server will be immediately destroyed.';
		if (confirm(msg)) {
			var reactiveStatus = Template.instance().status;
			var status = reactiveStatus.get();
			destroyOldVM(status.serverData.id, reactiveStatus);
		}
	}
});
