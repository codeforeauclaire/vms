## Purpose

* New developers coming to C4EC need to experience clean development enviornments
* Diverse projectis require clean enviornment to do follow along demos and test READMEs
* Quick testing of one off ideas

## Contributing (Setting up a dev enviornment)

1. Install meteor (Follow instructions at https://www.meteor.com/install)
1. cd to root folder of your clone
1. `meteor npm install`
1. Copy ./settings/template.json somewhere private
 1. Get your Digital Ocean api token from https://cloud.digitalocean.com/settings/api/tokens
 1. Use `ssh-keygen -t rsa -f new` to create a pub/private key
      1. Put the private key in your settings.json with "\n" strings in place of newlines
          1. `cat ./new |  while read line; do echo -n "$line\\n"; done`
      1. Put public key on Digital Ocean @ https://cloud.digitalocean.com/settings/security
          1. Which will give you the fingerprint
	  1. Generate ppk using PuttyGen (Install & open PuttyGen on windows >> Load your private key >> save private key as new.ppk)
	      1. Put the putty private key in your settings.json with "\n" strings in place of newlines
              1. `dos2unix ./new.ppk && cat ./new.ppk |  while read line; do echo -n "$line\\n"; done`
1. `meteor --settings [Location of your settings file]`

## Production setup

Digital Ocean limits the number of droplets per account to 10 by default. To mitigate this vms supports multiple api tokens. Be warned that Digital Ocean may not like if you setup more than 2 accounts with the same billing information, and you may have to verify later setup accounts. Steps to take for each account you setup:

1. If you're using a gmail account, just add a +2, +3, ... to the end of your email for a unique registration address.
2. Save your login somewhere smart like LastPass, test the save works
3. Confirm your email address with link they send
4. https://cloud.digitalocean.com/settings/profile >> Edit Profile >> Add Phone number (recovery)
5. https://cloud.digitalocean.com/settings/billing >> Fill in
6. https://cloud.digitalocean.com/settings/billing >> Set Billing Alerts
7. https://cloud.digitalocean.com/settings/security >> Add the same public key (Confirm you have the same fingerprint in settings.json @ fingerprints)
8. https://cloud.digitalocean.com/settings/api/tokens >> Generate New Token >> vms >> add to settings.json @ apitokens

When done setting up all config, be sure you test all the Digital Ocean accounts. It's easiest to manually modify code to do this. Search code for 'TOKEN-AND-FINGERPRINT-TESTER'.

Alternatively or additionally you may contact Digital Ocean support to request an increase in the number of Droplets they allow on your account. They granted me up to 20 with no problem on one account.

## TODO

1. Get on vms.codeforeauclaire.org (move from vms.c4ec.astige.com)
 1. Await DNS
 1. Deploy new site
 1. Redirect old domain (for a week maybe)
 1. Remove old site (and deploy script for old domain)

### TODO: Later?

1. Cleanup code
1. Give a retry button when stuck in an error'd state
1. Try to fix Fibers issue hack with Meteor 1.3.1 >> update deploy scripts workaround
 1. Notes are in /bin/anthony/deployC* with github issue raised, update that after trying
1. Make wait after server status is active another 10 seconds (sometimes can't ssh in right away)
1. Add UI clear for select all on pre boxes when clicked
1. Add hard throttling on max spin ups per unit of time (put values in settings.json)
1. Auto generate a new server if timer is negative (Do destruct >> recreate cycle?)
