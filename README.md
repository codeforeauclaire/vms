## Purpose

* New developers coming to C4EC need to experience clean development enviornments
* Diverse projectis require clean enviornment to do follow along demos and test READMEs
* Quick testing of one off ideas

## VMS development enviornment quick setup instructions

1. Fork this repository
1. Create a new [Virtual Machine](http://vms.codeforeauclaire.org/) (1gb+ recommended) >> SSH in >> Run (or read) vms quick install
 1. export GHUSER='AnthonyAstige' (Replace AnthonyAstige with your username)
 1. `curl -L -o- https://rawgit.com/codeforeauclaire/vms/master/bin/vmsquickinstall.sh | bash`
1. Run app
 1. `cd ~/vms`
 1. `meteor`
      1. Warning: The meteor dev enviornment is resource hungry. The first run will go especially slow (5+ minutes?) on a vms machine. After that it's expected to be okay for at least simple changes.
 1. Load http://{vms-ip}:3000 in your browser
 1. Edit a file >> see changes intantly in your browser

Note: `vmsquickinstall.sh` doesn't insclude a `settings.json` which is required for some app functionality. You can however work on some of the UI without worrying about that.

## Setting up other sites vmsquickinstall.sh scripts

1. Copy a vmsquickinstall.sh script from another site (with similar stack if possible)
 1. Tear out junk you know you don't need
1. Spin up a new machine using the production host of this vms site
1. Edit your vmsquickinstall.sh to work better
1. Run your vmsquickinstall.sh on the server using `IP= && scp -i ~/.ssh/vms_id_rsa vmsquickinstall.sh root@$IP:/root/ && ssh -i ~/.ssh/vms_id_rsa root@$IP /root/vmsquickinstall.sh`
 1. Populate your vms server IP address
1. Repeat steps 2-4 until vmsquickinstall.sh is smooth (ideally no human interation; just works)
1. Update the site's README.md by copying another sites quick install instructions and tweaking as needed

## Full development enviornment setup instructions

1. Install meteor (Follow instructions at https://www.meteor.com/install)
1. cd to root folder of your clone
1. `meteor npm install`
1. Copy `./settings/template.json` to somewhere private named something like `settings.json`
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

1. Cleanup code
1. Seperate out into multiple pages (flowrouter?)
 1. Move some of the About and maybe Other resources to other page(s)?
 1. Move Authentication to another page?
1. Deal with bad public key uploading (errors from DO, display a useful message)
1. Delete old public ssh keys uploaded to Digital Ocean
 1. If too many get there the API may paginate them when we list, which will break things
	 1. Implement garbage collection like delete servers run every 10 minutes that deleted keys older than 5 minutes?
	     1. Not perfect, but probably good enough.  May get race condition errors if click wrong time, but uncommon.
1. Give a retry button when stuck in an error'd state
1. Cleanup UI
 1. Hide authenticate / adjust extras if your own public key is provided
     1. Public key may need to move to top level in ui then?
 1. Add a server info section?
1. Add description to UI somewhere that 1gb machines last 1/2 the length as 512mb machines
 1. And to be curtious and only use 1gb machines when needed. Suggest use swap space in your quickvms scripts like in this one's?
1. Indicate in ui the current machine size
1. Make wait after server status is active another 10 seconds (sometimes can't ssh in right away)
1. Add UI clear for select all on pre boxes when clicked
1. Add hard throttling on max spin ups per unit of time (put values in settings.json)
1. Auto generate a new server if timer is negative (Do destruct >> recreate cycle?)
