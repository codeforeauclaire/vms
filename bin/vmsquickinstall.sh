#!/usr/bin/env bash

{ # this ensures the entire script is downloaded and run #

# Update all software & install new
sudo apt-get update && sudo apt-get upgrade -y && sudo apt-get install -y git

# Setup swap (which will enable on reboot)
# * We need more than 512MB ram for Meteor to work. Warning: meteor may be slow, especially first run, on small instances
# * https://www.digitalocean.com/community/tutorials/how-to-add-swap-on-ubuntu-14-04
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
echo "/swapfile   none    swap    sw    0   0" >> "/etc/fstab"
echo "vm.swappiness=10" >> /etc/sysctl.conf
echo "vm.vfs_cache_pressure = 50" >> /etc/sysctl.conf
# * Enable swap file now before reboot
sudo swapon /swapfile

# Install meteor
curl https://install.meteor.com/ | sh

# Clone repository
git clone https://github.com/codeforeauclaire/vms.git /root/vms

# Install npm stuff for Meteor locally
(cd /root/vms && meteor npm install)

} # this ensures the entire script is downloaded and run #
