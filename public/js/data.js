WifiVis.dataCenterManager = d3.map();

WifiVis.DataCenter = function(key){
	var dCenter;
	if((dCenter = this.dataCenterManager.get(key))){
		return dCenter;
	}
	function DataCenter(){}

	var apsByFloor = {}, aps, IS_AP_LOADED = false;
	var recordsByFloor = {}, records, IS_RECORD_LOADED = false;
	//
	DataCenter.init = init;
	DataCenter.find_ap_by_id = find_ap_by_id;
	DataCenter.find_aps = find_aps;
	DataCenter.find_records= find_records;
	function init(_aps, _records){
		_load_aps(_aps);
		_load_records(_records);
		return DataCenter;
	}

	function find_ap_by_id(apid){
		var opt = {};
		opt.apFilter = function(ap){return +ap.apid === +apid};
		return find_aps(opt);
	}
	/*
	 * find_aps(option)
	 * option.floors: floor array
	 * option.apFilter:
	 */
	function find_aps(option){
		if(!option){
			return aps.map(utils.identity);
		}
		var rAps = [];
		var floors = option.floors, apFilter = option.apFilter;
		if(floors && floors.length){
			floors.forEach(function(iF){
				if(!apsByFloor[iF]){
					utils.warn(["there is no floor No.",iF]);
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
		return rAps;
	}
	/*
	 * find_records(option)
	 */
	function find_records(option){
		if(!option){
			return records.map(utils.identity);
		}
		var rRecords = [];
		var floors = option.floors, recordFilter = option.recordFilter;
		if(floors && floors.length){
			floors.forEach(function(iF){
				if(!recordsByFloor[iF]){
					utils.warn(["there is no floor No.",iF]);
				}else{
					rRecords = rRecords.concat(recordsByFloor[iF]);
				}
			});
		}else{
			rRecords = aps.map(utils.identity);
		}
		if(recordFilter){
			rRecords = rRecords.filter(recordFilter);
		}
		return rRecords;
	}
	//  help function
	function _load_records(_records){
		var format = d3.time.format("%Y-%m-%d %H:%M:%S");
		IS_RECORD_LOADED = false;
		var i = -1, len = (records = _records).length;
		while(++i < len){
			var record = records[i];
			//record.dateTime = format.parse(record.date_time);
			record.dateTime = format.parse(record.date_time);
			var ap = aps.filter(function(ap){return +ap.apid === +record.apid})[0];
			if(!ap){
				utils.warn("apid not exist");
				continue;
			} 
			record.ap = ap;
			var iF = ap.floor;
			recordsByFloor[iF] = recordsByFloor[iF]?recordsByFloor[iF]:[];
			recordsByFloor[iF].push(record);
		}
		IS_RECORD_LOADED = true;
		//
		utils.log(["load records:", records.length],1);
		for(floor in recordsByFloor){
			utils.log(["records at floor ", floor, recordsByFloor[floor].length], 1);
		}
	}
	function _load_aps(_aps){
		var i = -1, len = (aps = _aps).length,
		arr, iFloor, ap;
		while(++i < len){
			ap = aps[i];
			arr = apsByFloor[ap.floor] || [];
			arr.push(ap);
			apsByFloor[ap.floor] = arr;
		}
		IS_AP_LOADED = true;
		//
		utils.log(["load aps:", aps.length], 1);
		for(floor in apsByFloor){
			utils.log(["aps at", floor, apsByFloor[floor].length], 1);
		}
	}

	this.dataCenterManager.set(key, DataCenter);
	return DataCenter;
};

