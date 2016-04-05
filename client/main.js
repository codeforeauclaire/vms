'use strict';
/* global Meteor */

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.main.onCreated(function() {
	this.counter = new ReactiveVar(0);
});

Template.main.helpers({
  counter() {
    return Template.instance().counter.get();
  }
});

Template.main.events({
  'click button'(event, instance) {
	  Meteor.call('spinUpNewVM');
  }
});
