//jshint esversion: 6
var homedir = require('homedir')();
var config = {
  localMongo_enabled: true,    // whether arp results should be stored to a local database
  remoteServer_enabled: true,  // whether arp results should be sent to a remote server
  serverRoutes_enabled: false, // whether this process should host remote routes
  remoteServer_url: 'https://ithacagenerator.org/arplogger',
  arpListener: true
};

try {
  config = Object.assign({}, config, require(`${homedir}/arplogger.cfg.json`));
} catch(e) { }  

module.exports = config;
