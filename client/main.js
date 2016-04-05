'use strict';
/* global Meteor */

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var getStatus = function() {
	return JSON.parse(localStorage.getItem('status'));
};
var setStatus = function(statusSetTo, reactiveVar) {
	reactiveVar.set(statusSetTo);
	return localStorage.setItem('status', JSON.stringify(statusSetTo));
};
var isReady = function(serverData) {
	return serverData && serverData.status && (serverData.status === 'active');
};
var runPoller = function(serverId, reactiveStatus) {
	var that = this;
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
				setStatus({
					human: 'Server info received, awaiting active status' +
						' (this usually finishes in under 60 seconds)',
					serverData: result
				}, that.status);
			}
		});
	}, 5000);
};

Template.main.onCreated(function() {
	this.status = new ReactiveVar();
	var status = getStatus();
	if (status) {
		if (!isReady(status.serverData)) {
			if (status.serverData && status.serverData.id) {
				runPoller(status.serverData.id, this.status);
			}
		}
		this.status.set(status);
	} else {
		var that = this;
		setStatus({ human: 'Requesting to spin up a new server' }, this.status);
		Meteor.call('spinUpNewVM', function(err, result) {
			if (err) {
				setStatus(
					{
						human: 'Error spinning up a new server'
					},
					that.status
				);
				return;
			}
			setStatus({ human: 'Spinning up a new server', serverData: result }, that.status);
			runPoller(result.id);
		});
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
		return isReady(Template.instance().status.get().serverData);
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
			// TODO: Implement this functionality
			alert('TODO: Implement this functionality');
		}
	}
});
