#!/usr/bin/env bash

{ # this ensures the entire script is downloaded and run #

# Update all software & install new
sudo apt-get update && sudo apt-get upgrade -y && sudo apt-get install -y git

# Install meteor
curl https://install.meteor.com/ | sh

# Clone repository
git clone https://github.com/codeforeauclaire/vms.git /root/vms

} # this ensures the entire script is downloaded and run #
