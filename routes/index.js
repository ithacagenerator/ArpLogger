// jshint esversion: 6
var express = require('express');
var router = express();
var Promise = require("bluebird");
var MongoDB = Promise.promisifyAll(require("mongodb"));
var MongoClient = MongoDB.MongoClient;
var moment = require("moment");
var arplogger_config = require('../config');
console.log(arplogger_config);

if(arplogger_config.serverRoutes_enabled) {
  console.log('hosting routes');

  var findDocuments = (db, earliestDate, latestDate) => {
    var collection = db.collection('arp_reports');
    var earlyquery = {timestamp: {$gt: earliestDate}};
    var latequery = {timestamp: {$lt: latestDate}};
    var query = {};
    if(latestDate){
      query = {$and: [earlyquery, latequery]};
    }
    else{
      query = earlyquery;
    } 

    console.log(JSON.stringify(query, null, 2));
    return Promise.try(() => {
      return collection.find(query).toArrayAsync();
    });
  };

  var countUniqueMACs = (docs) => {
    var uniqueMACs = {};
    docs.forEach((doc) => {
      doc.macs.forEach((mac) => {
        uniqueMACs[mac] = 1;
      });
    });
    return Object.keys(uniqueMACs).length;
  };

  /* GET home page. */
  router.get('/', function(req, res) {
    var url = 'mongodb://localhost:27017/arplogger';
    var uniqueMACs_1hr  = 0;
    var uniqueMACs_1day = 0;
    var uniqueMACs_1wk  = 0;
    var uniqueMACs_1mo  = 0;  
    var uniqueMACs_3mo  = 0;
    var uniqueMACs_6mo  = 0;
    var uniqueMACs_1yr  = 0;

    var earliest = req.query.earliest;
    var latest = req.query.latest; 
    var resultSet = [];

    return Promise.try(() => {
      return MongoClient.connect(url);
    }).then((db) => {
      let theDb = db;
      console.log("connected");
      return Promise.try(() => {
        return findDocuments(theDb, moment().subtract(1, "hour").format());      
      }).then((docs) => {
        uniqueMACs_1hr = countUniqueMACs(docs);     
      }).then(() => {
        return findDocuments(theDb, moment().subtract(1, "day").format());                                 
      }).then((docs) => {
        uniqueMACs_1day = countUniqueMACs(docs);
      }).then(() => {
        return findDocuments(theDb, moment().subtract(1, "week").format()); 
      }).then((docs) => {
        uniqueMACs_1wk = countUniqueMACs(docs);
      }).then(() => {
        return findDocuments(theDb, moment().subtract(1, "month").format()); 
      }).then((docs) => {
        uniqueMACs_1mo = countUniqueMACs(docs);
      }).then(() => {
        return findDocuments(theDb, moment().subtract(3, "month").format());
      }).then((docs) => {
        uniqueMACs_3mo = countUniqueMACs(docs);
      }).then(() => {
        return findDocuments(theDb, moment().subtract(6, "month").format());
      }).then((docs) => {
        uniqueMACs_6mo = countUniqueMACs(docs);
      }).then(() => {
        return findDocuments(theDb, moment().subtract(1, "year").format());
      }).then((docs) => {
        uniqueMACs_1yr = countUniqueMACs(docs);
      }).then(() => {
        return findDocuments(theDb, earliest, latest);
      }).then((docs) => {
        resultSet = docs.map((doc) => {
          return {
            timestamp: doc.timestamp,
            macCount: doc.macCount
          };
        });
        resultSet = JSON.stringify(resultSet);
      }).then(() => {
        db.close();
      });
    }).then(() => {
      res.render('index', { title: 'Arp Logger', uniqueMACs_1hr, uniqueMACs_1day, uniqueMACs_1wk, uniqueMACs_1mo, uniqueMACs_3mo, uniqueMACs_6mo, uniqueMACs_1yr, resultSet });
    }).catch((error) => {
      res.json({stack: error.stack, message: error.message});
    });
  });

  router.post('/', function(req, res) {
    const reports = req.body;
    if(reports.timestamp) {
      let insertDocument = (db, doc, callback) => {
        console.log("Inserting document");
        var collection = db.collection('arp_reports');
        collection.insert(doc, (err, result) => {
          console.log("Document Inserted");
          callback(result);
        });
      };
    
      let url = 'mongodb://localhost:27017/arplogger';
      console.log("Connecting to Database");
      MongoClient.connect(url, (err, db) => {
        console.log("Connected to Database");
        insertDocument(db, reports, () => {
          console.log("Closing Database Connection");
          db.close();
        });
      });    
    }

    res.json({status:  'ok'});
  });
}

module.exports = router;
