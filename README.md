#!/bin/bash
# install nvm see https://github.com/creationix/nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash

# install nodejs using nvm
nvm install 8.9.4
nvm alias default 8.9.4

# install pm2
npm install -g pm2

# install pm2-logrotate into pm2
pm2 install pm2-logrotate

# configure pm2-logrotate see https://github.com/keymetrics/pm2-logrotate
pm2 set pm2-logrotate:max_size 1M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:retain 10

# clone this repository in the present working directory
git clone https://github.com/ithacagenerator/ArpLogger.git

# enter the project folder and install the project dependencies
cd ArpLogger
npm install

# install mongodb
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install mongodb-server
sudo service mongod start

# register the mongo script to start / repair mongo at startup
pm2 start ./restart_mongo.sh --name restart-mongo

# register the arp-logger to run at startup
pm2 start bin/www --name arp-logger

# save the pm2 process list
pm2 save

# configure pm2 startup scripts
pm2 startup