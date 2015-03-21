
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
	this.r = 4;
	this.level = 10;
	this.positions = square(this.r, this.level);
	this.posFlag = this.positions.map(function(){return false});
	this.deviceMap = d3.map();
	this.device_count = 0;
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
}
DeviceCluster.prototype.addDevice = function(device){
	if(this.deviceMap.has(device.mac)){
		console.warn("device already on cluster");
		return;
	}
	//console.log("add device to cluster begin", this.apid, device.mac);
	var i = -1, len = this.positions.length;
	while(++i < len){
		if(this.posFlag[i]){
			continue;
		}
		// add device to cluster
		//console.log('succeed');
		this.posFlag[i] = true;
		this.positions[i].device = device;
		this.deviceMap.set(device.mac, i);
		this.device_count ++;
		//console.log("add device to cluster end");
		////console.log("cluster positions:", this.positions);
		// update device position info
		return;
	}
	if(i == len){
		console.warn("cluster position overflow");
	}
}
DeviceCluster.prototype.removeDevice = function(device){
	if(!this.deviceMap.has(device.mac)){
		console.warn("remove device not int cluster");
		return;
	}
	//console.log("remove device from cluster begin", this.apid, device.mac);
	var pos = this.deviceMap.get(device.mac);
	// remove from cluster
	if(!this.posFlag[pos] == true){
		console.warn("remove device from empty position");
		return;
	}
	this.posFlag[pos] = false;
	delete this.positions[pos].device;
	this.deviceMap.remove(device.mac);
	this.device_count --;
	//console.log("remove device from cluster end");
}

DeviceCluster.prototype.count = function(time_point){
	if(!time_point){
		return this.device_count;
	}
	return this.deviceLst(time_point).length;
}

DeviceCluster.prototype.deviceLst = function(time_point){
	var res = this.positions.filter(function(p, i){
		return p.device != null && p.device != undefined;
		// return this.posFlag[i] === true;
	});	
	if(time_point){
		res = res.filter(function(p, i){
			return p.device.stayTime(time_point) / (1000 * 60) < 120;
		});
	}
	return res;
}
