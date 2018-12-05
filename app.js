// jshint esversion: 6
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var arplogger_config = require('./config');
var routes = require('./routes/index');
var rp = require('request-promise');

var MongoClient = require("mongodb").MongoClient;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/angular')));
app.use(express.static(path.join(__dirname, 'node_modules/angular-aria')));
app.use(express.static(path.join(__dirname, 'node_modules/angular-animate')));
app.use(express.static(path.join(__dirname, 'node_modules/angular-material')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// kick off the polling notifier thing
var moment = require('moment');
var arpMonitor = require("arp-monitor")();

// once per minute an ARP ping gets sent out
// 50 seconds after every ARP ping, the active clients table is reported
// via this update event, so it may take a couple of minutes for
// a new device to be detected or an absent device to drop off
// you won't get the first report until 50 seconds after the app starts
arpMonitor.on("update", function(activeClients) {
  var macs = Object.keys(activeClients);
  var obj = {
    timestamp: moment().format(),
    macCount: macs.length,
    macs: macs
  };

  if(arplogger_config.localMongo_enabled) {
    var insertDocument = (db, doc, callback) => {
      console.log("Inserting document");
      var collection = db.collection('arp_reports');
      collection.insert(doc, (err, result) => {
        console.log("Document Inserted");
        callback(result);
      });
    };
  
    var url = 'mongodb://localhost:27017/arplogger';
    console.log("Connecting to Database");
    MongoClient.connect(url, (err, db) => {
      console.log("Connected to Database");
      insertDocument(db, obj, () => {
        console.log("Closing Database Connection");
        db.close();
      });
    });
  }

  if(arplogger_config.remoteServer_enabled) {
    let options = {
      method: 'POST',
      uri: arplogger_config.remoteServer_url,
      body: obj,
      json: true // Automatically stringifies the body to JSON
    };
  
    rp(options)
      .then(function (parsedBody) {
        console.log('posted to remote server');
      })
      .catch(function (err) {
        console.log('failed to post to remote server', err.message, err.stack);
      });
  }

  // right now log the object to the console
  // ultimately append it to a file or something
  console.log(obj);

  // activeclients is an object with
  // keys that are mac addesses and
  // values that are ip addresses
});

module.exports = app;
