'use strict';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
	'spinUpNewVM': function() {
		console.log('spin it');
		console.log(Meteor.settings.digitalocean.apitoken);
		Meteor._sleepForMs(2000);
	}
});
