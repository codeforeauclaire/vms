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

## TODO

1. Get on vms.codeforeauclaire.org (move from vms.c4ec.astige.com)
 1. Await DNS
 1. Deploy new site
 1. Redirect old domain (for a week maybe)
 1. Remove old site (and deploy script for old domain)

### TODO: Later?

1. Cleanup code
1. Make wait after server status is active another 10 seconds (sometimes can't ssh in right away)
1. Add UI clear for select all on pre boxes when clicked
1. Figure out Digital Ocean 10 server spinning limitation, giving 500 errors
1. Add hard throttling on server (values in settings.json)
 1. Max servers running at a time
 1. Max spin ups per given unit of time
