#!/bin/bash
if ! pgrep -x "mongod" > /dev/null
then
   echo "Repairing MongoDB"
   sudo rm /tmp/mongo*
   sudo /usr/bin/mongod --config /etc/mongodb.conf --repair && sudo service mongodb start && echo "Done"
else
   echo "MongoDB already running"
fi

watch -n1 date
