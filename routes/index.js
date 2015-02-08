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

router.get('/records', function(req, res, next) {
	var start = +req.query.start;
	var end = +req.query.end;
	var sortBy = req.query.sortBy;
	var db = req.db;
	find_records(db, start, end, sortBy, function(err, records){
		if(err) console.log(err);
		res.contentType('application/json');
		res.send(JSON.stringify(records));
		res.end();
	});
});


/*
* get records by start and end time
* db:
* start:
* end:
* sortBy: attribute sort by
* fn(err,records):
*/
function find_records(db, start, end, sortBy, fn){
	var records_c = db.get('records');
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
	records_c.find(filter, option, function(err, records){
		fn(err, records);
	});
}

/*
 * get timeline data
 * start:
 * end:
 * step: time stemp
 */
router.get('/tl-data', function(req, res, next){
	var db = req.db;
	var start = +req.query.start;
	var end = +req.query.end;
	var step = +req.query.step;
});

/*
 * records: sorted by time
 */
function generate_tl_data(records, start, end, step){
	records.forEach(function(r){r.dateTime = new Date(r.date_time)});
	var res = {
		time:[],
		shownData:[]
	};
	var binNum = (end - start)/step;
	var time = [], shownData = [], i = -1;
	while(++i <= binNum){
		var t = start + i*step, dt = new Date(t);
		time.push(t);
		shownData.push(value:0);
	}
	i = -1;
	while(++i < records.length){
		var iBin = parseInt((data[i].dateTime - start)/step);
		shownData[iBin].value++;
	}
}

module.exports = router;

