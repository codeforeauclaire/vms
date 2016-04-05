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

Template.main.onCreated(function() {
	this.status = new ReactiveVar();
	if (getStatus()) {
		Template.instance().status.set(getStatus());
	} else {
		var that = this;
		setStatus({ human: 'Requesting to spin up a new server' }, this.status);
		Meteor.call('spinUpNewVM', function(err, result) {
			if (err) {
				setStatus({ human: 'Error spinning up a new server' }, that.status);
				return;
			}
			setStatus({ human: 'Spinning up a new server', serverData: result }, that.status);
			var poller = setInterval(function() {
				Meteor.call('getVmInfo', result.id, function(err, result) {
					if (err) {
						setStatus({ human: 'Error getting server info' }, that.status);
					}
					if (isReady(result)) {
						setStatus({ human: null, serverData: result }, that.status);
						clearInterval(poller);
					} else {
						setStatus({
							human: 'Server info received, awaiting active status',
							serverData: result
						}, that.status);
					}
				});
			}, 5000);
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
		return serverData.networks.v4[0].ip_address;
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
