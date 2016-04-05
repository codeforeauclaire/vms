'use strict';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
	'spinUpNewVM': function() {
		console.log('spin it');
	}
});
