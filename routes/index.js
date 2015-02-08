var fs = require('fs');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
	fs.readFile(PUBLIC_DIRECTORY+"index.html", function(err, content){
		content.pipe(res);
	});
});

/*
 * get aps
 * floor: floor number or numbers joined by ,
 */
router.get('/aps', function(req, res, next) {
	var floor = req.query.floor;
	var db = req.db;
	var aps = [];
	var len = 0;
	if(floor && (floor = floor.split(","))){
		len = floor.length;
	}
	if(len > 0){
		(function next(i){
			if(i == len){
				fn(null, aps);
			}else{
				findAps(db, +floor[i], function(err,_aps){
					cb(err, _aps);
					next(i+1);
				});
			}
		})(0);
	}else{
		findAps(db, null, fn)
	}
	function cb(err, _aps){
		aps = aps.concat(_aps);
	}
	function fn(err, aps){
		res.contentType('application/json');
		res.send(JSON.stringify(aps));
		res.end();
	}
});

// help function, 
// floor can be null,
function findAps(db, floor, fn){
	console.log("floor", floor);
	var filter = {};
	floor != null && (filter.floor = floor);
	db.get('aps').find(filter,{},function(err, aps){
		fn(err, aps);
	});
}

/*
* get records by start and end time
* start:
* end:
* sortBy: attribute sort by
*/
router.get('/records', function(req, res, next) {
	var start = +req.query.start;
	var end = +req.query.end;
	var sortBy = req.query.sortBy;
	var db = req.db;
	var records_c = db.get('records');
	//
	var filter = {}, option = {};
	if(start){
		filter.date_time =  filter.date_time || {};
		filter.date_time["$gte"] = new Date(start);
	}
	if(end){
		filter.date_time =  filter.date_time || {};
		filter.date_time["$lte"] = new Date(end);
	}
	if(sortBy){
		option.sort = option.sort || {};
		option.sort[sortBy] = 1;
	}
	records_c.find(filter, option,
			function(err, records){
				if(err) console.log(err);
				res.contentType('application/json');
				res.send(JSON.stringify(records));
				res.end();
			});
	//
});

module.exports = router;

