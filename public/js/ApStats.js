function ApFeature(apid, from, to, db, db_tl){
	this.apid = apid;
	this.db = db;
	this.db_tl = db_tl;
	this.records = null;
	this.from = from;
	this.to = to;
	this.init();
}

var apid_null_list = [];
// var apid_change_list = [];
var apid_current_list = [];
var apid_list = [];

ApFeature.prototype.init = function(){
	var db = this.db;
	var db_tl = this.db_tl;
	var from = this.from;
	var to = this.to;
	//
	var that = this;
	db.records_by_interval(from, to ,function(rs){
		that.records = rs.filter(function(d){return d.apid == that.apid});
		that.ftRecordNumber = that.records.length;
	});
	that.ftDeviceNumber = null;
	that.aveStayTime = null;
	that.variance_ap = null;
	// that.z = [];
	that.fft = [];
	that.fft_param = null;
	//
	var pathAll;
	var time_segment = [];
	var mac_list = [];
	
	// console.time("compute average stay time" + that.apid);
	db.path_all(from, to, function(paths){
		pathAll = paths;
		pathAll.forEach(function(path){
			var flag = false;
			path.forEach(function(r, i){
				if(i == 0) return;
				var r0 = path[i-1];
				if(r0.apid != that.apid) return;
				if(r0.date_time - to >= 0) return;
				if(r.date_time - from <= 0) return;
				var f = from > r0.date_time ? from : r0.date_time;
				var t = to < r.date_time ? to : r.date_time;
				time_segment.push(t - f);
				flag = true;
			});
			if(flag) mac_list.push(path[0].mac);
		});

		that.ftDeviceNumber = mac_list.length;

		if(that.ftDeviceNumber == 0) {
			apid_null_list.push(that.apid)
		}
		// if(that.ftDeviceNumber == 0){
		// 	that.aveStayTime = 0;
		// }else{
		// 	that.aveStayTime = d3.sum(time_segment) / time_segment.length; 
		// }
		that.aveStayTime = time_segment.length == 0 ? 0 : d3.sum(time_segment) / time_segment.length; 
		// console.timeEnd("compute average stay time" + that.apid);
	});

	var times = db_tl.ap_tl_data[0].tl_data.map(function(d){return d.time});
	var i = 0;
	var j = times.length;
	for(var t = 0; t < times.length; t++)	{
		if(times[t] - from == 0){
			i = t;
		}
		if(times[t]- to == 0){
			j = t + 1;
		}
	}
	var tl_array = [];
	var tl_norm = [];
	var fft_before = [];
	var fft_after = [];
	var p = 0.5;
	(function(){
		var index = _.findIndex(db_tl.ap_tl_data, function(d){
			return d.apid == that.apid;
		});
		tl_array = db_tl.ap_tl_data[index].tl_data.slice(i, j).map(function(d){
			return d.count;
		});
	})();
	var ave = d3.sum(tl_array)/tl_array.length;
	var sum_norm = d3.sum(tl_array, function(d){return Math.pow(d, 2)})
	var ave_norm = sum_norm/tl_array.length;
	var sum_square = d3.sum(tl_array, function(d){return Math.pow(d - ave, 2)});
	that.variance_ap = sum_square/tl_array.length;
	for(n = 0; n < tl_array.length; n++){
		tl_norm[n] = tl_array[n]/Math.sqrt(ave_norm);
	}
	// var test1 = d3.sum(tl_norm, function(d){return Math.pow(d, 2)});
	// console.log(test1)
	console.time("compute fft " + that.apid);
	var z = new numeric.T(tl_norm).fft();
	for(m = 0; m < tl_array.length; m++){
		that.fft[m] = Math.pow(z.x[m], 2) + Math.pow(z.y[m], 2);
	}
	for(k = 0; k < p*tl_array.length; k++){
		fft_before[k] = that.fft[k];
	}
	for(l = 0; l < (1-p)*tl_array.length; l++){
		fft_after[l] = that.fft[p*tl_array.length + l];
	}
	sum_before = d3.sum(fft_before);
	sum_after = d3.sum(fft_after);
	that.fft_param = sum_after/sum_before;
	console.timeEnd("compute fft " + that.apid);
	// var test_sum1 = 0;
	// var test_sum2 = 0;
	// for(r = 0; r < tl_array.length/2; r++){
	// 	test_sum1 += that.fft[r];
	// 	test_sum2 += that.fft[tl_array.length/2 + r];
	// }
	// var testR = test_sum2/test_sum1;
	// console.log(that.fft)
	// var test = d3.sum(that.fft)/tl_array.length;
	// console.log(test)
}


WifiVis.ApStats = function(){
	function ApStats(){}

	WFV.DATA_PATH = function(){return "../data/"};

	var timeFrom = new Date(2013,8,2),
			timeTo   = new Date(2013,8,3);

	var db = new WFV_DB(timeFrom, timeTo);

	var from = new Date(2013,08,02),
			to = new Date(2013,08,03);

	var tracer = new RecordTracer();
	var db_tl = new WFV_TL_DATA();

	

	ObserverManager.addListener(ApStats);

  ApStats.OMListen = function(message, data, sender){  
  	return;
    if(message == WFV.Message.ApSelect){
      if(sender == ApStats) return;
      var apids = data.apid, change = data.change, isAdd = data.isAdd;
      if(isAdd){
      	apid_list = apids;
      	ApStats.update(1); 
      }else{
      	apid_list = apids; 
      	ApStats.update(1);
      }
    }
  }
	
	ApStats.update = function(isRemove){
		var svg=d3.select("#ap-pcp-svg");
		var width = svg.w, height = svg.h;
		if(isRemove) {
			svg.selectAll("g").remove();
		}

		db.init(function(){ 
			db.records_by_interval(from, to, function(records){
				var aps = db.aps_all();
				tracer.init(records, aps);
				db_tl.init(from, to, tracer, 20);

				var apid_list = aps.map(function(d){
					return d.apid;
				}); 
			
				apid_list = _.difference(apid_list, apid_null_list);
				apid_current_list = apid_list;

				var appcps = apid_list.map(function(d){
					var fts_ap = new ApFeature(d, from, to, db, db_tl);
					var APpcp = {
						apid: fts_ap.apid,
						ftRecordNumber: fts_ap.ftRecordNumber,
						ftDeviceNumber: fts_ap.ftDeviceNumber,
						aveStayTime: fts_ap.aveStayTime,
						fftparam: fts_ap.fft_param,
						varianceap: fts_ap.variance_ap
					};
					return APpcp;
				});
				console.log(appcps);	
				
				myPCP = PCP.init(svg, {pos: [70,30], size: [500,400]}, appcps);
			});
		});
	}
	$(window).resize(function(){
		var w = $("#ap-pcp-svg").width() - 70 - 30,
				h = $("#ap-pcp-svg").height() - 30 - 30;
		myPCP.updateSize([w,h]);
	});

	ApStats.update(1);
	
	return ApStats;
}

