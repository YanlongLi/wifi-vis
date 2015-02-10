var fs = require('fs');
var express = require('express');
var d3 = require('d3');
var router = express.Router();

router.get('/test', function(req, resp){
	var records_c = req.db.get('records');
});

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
	fs.readFile(PUBLIC_DIRECTORY+"index.html", function(err, content){
		content.pipe(res);
	});
});

/*
 * req.query.apid
 */
router.get('/apById', function(req, resp, next){
	var db = req.db;
	var apid = +req.query.apid;
	findApById(db, apid, function(ap){
		resp.contentType("application/json");
		resp.send(JSON.stringify(ap));
		resp.end;
	})
});
/*
 * get aps
 * req.query.floor: floor number or numbers joined by ,
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

/*
 * req.query.start
 * req.query.end
 * req.query.sortBy: attr sorted by
 */
router.get('/records', function(req, res, next) {
	var start = +req.query.start;
	var end = +req.query.end;
	var sortBy = req.query.sortBy;
	var db = req.db;
	// check parameter
	if(!start || !end){
		res.send("no start or end");
		res.end();
		return;
	}
	//
	find_records(db, start, end, sortBy, function(err, records){
		if(err) console.log(err);
		res.contentType('application/json');
		res.send(JSON.stringify(records));
		res.end();
	});
});

/*
 * req.query.start:
 * req.query.end:
 * req.query.mac: optional
 */
router.get('/find_path', function(req, res, next) {
	var start = +req.query.start;
	var end = +req.query.end;
	var mac = req.query.mac;
	var db = req.db;
	// check parameter
	if(!start || !end){
		res.send("no start or end");
		res.end();
		return;
	}
	//
	if(undefined === mac){
		find_path(db, start, end, function(err, result){
			if(err) console.log(err);
			res.contentType('application/json');
			res.send(JSON.stringify(result.map(function(d){return d.records})));
			res.end();
		});
	}else{
		find_path_by_mac(db, start, end, mac, function(err, path){
			if(err) console.log(err);
			res.contentType('application/json');
			res.send(JSON.stringify(path));
			res.end();
		});	
	}
});
/*
 * given a time span, generate graph info,
 * including links(source:apid, to: apid, weight)
 */
router.get('/graphinfo', function(req, resp, next){
	var db = req.db;
	var start = +req.query.start;
	var end = +req.query.end;
	find_path(db, start, end, function(err, result){
		var paths = result.map(function(d){return d.records});
		var links	= paths_to_links(paths);
		resp.contentType("application/json");
		resp.send(JSON.stringify(links));
		resp.end();
	});
})

function paths_to_links(paths){
	// key:"apid,apid", value:{weight:, macs:[]}
	var links = d3.map(); 
	paths.forEach(function(path){
		path.forEach(function(r,i){
			if(i == 0 || r.apid == path[i-1].apid){
				return;
			}
			var key = path[i-1].apid + ","+ r.apid;
			if(!links.has(key)){
				links.set(key, {weight:0, macs:[]});
			}
			var link = links.get(key);
			link.weight ++;
			link.macs.push(r.mac);
		});
	});
	return links.entries().map(function(o){
		var key = o.key, link = o.value;
		var arr = key.split(",");
		return {
			source : +arr[0],
			target : +arr[1],
			weight : link.weight,
			macs   : link.macs
		}
	});
}

/*
 * get timeline data
 * req.query.start:
 * req.query.end:
 * req.query.step: "senond minute hour day", default "hour"
 * req.query.stepcount: number, default 1
 */
var TIME_STEP = {
	second : 1,
	minute : 60,
	hour   : 60*60,
	day    : 60*60*24
};
// TODO: filter the start and end parameter according to DATA_TIME_RANGE
var DATA_TIME_RANGE = {
	from: new Date(2013, 09, 01),
	to: new Date(2013, 10, 11)
};
router.get('/tl-data', function(req, res, next){
	var db = req.db;
	var start     = +req.query.start;
	var end       = +req.query.end;
	var stepBy    = req.query.step || "hour";
	var stepcount = +(req.query.stepcount || 1);
	var step      = TIME_STEP[stepBy] * stepcount;
	// check parameter
	if(!start || !end){
		res.send("no start or end");
		res.end();
		return;
	}
	//
	find_records(db, start, end, "date_time", function(err, records){
		if(err) console.error(err);
		start = start || records[0].dateTime.getTime();
		end = end || records[records.length-1].getTime();
		var tl_data = generate_tl_data(records, start, end, step);
		//
		res.contentType("application/json");
		res.send(JSON.stringify(tl_data));
		res.end;
	});	
});

/*
* help function, 
* floor can be null,
* fn(ap)
*/
function findAps(db, floor, fn){
	console.log("floor", floor);
	var filter = {};
	floor != null && (filter.floor = floor);
	db.get('aps').find(filter,{},function(err, aps){
		fn(err, aps);
	});
}

function findApById(db, apid, fn){
	if(undefined === apid){
		fn("there is no apid to query");
		return;
	}
	db.get('aps').findOne({apid: +apid})
		.on('error', function(err){
			console.log(err);
			fn("error while findApById");
		}).on('success', fn);
}

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
	var filter = {
		date_time:{"$gte": new Date(start), "$lte": new Date(end)}
	}, option = {stream: true};
	if(sortBy){
		option.sort = option.sort || {};
		option.sort[sortBy] = 1;
	}
	var records = [];
	records_c.find(filter, option)
		.each(function(r){
			//findApById(db, r.apid, function(ap){
		  //	r.floor = ap.floor;
			records.push(r);
			//});
		})
		.error(function(err){fn(err, null)})
		.success(function(){
			console.log("find records", records.length);
			fn(null, records);
		});
}

/*
 * records: already sorted by time
 */
function generate_tl_data(records, start, end, step){
	records.forEach(function(r){r.dateTime = new Date(r.date_time)});
	var res = {
		start  : start,
		end    : end,
		time   : [],
		count  : [],
		values : []
	};
	var binNum = (end - start)/step;
	var time   = res.time,
			count  = res.count,
			values = res.values,
				i    = -1;
	while(++i <= binNum){
		var t = start + i*step,
			dt  = new Date(t);
		time.push(t);
		count.push(0);
		values.push([]);
	}
	i = -1;
	while(++i < records.length){
		var iBin = parseInt((records[i].dateTime - start)/step);
		count[iBin]++;
		values[iBin].push(records[i]);
	}
	return res;
}

/*
 * fn(err, paths)
 *  - paths:[{mac:, records:[]}]
 * note: log in same ap in sequential may occur
 */
function find_path(db, start, end, fn){
	var records_c = db.get("records");
	//records_c.col.aggregate([{$match:{date_time:{"$lte":new Date(1378041132000)}}},{$group:{_id:"$mac", count:{$sum:1}}}])
	var match = {$match:{date_time:{"$gte": new Date(start), "$lte": new Date(end)}}};
	var sort = {$sort:{date_time:1, mac:1}};
	var group = {$group:{_id: "$mac", total:{$sum:1}, records:{$push:"$$ROOT"}}};
	var project = {$project:{mac:"$_id", _id:0, records:1}};
	var pipeline = [sort, match, group, project];
	records_c.col.aggregate(pipeline, fn);
}

/*
 *
 */
function find_path_by_mac(db, start, end, mac, fn){
	console.log("mac",mac);
	var filter = {mac: mac};
	var sort = {sort: {date_time: 1}};
	db.get('records').find(filter, sort, fn);
}
module.exports = router;

