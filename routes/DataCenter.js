var wifiVis = require('./WifiVis');
var csv = require('fast-csv');
var fs = require('fs');
var d3 = require('d3');
var path = require('path');

var DataCenter = {};

// console.log(path.join(__dirname,'public/data/APS.csv'));

DataCenter.ApCenter = function(){
	if(this.apCenter){
		return this.apCenter;
	}

	function ApCenter(){}

	var nFloor = wifiVis.NUM_FLOOR;

	var aps = [], apsByFloor = d3.map();

	initApCenter();

	ApCenter.getApById = getApById;
	ApCenter.getApsByFloor = getApsByFloor;
	ApCenter.getApsByFloors = getApsByFloors;

	function initApCenter(){
		csv.fromPath(path.join(__dirname,'../public/data/APS.csv'), {headers:true})
			.on("data", function(data, err){
				if(err){
					console.warn(err);
					return;
				}
				aps.push(data);
			}).on("end", function(){
				console.log("load AP data END:", aps.length, aps[0]);
			});
	}
	function getApById(apid){
		return aps.filter(function(ap){return +ap.apid === +apid})[0];
	}
	function getApsByFloor(iF){
		if(iF < 0 || iF > nFloor){
			console.warn("invalid floor number:", iF);
			return [];
		}
		var arr;
		if((arr = apsByFloor.get(iF))){
			return arr;
		}
		arr = aps.filter(function(ap){return +ap.floor === +iF});
		apsByFloor.set(iF, arr);
		return arr;
	}
	function getApsByFloors(floors){
		var arr, i = -1;
		while(++i){
			arr = arr.concat(getApsByFloor(floors[i]));
		}
		return arr;
	}
	return ApCenter;
};

DataCenter.apCenter = DataCenter.ApCenter();


DataCenter.PathCenter = function(){
	if(this.pathCenter){
		return this.pathCenter;
	}
	function PathCenter(){}

	var records = [], pathByMac = d3.map();
	var apCenter = this.apCenter;

	initPathCenter();

	PathCenter.findPathByMac = function(mac){
		return pathByMac.get(mac);
	};
	PathCenter.findAllPathBetween = findAllPathBetween;

	function initPathCenter(){
		var rPath = '../public/data/September/2013-09-02.csv';
		csv.fromPath(path.join(__dirname,rPath), {headers:true})
			.on('data',function(r, err){
				if(err){
					console.warn(err);
					return;
				}
				r.ap = apCenter.getApById(r.apid);
				records.push(r);
			}).on('end', function(){
				console.log("load Records END:", records.length, records[0]);
				pathByMac = generatePathByMac(records);
			});
	}
	function generatePathByMac(rs){
		var map = d3.map();
		var nested = d3.nest().key(function(record){return record.mac})
			.sortValues(function(r1,r2){return r1.dateTime - r2.dateTime})
			.entries(rs);
		nested.forEach(function(o){
			if(o.values.length){
				map.set(o.key, o.values);
			}
		});
		return map;
	}
	function findAllPathBetween(pathArr, t1, t2){
		console.log("findAllPathBetween, pathNumber:",pathArr.length);
		if(!t1 && !t2) return pathArr;
		return pathArr.map(function(path){
			return _slicePathByTime(path, t1, t2);
		}).filter(function(path){return path.length > 0});
	}
	function _slicePathBetween(path, t1, t2){
		if(!t1 && !t2){
			console.warn("no start and end time");
			return;
		}
		if(t1 && !t2){
			return path.filter(function(r){
				return r.dateTime >= t1;
			});
		}
		if(!t1 && t2){
			return path.filter(function(r){
				return r.dateTime <= t2;
			})
		};
		return path.filter(function(r){
			return r.dateTime >= t1 && r.dateTime <= t2;
		});	
	}
	return PathCenter;
};

DataCenter.pathCenter = DataCenter.PathCenter();

module.exports = DataCenter;
