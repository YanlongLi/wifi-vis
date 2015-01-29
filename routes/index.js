var fs = require('fs');
var express = require('express');
var router = express.Router();
var PUBLIC_DIRECTORY = "public/";

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
	fs.readFile(PUBLIC_DIRECTORY+"index.html", function(err, content){
		console.log(content);
		content.pipe(res);
	});
});

module.exports = router;
