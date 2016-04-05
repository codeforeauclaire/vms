## Purpose

* New developers coming to C4EC need development enviornments
* Diverse project demos
    * Gives clean enviornment to follow along and test READMEs

## Getting started with this code

1. Install meteor (Follow instructions at https://www.meteor.com/install)
1. cd to root folder of your clone
1. `meteor npm install`
1. Copy ./settings/template.json somewhere private, providing your Digital Ocean api token
1. `meteor --settings [Location of your settings file]`

## TODO

1. Setup Documentation how to get started as a developer (display on main html)
 1. Instructions how to SSH into a server for any platform (link to something)
1. Mock up UI for this whole thing
1. Setup to accept Anthony's started settings to deploy to his mets
1. Setup Jobs to destroy servers after it's been up for 1 hour
1. Think through / review more / add more here as needed
1. Add throttling to prevent people from adding too many
 1. At the client level?
 1. Add hard setting at the server level, at most 20 servers going at once
1. Add config for how long server stays up (6 hours I think)
1. Get this setup on vms.codeforeauclaire.org
1. Add button to destroy the server (which does all them to create another)
 1. Later: Add throttling here
1. Cleanup code!
