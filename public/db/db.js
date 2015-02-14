var WFV = WFV || {};

//
//
//

WFV.DATA_PATH = WFV.DATA_PATH || "../data/";

WFV.AP_FILE_PATH = WFV.DATA_PATH + "APS.csv";

WFV.date_format = d3.time.format("%Y-%m-%d");

// convert a Date obj to Date Obj
WFV.time_to_date= function(time){
	var str = WFV.date_format(time);
	return WFV.date_format.parse(str);
}

Date.prototype.to_date = function(){
	return WFV.time_to_date(this);
}
Date.prototype.to_date_str = function(){
	return WFV.date_format(this);
}
Date.prototype.to_time_str = function(){
	var format = d3.time.format("%Y-%m-%d %H:%M:%S");
	return format(this);
}

WFV.file_path = function(date){
	var fname = WFV.date_format(date);
	return WFV.DATA_PATH + "September/" + fname + ".csv";
}

/*
 * WFV_DB object
 * used to fetch data
 */
function WFV_DB(dateFrom, dateTo){
	var format = WFV.time_to_date;
	this.dateFrom = format(dateFrom);
	this.dateTo = format(dateTo);
	//
	this.aps;
	this.apMap;
	this.records;
	this.recordsByDate;
	this.paths;
	this.pathByMac;
}

WFV_DB.prototype.init = function(cb){
	this.aps = [];
	this.apMap = d3.map();
	this.records = [];
	this.recordsByDate = d3.map();
	this.paths = [];
	this.pathByMac = d3.map();
	var that = this;
	//
	console.log("GET aps:");
	d3.csv(WFV.AP_FILE_PATH, function(err, aps){
		if(err){
			console.error(err);
		}else{
			console.log("result:", aps.length);
			that.aps = aps;
			aps.forEach(function(ap){
				ap.apid = +ap.apid;
				ap.floor = +ap.floor;
				ap.pox_x = +ap.x;
				ap.pos_y = +ap.y;
				delete ap.x;
				delete ap.y;
			});
			that.aps.forEach(function(ap){that.apMap.set(ap.apid, ap)});
			_init_records(cb);
		}
	});

	function _init_records(cb){
		var dLst = [], d = new Date(that.dateFrom);
		while(d - that.dateTo <= 0){
			dLst.push(d);
			d = new Date(d.getTime() + 1000 * 60 * 60 * 24);
		}
		var len = dLst.length, timeFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
		(function next(i){
			if(i < len){
				console.log("GET records on", WFV.date_format(dLst[i]));
				d3.csv(WFV.file_path(dLst[i]), function(err, records){
					if(err){
						console.error(err);
					}else{
						console.log("result:", records.length);
						records.forEach(function(r){
							r.apid = +r.apid;
							r.mac = r.mac + "";
							r.date_time = timeFormat.parse(r.date_time);
							undefined === r.floor || (r.floor = +r.floor);
							r.ap = that.apMap.get(r.apid);
						});
						that.recordsByDate.set(dLst[i].to_date_str(), records);
						that.records = that.records.concat(records);
						next(i+1);
					}
				});
			}else{
				compute_path();
				console.log("init records done");
				cb && cb(that);
			}
		})(0);
	}

	function compute_path(){
		that.paths = d3.nest().key(function(r){return r.mac})
			.entries(that.records).map(function(o){
				that.pathByMac.set(o.key, o.values);
				return o.values;
			});
		console.log("compute paths done", that.paths.length);
	}
}

WFV_DB.compute_path = function(records){
	var paths = d3.nest().key(function(r){return r.mac})
		.entries(records).map(function(o){
			that.pathByMac.set(o.key, o.values);
			return o.values;
		});
}

WFV_DB.prototype.records_by_date = function(date, cb){
	if(!date instanceof Date){
		console.warn(date, "is not a Date instance");
	}
	var key = date.to_date_str();
	var res = this.recordsByDate.get(key).map(utils.identity);
	console.log("get records on", key, "result:", res.length);
	if(cb){
		cb(res);
	}
	else{
		return res;
	}
}

WFV_DB.prototype.records_by_interval = function(from, to, cb){
	console.log("get records by interval", from.to_time_str(), to.to_time_str());
	var records = this.records.filter(function(r){
		return r.date_time - from >= 0
			&& to - r.date_time > 0;
	});	
	if(cb){
		cb(records);
	}else{
		return records;
	}
}

WFV_DB.prototype.ap_by_id = function(apid, cb){
	var ap = this.apById.get(apid);
	if(cb){
		cb(ap);
	}else{
		return ap;
	}
}

WFV_DB.prototype.aps_all = function(cb){
	var aps = this.aps.map(function(ap){return ap});
	if(cb){
		cb(aps);
	}else{
		return aps;
	}
}

WFV_DB.prototype.path_all = function(from, to, cb){
	var paths = this.paths.map(utils.identity);
	if(from){
		paths = paths.map(function(path){
			return path.filter(function(r){
				return r.date_time - from >= 0;
			});
		});
	}
	if(to){
		paths = paths.map(function(path){
			return path.filter(function(r){
				return to - r.date_time > 0;
			});
		});
	}
	var res = paths.filter(function(path){return path.length > 0});
	if(cb){
		cb(res);
	}else{
		return res;
	}
}

WFV_DB.prototype.path_by_mac = function(mac, from, to, cb){
	var path = this.pathByMac.get(mac).map(utils.identity);
	if(from){
		path = path.filter(function(r){return r.date_time - from >= 0});
	}
	if(to){
		path = path.filter(function(r){return to - r.date_time > 0});
	}
	if(cb){
		cb(path);
	}else{
		return path;
	}
}

/*
 * graph_info function return a array of links,
 * the nodes are aps
 * link: {
 * 	source: apid
 * 	target: apid
 * 	wieght: apid
 * 	macs: apid
 * }
 */
WFV_DB.prototype.graph_info = function(from, to, cb){
	var paths = this.path_all(from, to);
	var links = paths_to_links(paths);
	if(cb){
		cb(links);
	}else{
		return links;
	}
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
}

WFV_DB.prototype.tl_data = function(from, to, stepBy, stepCount){

}
