'use strict';
/* global Meteor, moment, _ */

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import selectText from './selectText.js';
import './main.html';

var hasSettings = function() {
	return (_.size(Meteor.settings.public) > 0);
};
var getStatus = function() {
	return JSON.parse(localStorage.getItem('status'));
};
var getSecondsToSelfDestruct = function(status) {
	var key = 'created_at';
	if (status && status.serverData && status.serverData[key]) {
		var hoursLive = Meteor.settings.public.serverlifespanhours;
		// Larger servers only get 1/2 the life
		if (status.serverData.memory !== 512) {
			hoursLive /= 2;
		}
		var serverShutdownAt = moment(status.serverData[key])
			.add(hoursLive, 'hours')
			.subtract(20, 'minutes');
		return serverShutdownAt.diff(moment(), 'seconds');
	}
	return false;
};
var setStatus = function(statusSetTo, reactiveStatus) {
	statusSetTo.secondsToSelfDestruct = getSecondsToSelfDestruct(statusSetTo);
	reactiveStatus.set(statusSetTo);
	return localStorage.setItem('status', JSON.stringify(statusSetTo));
};
var isReady = function(serverData) {
	return serverData &&
			serverData.status &&
			(serverData.status === 'active');
};
var runPoller = function(serverId, apiTokenNumber, reactiveStatus) {
	var poller = setInterval(function() {
		Meteor.call('getVmInfo', serverId, apiTokenNumber, function(err, result) {
			if (err) {
				setStatus(
					{
						human: 'Error getting machine info'
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
						human: 'Machine info received, awaiting active status' +
							' (expected to finish within ' + estimatedSecondsLeft + ' seconds)',
						serverData: result
					},
				reactiveStatus);
			}
		});
	}, 5000);
};
var runSelfDestructTimer = function(reactiveStatus) {
	setInterval(function() {
		var status = reactiveStatus.get();
		status.secondsToSelfDestruct = getSecondsToSelfDestruct(status);
		setStatus(status, reactiveStatus);
	}, 1000);
};
var spinNewVM = function(reactiveStatus, newSize) {
	setStatus({ human: 'Requesting to spin up a new machine' }, reactiveStatus);
	Meteor.call('spinUpNewVM', newSize, function(err, result) {
		if (err) {
			setStatus(
				{
					human: 'Error spinning up a new machine'
				},
				reactiveStatus
			);
			return;
		}
		setStatus({ human: 'Spinning up a new machine', serverData: result }, reactiveStatus);
		runPoller(result.id, result.apiTokenNumber, reactiveStatus);
		runSelfDestructTimer(reactiveStatus);
	});
};
// Too many params ignored
var destroyOldVM = function( // jshint ignore:line
	serverId, apiTokenNumber, newSize, reactiveStatus
) {
	setStatus(
		{
			human: 'Destroying existing machine',
			destroying: true,
			serverData: reactiveStatus.get().serverData
		},
	reactiveStatus);
	Meteor.call('destroyOldVM', serverId, apiTokenNumber, function(err, res) {
		if (err) {
			setStatus(
				{
					human: 'Error destroying existing machine (we\'ll sping a new one anyways)',
					serverData: reactiveStatus.get().serverData,
					destroying: true
				},
				reactiveStatus
			);
			spinNewVM(reactiveStatus, newSize);
			return;
		}
		spinNewVM(reactiveStatus, newSize);
	});
};

Template.main.onCreated(function() {
	if (!hasSettings()) {
		return false;
	}
	this.status = new ReactiveVar();
	var status = getStatus();
	if (status) {
		this.status.set(status);
		if (status.destroying) {
			destroyOldVM(status.serverData.id, status.serverData.apiTokenNumber, this.status);
			return;
		}
		if (isReady(status.serverData)) {
			runSelfDestructTimer(this.status);
		} else {
			if (status.serverData && status.serverData.id) {
				runPoller(status.serverData.id, status.serverData.apiTokenNumber, this.status);
			}
		}
	} else {
		spinNewVM(this.status, '512mb');
	}
});

Template.main.helpers({
	hasSettings: hasSettings,
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
		var status = Template.instance().status.get();
		return moment.duration(1000 * status.secondsToSelfDestruct).format('h:mm:ss');
	},
	privateKey: function() {
		return Meteor.settings.public.sshkey.private;
	}
});
Template.main.events({
	'click pre': function(e) {
		selectText(e.target);
	}
});
Template.auth.helpers({
	privateKey: function() {
		return Meteor.settings.public.sshkey.private;
	},
	ppk: function() {
		return Meteor.settings.public.sshkey.ppk;
	}
});
Template.auth.events({
	'click pre': function(e) {
		selectText(e.target);
	}
});

/// Key source toggle
// TODO: Re-use these init/set/get methods
var get = function(name) {
	return localStorage.getItem(name);
};
var set = function(name, val, reactiveSource) {
	reactiveSource.set(val);
	localStorage.setItem(name, val);
};
var init = function(templateInstance, name, def) {
	templateInstance[name] = new ReactiveVar();
	templateInstance[name].set((get(name) ? get(name) : def));
};
Template.manage.onCreated(function() {
	init(this, 'keySource', 'vms');
	init(this, 'myPublicKey', '');
	init(this, 'myPrivateKey', '');
});
Template.manage.helpers({
	isKeySource: function(keySource) {
		var ks = Template.instance().keySource.get();
		return (ks === keySource);
	},
	isMySource: function() {
		var ks = Template.instance().keySource.get();
		return ks === 'mine';
	},
	myPublicKey: function() {
		return Template.instance().myPublicKey.get();
	},
	myPrivateKey: function() {
		return Template.instance().myPrivateKey.get();
	}
});
Template.manage.events({
	'change input[name=optionsKeySource]': function(event, instance) {
		var key = 'keySource';
		var val = $(event.target).val();
		set(key, val, instance[key]);
	},
	'focusout textarea.my-key': function(event, instance) {
		var key = $(event.target).attr('name');
		var val = $(event.target).val();
		set(key, val, instance[key]);
	}
});

var destroy = function(newSize) {
	var msg = 'Are you sure you want to do this?\n' +
		'  Your current machine will be immediately destroyed.';
	if (confirm(msg)) {
		var reactiveStatus = Template.instance().status;
		var status = reactiveStatus.get();
		destroyOldVM(
			status.serverData.id,
			status.serverData.apiTokenNumber,
			newSize,
			reactiveStatus
		);
	}
};
Template.main.events({
	'click button.new-512mb' (event, instance) {
		destroy('512mb');
	},
	'click button.new-1gb' (event, instance) {
		destroy('1gb');
	}
});
