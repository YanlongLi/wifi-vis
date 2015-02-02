var fs = require('fs');
var express = require('express');
var router = express.Router();
var PUBLIC_DIRECTORY = "public/";
var dataCenter = require('./DataCenter');

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
	fs.readFile(PUBLIC_DIRECTORY+"index.html", function(err, content){
		content.pipe(res);
	});
});
//
// get aps by floor
router.get('/getApsByFloor', function(req, res, next) {
	var iF = req.query.floor;
	var apCenter = req.dataCenter.apCenter;
	var result = apCenter.getApsByFloor(iF);
	console.log("getApsByFloor:", floor);
	console.log("result:", result.length);
	res.contentType('application/json');
	res.send(JSON.stringify(result));
	res.end();
});

router.get('/getApsByFloors', function(req, res, next) {
	var str = req.query.floor;
	var floor = str.split(",");
	var apCenter = req.dataCenter.apCenter;
	var result = apCenter.getApsByFloors(floor);
	console.log("getApsByFloors:", floor);
	console.log("result:", result.length);
	res.contentType('application/json');
	res.send(JSON.stringify(result));
	res.end();
});

router.get('/NodesAndLinks', function(req, res, next){
	var pc = req.dataCenter.pathCenter;
	var allPath = pc.findAllPath();
	var o = pc.pathToForceNodeLink(allPath);
	res.contentType('application/json');
	res.send(JSON.stringify(o));
	res.end();
});

router.get('/NodesAndLinksWeight', function(req, res){
	var pc = req.dataCenter.pathCenter;	
	var allPath = pc.findAllPath();
	var o = pc.pathToForceNodeLinkWithWeight(allPath);
	res.contentType("application/json");
	res.send(JSON.stringify(o));
	res.end();
});

module.exports = router;

