
/*
 *
 */
function Device(mac, path){
	this.mac = mac;
	this.path = path;
	this.curAp = null;
	this.cur = -1;
}

Device.prototype.moveForward = function(){
	if(this.cur == this.path.length -1){
		console.warn("move to the exceed");
		return;
	}
	if(this.cur != -1){
		this.path[this.cur].ap.removeDevice(this);
	}
	this.cur ++;
	this.path[this.cur].ap.addDevice(this);
}

Device.prototype.moveBackward = function(){
	if(this.cur == -1){
		console.warn("move back exceed");
		return;
	}
	this.path[this.cur].ap.removeDevice(this);
	this.cur --;
	if(this.cur != -1){
		this.path[this.cur].ap.addDevice(this);
	}
}

Device.prototype.stayTime = function(time){
	if(this.cur == -1){
		console.warn("device not login");
		return 0;
	}
	return time - this.path[this.cur].date_time;
}

/*
 * AccessPoint
 */
function AccessPoint(ap){
	this.apid = +ap.apid;
	this.name = ap.name;
	this.floor = +ap.floor;
	this.pos_x = +ap.pos_x;
	this.pos_y = +ap.pos_y;
	this.cluster = new DeviceCluster(this.apid);
}

AccessPoint.prototype.addDevice = function(device){
	this.cluster.addDevice(device);
}

AccessPoint.prototype.removeDevice = function(device){
	this.cluster.removeDevice(device);
}

AccessPoint.prototype.displayName = function(_ap){
	var ap = _ap ? _ap : this;
	var name = ap.name.split(/ap|f/);
	name.shift();
	return name.join("-");
}

// records:[{time, mac, apid}], aps:[{apid, pos_x, pos_y, floor}]
function RecordTracer(records, aps){
	this.records = null;
	this.aps = null;
	this.apMap = d3.map();
	this.devices = null;
	this.deviceMap = d3.map();
	this.cur = -1;
}
RecordTracer.prototype.init = function(records, aps){
	var that = this;
	that.records = records.map(function(r){
		return {date_time:r.date_time,
			mac: r.mac,
			apid: r.apid};
	});
	//
	that.aps = aps.map(function(ap){
		var a = new AccessPoint(ap);
		that.apMap.set(+a.apid, a);
		return a;
	});
	that.devices = d3.nest().key(function(d){return d.mac})
		.entries(that.records).map(function(d){
			var device = new Device(d.key, d.values);
			d.values.forEach(function(r){
				r.device = device;
				r.ap = that.apMap.get(+r.apid);
			});
			that.deviceMap.set(d.key, device);
			return device;
		});
}

RecordTracer.prototype.moveOn = function(){
	if(this.cur == this.records.length - 1){
		console.warn("tracer at the end");
		return false;
	}
	this.cur ++;
	this.records[this.cur].device.moveForward();
	return true;
}
RecordTracer.prototype.moveBack = function(){
	if(this.cur == -1){
		console.warn("tracer at the begin");
		return false;
	}
	this.records[this.cur].device.moveBackward();
	this.cur --;
	return true;
}
RecordTracer.prototype.gotoTime = function(time, cb){
	var to = 0;
	if(time - this.records[0].date_time < 0){
		to = -1;
		while(this.cur != to){
			this.moveBack();
		}
	}else if(time - this.records[this.records.length - 1].date_time >= 0){
		to = this.records.length - 1;
		while(this.cur != to){
			this.moveOn();
		}
	}else{
		this.moveOn();
		var curTime = this.records[this.cur].date_time;
		if(time - curTime > 0){
			while(this.records[this.cur + 1].date_time - time<= 0){
				this.moveOn();
			}
		}else if(time - curTime < 0){
			while(this.records[this.cur].date_time - time > 0){
				this.moveBack();
			}	
		}else{}
	}
	cb && cb();
}

/*
 *
 */
function DeviceCluster(apid){
	this.apid = apid;
	//
	this.r = 4;
	this.level = 12;
	//
	this.O = {};
	this.device_count = 0;
	this.timeout = 120;
}
DeviceCluster.prototype.addDevice = function(device){
	var mac = device.mac;
	if(this.O[mac]){
		console.warn("device already in cluster", this.apid, mac);
	}else{
		this.O[mac] = device;
		this.device_count ++;
	}
}
DeviceCluster.prototype.removeDevice = function(device){
	var mac = device.mac;
	if(!this.O[mac]){
		console.warn("device niot in cluster", this.apid, mac);
	}else{
		delete this.O[mac];
		this.device_count --;
	}
}

DeviceCluster.prototype.count = function(time_point, timeout){
	if(!time_point){
		return this.device_count;
	}
	return this._filterDevice(time_point, timeout).length;
}

DeviceCluster.prototype.deviceLst = function(time_point, timeout){
	var lst = this._filterDevice(time_point, timeout);
	var positions = square(this.r, this.level).slice(0, lst.length);
	lst.forEach(function(d,i){
		positions[i].device = d;
	});
	return positions;
	//
	function square(r, level) {
		var toReturn = [];
		toReturn.push({
			x: 0,
			y: 0
		});
		for (var i = 1; i < level; ++i) {
			for (var j = i; j > - i; --j) {
				toReturn.push({
					x: 2 * j * r,
					y: 2 * i * r
				});
			}
			for (j = i; j > - i; --j) {
				toReturn.push({
					x: - 2 * i * r,
					y: 2 * j * r
				});
			}
			for (j = - i; j < i; ++j) {
				toReturn.push({
					x: 2 * j * r,
					y: - 2 * i * r
				});
			}
			for (j = - 1; j < i; ++j) {
				toReturn.push({
					x: 2 * i * r,
					y: 2 * j * r
				});
			}
		}
		return toReturn;
	}
	function rectangle(r, _level){
		var pi = Math.PI;
		var level = _level + 2;
		var ns = _.range(2, level).map(function(d){
			return Math.pow(d, 2);
		});
		var dr = ns.map(function(d){return d * r / pi});
		var pos = ns.map(function(d, index){
			var pos = [];
			var perRadius = 2 * pi / d;
			for(var i = 0; i < d; i++){
				var radius = i * perRadius;
				var x = dr[index] * Math.cos(radius);
				var y = -dr[index] * Math.sin(radius);
				pos.push({x:x, y:y});
			}
			return pos;
		});
		return Array.prototype.concat.apply([], pos);
	}
}

DeviceCluster.prototype._filterDevice = function(timePoint, _timeout){
	var lst = [], timeout = _timeout || this.timeout;
	for(mac in this.O){
		lst.push(this.O[mac]);
	}
	if(timePoint){
		lst = lst.filter(function(device){
			return device.stayTime(timePoint) / (1000 * 60) < timeout;
		});
	}
	return lst;
}
