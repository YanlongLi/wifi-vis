WifiVis.DataHelper = (function(){
	var Helper = {};
	Helper.groupRecordsByMac = groupRecordsByMac;
	Helper.recordsToNodeLink = recordsToNodeLink;
	Helper.sortRecordsByMacAndTime = sortRecordsByMacAndTime;
	Helper.removeDuplicateRecords = removeDuplicateRecords;
	function groupRecordsByMac(records){
		var map = d3.map();
		var nested = d3.nest().key(function(record){return record.mac})
			.sortValues(function(r1,r2){return r1.dateTime - r2.dateTime})
			.entries(records);
		console.log("groupRecordsByMac:", nested.length);
		return nested.map(function(ent){
			return ent.values;
		});
	}
	/*
	 *  records are sorted by mac and date_time
	 */
	function recordsToNodeLink(records){
		console.log("recordsToNodeLink:", records.length);
		//console.log(records.slice(0,100).map(function(d){return d.mac}));
		var nodeMap = d3.map(), linkMap = d3.map();
		var i = 0, len = records.length, cur, pre;
		if(len == 0){
			return {nodes:[],links:[]}
		}else{
			var r = records[0];
			nodeMap.set(r.apid, r.ap);
			r.ap.w = 1;
			pre = r.ap;
		}
		while(++i < len){
			var r = records[i];
			cur = nodeMap.get(r.apid);
			if(!cur){
				cur = r.ap;
				cur.w = 1;
				nodeMap.set(r.apid, cur);
			}else{
				cur.w++;
			}
			if(records[i].mac == records[i-1].mac){
				var key = pre.apid + "," + cur.apid;
				if(linkMap.has(key)){
					var l = linkMap.get(key);
					l.weight = l.weight+1;
					linkMap.set(key,l);
				}else{
					linkMap.set(key,{source:pre, target:cur, weight:1});
				}
			}
			pre = cur;
		}
		var nodes = nodeMap.values().filter(function(d){
			return d.w > 1;
		});
		// console.log(nodes.map(function(d){return d.weight}));
		return {nodes:nodes,links:linkMap.values()}
	}
	function sortRecordsByMacAndTime(records){
		records.sort(function(r1, r2){
			if(r1.mac != r2.mac){
				return r1.mac > r2.mac;
			}
			return r1.date_time > r2.date_time;
		});
		return records;
	}
	function removeDuplicateRecords(records){
		var res = [], i = 0, len = records.length, pre, cur;
		if(len == 0) return [];
		res.push(records[0]);
		pre = records[0];
		while(++i < len){
			cur = records[i];
			if(cur.mac != pre.mac || cur.apid != pre.apid){
				res.push(cur);
				pre = cur;
			}
		}
		return res;
	}
	return Helper;
})();

WifiVis.ApCenter = function(){
	function ApCenter(){}
	
	var aps, apsByFloor = d3.map();

	ApCenter.init = init;
	ApCenter.findAps = findAps;
	ApCenter.findAllAps = findAllAps;
	ApCenter.findApById = findApById;
	ApCenter.findAllApsOnFloor = findAllApsOnFloor;

	function init(_aps){
		aps = _aps.map(function(ap){
			ap.apid = +ap.apid;
			ap.floor = +ap.floor;
			ap.pos_x = +ap.x;
			ap.pos_y = +ap.y;
			delete ap.x;
			delete ap.y;
			return ap;
		});
		aps.sort(function(a1, a2){
			return a1.id > a2.id;
		});
		console.log("load aps:", aps.length);
		//
		aps.forEach(function(ap){
			if(!apsByFloor.has(ap.floor)){
				apsByFloor.set(ap.floor, []);
			}
			var v = apsByFloor.get(ap.floor);
			v.push(ap);
		});
		//
		apsByFloor.forEach(function(key, val){
			console.log("aps at floor "+key+":",val.length);
		});
	}

	function findAllAps(){
		return aps.map(function(d){return d});
	}

	function findAllApsOnFloor(f){
		return apsByFloor.get(f).map(function(d){return d});
	}
	function findApById(apid){
		var opt = {};
		opt.apFilter = function(ap){return ap.apid === apid};
		return findAps(opt);
	}
	/*
	 * find_aps(option)
	 * option.floors: floor array
	 * option.apFilter:
	 */
	function findAps(option){
		if(!option){
			console.log("find all aps:", aps.length);
			return aps.map(utils.identity);
		}
		var rAps = [];
		var floors = option.floors, apFilter = option.apFilter;
		if(floors && floors.length){
			console.log("find aps on floor:", floors);
			floors.forEach(function(iF){
				if(!apsByFloor[iF]){
					console.warn("there is no floor No.",iF);
				}else{
					rAps = rAps.concat(apsByFloor[iF]);
				}
			});
		}else{
			rAps = aps.map(utils.identity);
		}
		if(apFilter){
			rAps = rAps.filter(apFilter);
		}
		console.log("find aps:", rAps.length);
		return rAps;
	}
	return ApCenter;
};

WifiVis.RecordCenter = function(apCenter){
	function RecordCenter(){}
	var records;
	var format = d3.time.format("%Y-%m-%d %H:%M:%S");
	
	RecordCenter.init = init;
	RecordCenter.findAllRecords = findAllRecords;
	RecordCenter.findRecords = findRecords;
	//
	RecordCenter.findAllRecordsOnFloor = function(f){
		return records.filter(function(r){
			if(!r.ap || !r.ap.floor){
				console.warn("no ap or no ap.floor", r);
			}
			return r.ap.floor == f;
		})
	}

	function init(_records){
		var aps = apCenter.findAllAps();
		records = _records.map(function(r){
			r.apid = +r.apid;
			r.dateTime = format.parse(r.date_time);
			//
			var ap = aps.filter(function(ap){return ap.apid === r.apid})[0];
			if(!ap) utils.warn("apid not exist");
			//
			r.ap = ap;
			return r;
		});
		console.log("load records:", records.length);
	}
	function findRecords(filter){
		if(!filter){
			return records.map(utils.identity);
		}else{
			return records.filter(filter);
		}
	}
	function findAllRecords(){
		return findRecords();
	}
	return RecordCenter;
};


WifiVis.PathCenter = function(recordCenter){
	function PathCenter(){}
	var records, pathByFloor;
	var nodeMap = d3.map(), linkMap = d3.map();

	PathCenter.init = init;
	PathCenter.findAllPath = findAllPath;
	function init(){
		records = recordCenter.findAllRecords();
		pathByMac = _groupByMac(records);
	}
	function findAllPath(){
		return pathByMac.values();
	}
	function _pathNodeLink(){
		pathByMac.values().forEach()
	}
	function pathToNodeLink(nodeMap, linkMap, path){
		var i = 0, len = path.length, cur, pre;
		if(len == 0 || len == 1) return;
		path.map(function(r){return r.ap}).forEach(function(ap){
			if(nodeMap.has(ap.apid)){
				nodeMap.get(ap.apid).w ++;
			}else{
				ap.w = 1;
				nodeMap.set(ap.apid, ap);
			}
		});
		path.map(function(r,i){
			if(i == 0) return null;
			var pre = path[i-1], key = pre.apid+","+r.apid;
			return {key:key,link:{source:pre, target:r, weight:1}};
		}).shift().forEach(function(o){
			if(linkMap.has(o.key)){
				linkMap.get(o.key).weight++;
			}else{
				linkMap.set(o.key, o.link);
			}
		});
	}
	function _groupByMac(records){
		var map = d3.map();
		var nested = d3.nest().key(function(record){return record.mac})
			.sortValues(function(r1,r2){return r1.dateTime - r2.dateTime})
			.entries(records);
		nested.forEach(function(o){
			var key = o.key,
					values = WifiVis.DataHelper.removeDuplicateRecords(o.values);
		});
		return map;
	}
	return PathCenter;
};


/*
WifiVis.PathDataCenter = function(key){
	var dCenter;
	if((dCenter = this.dataCenterManager.get(key))){
		return dCenter;	

	}
	utils.log(["init path data center:"+key]);
	function PathDataCenter(){};

	var records, recordsByMac, recordsByFloor;
	
	PathDataCenter.init = init;
	PathDataCenter.groupByMac = groupByMac;
	PathDataCenter.findPathByMac = findPathByMac;
	PathDataCenter.findAllPath = findAllPath;
	PathDataCenter.pathToForceNodeLink = pathToForceNodeLink;

	//PathDataCenter.groupByMac = groupByMac;
	//PathDataCenter.groupByFloor = groupByFloor;

	function init(_records){
		records = _records;	
		recordsByMac = groupByMac(records);
		//recordsByFloor = groupByFloor(records);
	}
	function groupByMac(records){
		var map = d3.map();
		var nested = d3.nest().key(function(record){return record.mac})
			.sortValues(function(r1,r2){return r1.dateTime - r2.dateTime})
			.entries(records);
		utils.log(["recordsByMac:", nested.length]);
		nested.forEach(function(o){
			if(o.values.length){
				map.set(o.key, o.values);
			}
		});
		return map;
	}
	function groupByFloor(records){
		var map = d3.map();
		var nested = d3.nest().key(function(record){return record.ap.floor})
			.sortValues(function(r1,r2){return r1.dateTime - r2.dateTime})
			.entries(records);
		utils.log(["recordsByFloor:"]);
		nested.forEach(function(o){
			utils.log([o.key, o.values.length]);
			map.set(o.key, o.values);
		});
		return map;
	}
	function findPathByMac(mac){
		return recordsByMac.get(mac);
	}
	function findAllPath(t1, t2){
		var pathArr = recordsByMac.values();
		console.log(pathArr.length);
		if(!t1 && !t2) return pathArr;
		return pathArr.map(function(path){
			return _slicePathByTime(path, t1, t2);
		}).filter(function(path){return path.length > 0});
	}
	function _slicePathByTime(records, t1, t2){
		if(!t1 && !t2){
			utils.warn(["no start and end time"]);
			return;
		}
		if(t1 && !t2){
			return records.filter(function(r){
				return r.dateTime >= t1;
			});
		}
		if(!t1 && t2){
			return records.filter(function(r){
				return r.dateTime <= t2;
			})
		};
		return records.filter(function(r){
			return r.dateTime >= t1 && r.dateTime <= t2;
		});	
	}
	function _cutPathByFloor(path){
		var pathByFloor = [], len = path.length,
				i = -1, curF = -1, curPath, r;
		while(++i < len){
			if(+(r = path[i]).ap.floor === +curF){
				curPath.push(r);
			}else{
				pathByFloor.push(curPath);
				curPath = [r];
			}
		}
		return pathByFloor;	
	}
	function pathToForceNodeLink(allPath){
		var links = [], nodes = d3.set();
		allPath.forEach(function(path){
			var i = -1, len = path.length;
			while(++i < len - 1){
				var source = path[i].apid,
					target = path[i+1].apid;
				nodes.add(path[i].apid);
				links.push({source:source, target:target});
			}
			nodes.add(path[i].apid);
		});
		console.log("links:", links.length);
		console.log("nodes:", nodes.values().length);
		return {nodes:nodes.values(),links:links};
	}
	return PathDataCenter;
};
*/
