'use strict';
/* global Meteor */

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var getStatus = function() {
	return localStorage.getItem('status');
};
var setStatus = function(statusSetTo, reactiveVar) {
	reactiveVar.set(statusSetTo);
	return localStorage.setItem('status', statusSetTo);
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
					setStatus({ human: 'Got server info', serverData: result }, that.status);
					if (isReady(result)) {
						clearInterval(poller);
					}
					console.log(result);
				});
			}, 5000);
		});
	}
});

Template.main.helpers({
	counter: function() {
		return Template.instance().counter.get();
	},
	status: function() {
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
		console.log(Template.instance().status.get());
	}
});
