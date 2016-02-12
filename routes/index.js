var expressPromiseRouter = require("express-promise-router");
var router = expressPromiseRouter();
var Promise = require("bluebird");

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
