'use strict';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
	'spinUpNewVM': function() {
		Meteor._sleepForMs(2000);
		console.log('spin it');
	}
});
