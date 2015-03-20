
function DeviceFeature(device, from, to){
	this.device = device;
	this.mac = device.mac;
	this.path = device.path;
	this.init();
}

DeviceFeature.prototype.init = function(){

}

function ApFeature(apid, records){
	this.apid = apid;
	this.records = records;
	this.ftRecordNumber = records.length;
	this.ftDeviceNumber = _.uniq(this.records, function(d){return d.mac}).length;
}
