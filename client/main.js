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
		});
	}
});

Template.main.helpers({
	counter: function() {
		return Template.instance().counter.get();
	},
	status: function() {
		return Template.instance().status.get();
	}
});

Template.main.events({
	'click button' (event, instance) {
		console.log(Template.instance().status.get());
	}
});
