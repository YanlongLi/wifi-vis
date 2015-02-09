
/*
 * timeFrom = new Date(2013,8,1),
 * timeTo   = new Date(2013,8,2);
 * apLst    = [], apMap = d3.map();
 * records  = []; // records are sorted and dup are removed
 *
 * using RecordTracer.CreateTracer
 *
 */

function Device(mac, index){
	this.mac = mac;
	this.deviceRoute = [];
	this.cur = -1;
	if(index){
		this.moveForward(index);
	}
}

/*
 * mvoe forward to the index record
 */
Device.prototype.moveForward = function(index){
	if(this.cur != -1){
		var r = records[this.deviceRoute[this.cur]];
		apMap.get(r.apid).cluster.removeDevice(this);
	}
	this.cur ++;
	if(this.cur === this.deviceRoute.length){
		this.deviceRoute.push(index);
	}
	var record = records[index];
	var cluster = apMap.get(record.apid).cluster;
	cluster.addDevice(this);
};

/*
 * move backward from the index record
 */
Device.prototype.moveBackward = function(index){
	if(index == -1){
		return;
	}
	if(records[index].mac != this.mac){
		console.warn("current record not corresponding to device");
		return;
	}
	var r = records[this.deviceRoute[this.cur]];
	apMap.get(r.apid).cluster.removeDevice(this);
	this.cur --;
	if(this.cur != -1){
		r = records[this.deviceRoute[this.cur]];
		cluster = apMap.get(r.apid).cluster.addDevice(this);
	}
}

function DeviceCluster(apid){
	this.apid = apid;
	this.r = 2;
	this.level = 6;
	this.positions = square(this.r, this.level);
	this.posFlag = this.positions.map(function(){return false});
	this.deviceMap = d3.map();
	this.count = 0;
}
DeviceCluster.prototype.addDevice = function(device){
	if(this.deviceMap.has(device.mac)){
		console.warn("device already on cluster");
		return;
	}
	console.log("add device to cluster begin", this.apid, device.mac);
	var i = -1, len = this.positions.length;
	while(++i < len){
		if(this.posFlag[i]){
			continue;
		}
		// add device to cluster
		console.log('succeed');
		this.posFlag[i] = true;
		this.positions[i].device = device;
		this.deviceMap.set(device.mac, i);
		this.count ++;
		console.log("add device to cluster end");
		//console.log("cluster positions:", this.positions);
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
	console.log("remove device from cluster begin", this.apid, device.mac);
	var pos = this.deviceMap.get(device.mac);
	// remove from cluster
	if(!this.posFlag[pos] == true){
		console.warn("remove device from empty position");
		return;
	}
	this.posFlag[pos] = false;
	delete this.positions[pos].device;
	this.deviceMap.remove(device.mac);
	this.count --;
	console.log("remove device from cluster end");
}

DeviceCluster.prototype.deviceLst = function(){
	return this.positions.filter(function(p, i){
		return p.device != null && p.device != undefined;
		// return this.posFlag[i] === true;
	});	
}

function RecordTracer(){
	this.deviceLst = [];
	this.deviceMap = d3.map();// key: mac, value:Device
	this.cur = -1;
};

RecordTracer.CreateTracer = function(){
	if(apLst.length == 0 || records.length == 0){
		console.log(apLst.length, records.length);
		console.error("apLst or records is empty");
		return;
	}
	if(!timeFrom || !timeTo){
		console.eror("no timeFrom and timeTo variable");
		return;
	}
	apLst.forEach(function(ap){
		ap.cluster = new DeviceCluster(ap.apid);
		apMap.set(ap.apid, ap);
	});
	//console.log("apMap:", apMap);
	records.forEach(function(r,i){r.index = i});
	var tracer = new RecordTracer();
	return tracer;
}
RecordTracer.prototype.gotoTime = function(_time){
	if(_time - timeFrom < 0 || _time > timeTo){
		console.log(new Date(_time));
		console.warn("go to time out of range");
		return;
	}
	var t =
		this.cur == -1 ? new Date(timtFrome) : new Date(records[this.cur].date_time);
	var len = records.length;
	while(t - _time > 0){
		if(this.cur == -1){
			break;
		}
		this.moveBack();
		t = new Date(records[this.cur].date_time);
	}
	while(t - _time < 0){
		if(this.cur == len -1){
			break;
		}
		this.moveOn();
		t = new Date(records[this.cur].date_time);
	}
	if(this.cur == len){
		console.log("reach end");
		return;
	}
}

RecordTracer.prototype.moveOn = function(){
	if(this.cur == records.length - 1){
		console.log("reach to the end");
		return;
	}
	console.log("record tracer, move on begin, cur:", this.cur);
	this.cur ++;
	if(this.cur >= records.length){
		this.cur = records.length;
		return;
	}
	var r = records[this.cur];
	if(!this.deviceMap.has(r.mac)){
		this.deviceMap.set(r.mac, this.deviceLst.length);
		this.deviceLst.push(new Device(r.mac, this.cur));
	}
	var device = this.deviceLst[this.deviceMap.get(r.mac)];
	//console.log("device", device);
	device.moveForward(this.cur);
	console.log("record tracer, move on end, cur:", this.cur);
}

RecordTracer.prototype.moveBack = function(){
	console.log("record tracer, move back begin, cur:", this.cur);
	if(this.cur == -1){
		return;
	}
	var r = records[this.cur];
	var device = this.deviceLst[this.deviceMap.get(r.mac)];
	device.moveBackward(this.cur);
	this.cur -- ;
	console.log("record tracer, move back end, cur:", this.cur);
}

function removeDup(records){
	return records.map(function(r,i){
		if(i == 0 || r.apid != records[i-1].apid){
			return r;
		}
		return null;
	}).filter(function(r){return r != null});
}

/*
 * compute dot positions in circular style
 */
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

/*
 *
 */
function getPoint(p0, p1, tant){
	if(typeof tan == 'undefine') tan = 0.3;
	if(p0.x == p1.x && p0.y == p1.y) return {x:"",y:""};
	var l = Math.sqrt(tant*tant+1);
	var cosy = 1/l, siny = tant/l;
	var ux = p1.x - p0.x, uy = p1.y - p0.y;
	var len = Math.sqrt(ux*ux + uy*uy);
	var cosx = ux/len, sinx = uy/len;
	var cosr = cosx*cosy - sinx*siny;
	var sinr = cosx*siny + cosy*sinx;
	var ll = len/(2*cosy);
	var dx = ll*cosr, dy = ll*sinr;
	//console.log("cosx:", cosx, "sinx:", sinx, "dx:", dx, "dy:", dy);
	return {x:p0.x+dx, y:p0.y+dy, name:"mid"}
}
