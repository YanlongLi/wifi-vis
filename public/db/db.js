(function(){
	Date.prototype.to_date = function(){
		var format = d3.time.format("%Y-%m-%d");
		var date_str = format(this);
		return format.parse(date_str);
	}
	Date.prototype.to_date_str = function(){
		var format = d3.time.format("%Y-%m-%d");
		return format(this);
	}
	Date.prototype.to_time_str = function(){
		var format = d3.time.format("%Y-%m-%d %H:%M:%S");
		return format(this);
	}
	Date.prototype.to_24_str = function(){
		var format = d3.time.format("%H:%M:%S");
		return format(this);
	}
})();

var WFV = WFV || {};

//
//
//

WFV.DATA_PATH = WFV.DATA_PATH || function(){return "data/"};

WFV.AP_FILE_PATH = function(){return WFV.DATA_PATH() + "APS.csv"};
WFV.MAC_FILE_PATH = function(){return WFV.DATA_PATH() + "macid.csv"};

WFV.date_format = d3.time.format("%Y-%m-%d");

var loading_tip = (function(){
	var loading_tip = {};
	var tip_div = $("#loading-tip");
	loading_tip.add_tip = function(str){
		var p = "<div>"+str+"</div>";
		tip_div.append(p);
	};
	return loading_tip;
})();

// convert a Date obj to Date Obj
WFV.time_to_date= function(time){
	var format = d3.time.format("%Y-%m-%d");
	var str = format(time);
	return format.parse(str);
}


WFV.file_path = function(date){
	var fname = WFV.date_format(date);
	return WFV.DATA_PATH() + "September/" + fname + ".csv";
}

/*
 * WFV_DB object
 * used to fetch data
 */
function WFV_DB(dateFrom, dateTo){
	//var format = WFV.time_to_date;
	this.dateFrom = format(new Date(dateFrom));
	this.dateTo = format(new Date(dateTo));
	//this.dateTo.setDate(this.dateTo.getDate()+1);
	//
	this.aps;
	this.apMap;
	this.records;
	this.recordsByDate;
	this.recordsOfFloor; //[]
	this.paths;
	this.pathByMac;
	//
	this.recordsByRange;//key:"t1+t1",value:records
	//
	function format(date){
		return new Date(date.toDateString());
	}
}

WFV_DB.prototype.init = function(cb){
	this.aps = [];
	this.apMap = d3.map();
	this.records = [];
	this.recordsByDate = d3.map();
	this.recordsOfFloor = [];
	this.paths = [];
	this.pathByMac = d3.map();
	this.recordsByRange = d3.map();
	this.macs;
	this.macIdByMac = d3.map();
	var that = this;
	//
	console.log("GET aps:");
	loading_tip.add_tip("GET aps ...");
	d3.csv(WFV.AP_FILE_PATH(), function(err, aps){
		if(err){
			console.error(err);
		}else{
			console.log("result: ", aps.length);
			loading_tip.add_tip("result: " +  aps.length);
			that.aps = aps;
			var _id = 0;
			aps.forEach(function(ap){
				ap._id = _id++;
				ap.apid = +ap.apid;
				ap.floor = +ap.floor;
				ap.pos_x = +ap.x;
				ap.pos_y = +ap.y;
				delete ap.x;
				delete ap.y;
				that.apMap.set(ap.apid, ap);
			});
			//that.aps.forEach(function(ap){that.apMap.set(ap.apid, ap)});
			_init_records(cb);
		}
	});

	function _init_records(cb){
		var dLst = [], d = new Date(that.dateFrom);
		while(d - that.dateTo < 0){
			dLst.push(d);
			// d = new Date(d.getTime() + 1000 * 60 * 60 * 24);
			d = new Date(d);
			d.setDate(d.getDate()+1);
		}
		var len = dLst.length, timeFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
		dLst.forEach(timeFormat);
		(function next(i){
			if(i < len){
				console.log("GET records on", WFV.date_format(dLst[i]));
				loading_tip.add_tip("GET records on " + WFV.date_format(dLst[i]));
				d3.csv(WFV.file_path(dLst[i]), function(err, records){
					if(err){
						console.error(err);
					}else{
						console.log("result:", records.length);
						loading_tip.add_tip("result: " + records.length);
						records.forEach(function(r){
							r.apid = +r.apid;
							r.mac = r.mac + "";
							r.date_time = timeFormat.parse(r.date_time);
							r.ap = that.apMap.get(r.apid);
							//r.floor = +r.ap.floor;
							(undefined === r.floor) && (r.floor = +r.ap.floor);
						});
						that.recordsByDate.set(dLst[i].toDateString(), records);
						that.records = that.records.concat(records);
						next(i+1);
					}
				});
			}else{
				_compute_path();
				_init_macid();
				// TODO
				// _compute_records_of_floor();
				console.log("init records done");
				cb && cb(that);
			}
		})(0);
	}

	function _init_macid(){
		console.log("GET macs:")
		d3.csv(WFV.MAC_FILE_PATH(), function(err, macs){
			if(err){
				console.error(err);
			}else{
				console.log("result:", macs.length);
				that.macs = macs;
				macs.forEach(function(m){
					that.macIdByMac.set(m.mac, m.macid);
				});
			}
		});
	}
	function _compute_path(){
		that.paths = d3.nest().key(function(r){return r.mac})
			.entries(that.records).map(function(o){
				that.pathByMac.set(o.key, o.values);
				return o.values;
			});
		console.log("compute paths done", that.paths.length);
	}
	function _compute_records_of_floor(){
		that.recordsOfFloor	 = d3.range(0, 18).map(function(){return []});
		that.records.forEach(function(r){
			if(undefined === r.floor || r.floor < 1 || r.floor > 17){
				console.warn("no floor info");
			}else{
				that.recordsOfFloor[+r.floor].push(r);
			}
		});		
		console.log("compute records of floor done");
		console.log(that.recordsOfFloor.map(function(d){return d.length}).join(","));
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
	//var key = date.to_date_str();
	var res = this.recordsByDate.get(date.toDateString()).map(utils.identity);
	console.log("get records on", date.toDateString(), "result:", res.length);
	if(cb){
		cb(res);
	}
	else{
		return res;
	}
}

WFV_DB.prototype.records_by_interval = function(from, to, cb){
	var records, key = from.getTime()+","+to.getTime();
	if(this.recordsByRange.has(key)){
		records = this.recordsByRange.get(key);
		console.log("get records by key",from.toLocaleString(),to.toLocaleString(), records.length);
	}else{
		records = this._records_by_interval(from, to);
		this.recordsByRange.set(key, records);
	}
	if(cb){
		console.log(records.length);
		cb(records);
	}else{
		return records;
	}
}

WFV_DB.prototype._records_by_interval = function(_from, _to){
	console.log("get records by interval", _from.to_time_str(), _to.to_time_str());
	if(from - this.dateFrom <= 0 && to - this.dateTo >= 0){
	 return this.records.map(function(d){return d});
	}
	var from = new Date(_from), to = new Date(_to - 1);
	var res = [], dateRecords, curDate = new Date(from.toDateString());
	while(true){
		console.log("get records on ", curDate.toDateString());
		dateRecords = this.recordsByDate.get(curDate.toDateString());
		if(!dateRecords || !dateRecords.length) continue;
		if(curDate.toDateString() == from.toDateString()){
			var f = dateRecords.lastIndexOfLess(from.getTime(), function(r){
				return r.date_time.getTime();
			});
			dateRecords = dateRecords.slice(f+1);
			// console.log("f", f);
			console.log(dateRecords.length);
		}
		// console.log("cur", curDate.toDateString());
		// console.log("to", to.toDateString());
		if(curDate.toDateString() == to.toDateString()){
			var t = dateRecords.firstIndexOfGreater(to.getTime(), function(r){return r.date_time.getTime()});
			// console.log("t", t);
			dateRecords = dateRecords.slice(0,t);
			res = res.concat(dateRecords);
			break;
		}
		res = res.concat(dateRecords);
		curDate.setDate(curDate.getDate()+1);
	}
	return res;
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

WFV_DB.prototype.macs_by_ap = function(from, to, apid, cb){
	// params for callback function: [{mac:, count:, records:}]
	if(!cb){
		console.warn("no callback function");
		return;
	}
	this.records_by_interval(from, to, function(records){
		records = records.filter(function(r){return r.apid == apid});
		var res = d3.nest().key(function(r){return r.mac})
			.rollup(function(leaves){return leaves})
			.entries(records).map(function(d){
				return {mac:d.key, count:d.values.length, records:d.values};
			});	
		if(!res.length){
			console.warn("no macs on ap in time interval");
		}
		console.log("get mac list on ap", res.length);
		cb(res);
	});
}

WFV_DB.prototype.macid_by_mac = function(mac){
	if(!this.macIdByMac.has(mac)){
		console.warn("mac not found");
	}
	return +this.macIdByMac.get(mac);
}

WFV_DB.prototype.ap_bar_data = function(from, to, cb){
	// generage ap_bar_data, [floor:, aps:[{apid, count}], count:]
	this.records_by_interval(from, to, _structure_records);
	function _structure_records(records){
		var data = d3.nest().key(function(r){return r.floor}).sortKeys(d3.asceding)
			.key(function(r){return r.apid}).sortKeys(d3.asceding)
			.rollup(function(leaves){return leaves})
			.entries(records);
		data.forEach(function(f){
			f.floor = +f.key; delete f.key;
			f.aps = f.values; delete f.values;
			var macs = [];
			f.aps.forEach(function(ap){
				ap.apid = +ap.key; delete ap.key;
				//ap.count = ap.values; delete ap.values;
				ap.count = _.uniq(ap.values, function(d){return d.mac}).length;
				ap.floor = f.floor;
				macs = macs.concat(ap.values);
			});
			// f.count = d3.sum(f.aps, function(ap){return ap.count});
			f.count = _.uniq(macs, function(d){return d.mac}).length;
			f.type = "floor";
		});
		cb && cb(data);
	}
}

/*
 * graph_info function return a array of links,
 * the nodes are aps
 * link: {
 * 	source: apid
 * 	target: apid
 * 	wieght: 
 * 	macs: [macs]
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

WFV_DB.prototype.tl_data_all = function(from, to, step, cb){
	this.records_by_interval(from, to, function(records){
		var tl_data = generate_tl_data(records, from.getTime(), to.getTime(), step);
		cb(tl_data);
	});
}

WFV_DB.prototype.tl_data_floor = function(from, to, step, floor, cb){
	this.records_by_interval(from, to, function(records){
		records = records.filter(function(r){return +r.floor == +floor});
		var tl_data = generate_tl_data(records, from.getTime(), to.getTime(), step);
		tl_data.floor = +floor;
		cb({floor:+floor, tl_data:tl_data});
	});
}
WFV_DB.prototype.tl_data_ap = function(from, to, step, apid, cb){
	this.records_by_interval(from, to, function(records){
		records = records.filter(function(r){return +r.apid == +apid});
		var tl_data = generate_tl_data(records, from.getTime(), to.getTime(), step);
		tl_data.apid = +apid;
		cb({apid:+apid, tl_data:tl_data});
	});		
}
 
WFV_DB.prototype.tl_data_aps_of_floor = function(from, to, step, floor, cb){
	/*
	 * cb: [{apid, tl_data:[{time:,count:}]}].floor	
	 */
	this.records_by_interval(from, to, function(records){
		var rs = records.filter(function(r){return +r.floor == +floor});
		var records_by_ap =  _nest_records_by_ap(rs);
		var len = records_by_ap.length, res = [];
		console.log("aps on floor", floor, len);
		(function next(i){
			if(i < len){
				var r_of_ap = records_by_ap[i];
				var tl_data = generate_tl_data(r_of_ap.records, from.getTime(), to.getTime(), step);	
				res.push({apid:+r_of_ap.apid, tl_data:tl_data, floor:floor});
				next(i+1)
			}else{
				res.floor = floor;
				cb(res);	
			}
		})(0);
	});
	function _nest_records_by_ap(records)	{
		var r_by_ap = d3.nest().key(function(r){return +r.apid})
			.rollup(function(d){return d})
			.entries(records);
		console.log(r_by_ap.length);
		return r_by_ap.map(function(d){
			return {apid:d.key, records: d.values};
		});
	};
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
	console.log("step:",step);
	console.log("bin num:", binNum);
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
	var data = res;
	return data.time.map(function(time,i){
		var count = _.uniq(data.values[i], function(d){return d.mac}).length;
		return {
			time   : time,
			count  : count,
			values : data.values[i]
		}
	});
}
