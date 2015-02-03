var fs = require('fs');
var path = require('path');
var csv = require('fast-csv');

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/wifi-vis');

var aps = db.get('aps');
var records = db.get('records');


var AP_FILE_PATH = path.join(__dirname, '../public/data/APS.csv');

var apStream = fs.createReadStream(AP_FILE_PATH);

var rcFileName = ["2013-09-01.csv", "2013-09-02.csv", "2013-09-03.csv", "2013-09-04.csv",
"2013-09-05.csv", "2013-09-06.csv", "2013-09-07.csv", "2013-09-08.csv",
"2013-09-09.csv", "2013-09-10.csv", "2013-09-11.csv", "2013-09-12.csv",
"2013-09-13.csv", "2013-09-14.csv", "2013-09-15.csv", "2013-09-16.csv",
"2013-09-17.csv", "2013-09-18.csv", "2013-09-19.csv", "2013-09-20.csv",
"2013-09-21.csv", "2013-09-22.csv", "2013-09-23.csv", "2013-09-24.csv",
"2013-09-25.csv", "2013-09-26.csv", "2013-09-27.csv", "2013-09-28.csv",
"2013-09-29.csv", "2013-09-30.csv"];

batchInsert(apStream, aps, function(c){
	console.log("insert aps done:", c);
	help(0, rcFileName.length, function(){
		console.log("All Done");
	});
});

function help(index, len, cb){
	if(index == len){
		cb();
	}else{
		var fname = rcFileName[index];
		var csvPath = path.join(__dirname,'../public/data/September/', fname);
		var rcStream = fs.createReadStream(csvPath);
		batchInsert(rcStream,records, function(c){
			console.log(csvPath,"done:",c);
			help(index+1, len, cb);
		});
	}
};


/*
rcFileName.forEach(function(fname){
	var csvPath = path.join(__dirname,'../public/data/September/', fname);
	var rcStream = fs.createReadStream(csvPath);
	batchInsert(rcStream,records, function(c){console.log(csvPath,"done:",c)});
});
*/

function batchInsert(stream, collection, next){
	var count = 0;
	var apCsv = csv({headers:true}).on('data',function(ap, err){
		if(err) console.log(err);
		else{
			collection.insert(ap, function(err,doc){
				if(err) throw err;
				db.close();
			});
			count++;
		}
	}).on('end',function(err){
		if(next) next(count);
	});
	stream.pipe(apCsv);
}

