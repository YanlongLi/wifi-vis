var WifiVis = {};
WifiVis.NUM_FLOOR = 17;
WifiVis.DATA_PATH = "data/";
WifiVis.FLOOR_IMG_SIZE = [
	[0,0], [1003,519], [680,698], [680,700], [1001,510], [1000,509],
	[1000,507], [997,828], [894,902], [1002,505], [1000,511],
	[996,510], [998,506], [998,508], [1000,507], [879,1064],
	[798,800], [999,995]];
WifiVis.FLOOR_COLOR = function(i){
	var color = ["#1f77b4",
		"#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
		"#98df8a", "#d62728", "#ff9896", "#9467bd",
		"#c5b0d5", "#8c564b", "#c49c94", "#e377c2",
		"#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22",
		"#dbdb8d", "#17becf", "#9edae5"];
		return color[i];
};

WifiVis.RequestURL = (function(){
	function RequestURL(){}

	var PATH = {
		graphinfo: "/graphinfo",
		aps: "/aps",
		apbyid: "/apById",
		records: "/records",
		paths: "/find_path",
		timeline: "/tl-data"
	};

	RequestURL.graphinfo = function(params){
		// {start:, end:}
		return generateURL(PATH.graphinfo, params);
	}
	RequestURL.aps = function(params){
		params = params? params : {};
		return generateURL(PATH.aps, params);
	}
	RequestURL.apbyid = function(params){
		if(!arguments.length){
			console.warn("get apby id no params");
		}
		if('number' === typeof params){
			return PATH.apbyid + "?apid="+params;
		}
		return generateURL(PATH.apbyid, params);
	}
	RequestURL.records = function(params){
		params = params? params : {};
		return generateURL(PATH.records, params);
	}
	RequestURL.paths = function(params){
		params = params ? params : {};
		return generateURL(PATH.paths, params);
	}
	RequestURL.timeline = function(params){
		params = params? params : {};
		return generateURL(PATH.timeline, params);
	}

	function generateURL(path, params){
		var str = path + "?";
		return str + d3.map(params).entries().map(function(o){
			var name = o.key, value = o.value;
			if(Array.isArray(value)){
				return name+"="+value.join(",");
			}
			return name+"="+value;
		}).join("&");
	}

	return RequestURL;
})();
