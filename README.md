## Purpose

* New developers coming to C4EC need development enviornments
* Diverse project demos
    * Gives clean enviornment to follow along and test READMEs

## Getting started with this code

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
1. `meteor --settings [Location of your settings file]`

## TODO

1. Figure out Digital Ocean 10 server spinning limitation, giving 500 errors
1. Pretty this up, adding bootstrap
1. Setup Documentation how to get started as a developer (display on main html)
 1. Instructions how to SSH into a server for any platform (link to something)
1. Mock up UI for this whole thing
1. Address use case of expired server, and local storage still has id
1. Setup to accept Anthony's started settings to deploy to his mets
1. Setup Jobs to destroy servers after it's been up for 1 hour
1. Think through / review more / add more here as needed
1. Implement old server deletion as garbage collection, not jobs
 1. Query the DigitalOcean API to find servers over a set age, and delete them
1. Add throttling to prevent people from adding too many
 1. At the client level?
 1. Add hard setting at the server level, at most 20 servers going at once
1. Add config for how long server stays up (6 hours I think)
1. Get this setup on vms.codeforeauclaire.org
1. Add button to destroy the server (which does all them to create another)
 1. Later: Add throttling here
1. Cleanup code!
