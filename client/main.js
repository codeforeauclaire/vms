'use strict';
/* global Meteor */

import { Template } from 'meteor/templating';

import './main.html';

var getStatus = function() {
	return localStorage.getItem('status');
};
var setStatus = function(status) {
	return localStorage.setItem('status', status);
};

Template.main.onCreated(function() {
	if (!getStatus()) {
		setStatus('spinning');
		Meteor.call('spinUpNewVM', function() {
			setStatus('spun');
		});
	}
});

Template.main.helpers({
  counter() {
    return Template.instance().counter.get();
  }
});

Template.main.events({
  'click button'(event, instance) {
		console.log(getStatus());
  }
});
