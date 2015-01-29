var utils = utils ? utils : {};

utils.getSize = function(sel){
	var tc = $(sel);
	return {
		width:tc.width.bind(tc),
		height:tc.height.bind(tc),
		reload: function(){
			this.width = tc.width();
			this.height = tc.height();
			return this;
		}
	};
};

utils.initSVG = function(sel, mgs){
	var size = utils.getSize(sel);
	var svg = d3.select(sel + " > svg").attr("width", size.width()).attr("height", size.height());
	var mg = [0, 0, 0, 0];
	mgs[0] && (mg[0] = mg[1] = mg[2] = mg[3] = mgs[0]);
	mgs[1] && (mg[1] = mg[3] = mgs[1]);
	mgs[2] && (mg[2] = mgs[2]);
	mgs[3] && (mg[3] = mgs[3]);
	var w = size.width() - mg[1] - mg[3];
			h = size.height() - mg[0] - mg[2];
	var g = svg.append("g").attr("transform", "translate("+mg[3]+","+mg[0]+")");
	g.append("rect").attr("width", w).attr("height", h).attr("fill", "none");

	return { g: g, w: w, h: h };
};
utils.identity = function(x){return x};

utils.waitUntil = function(condition, on_finished, interval, timeout) {
    if(!timeout) timeout = 1e100;
    var time_started = new Date().getTime();
    var timer = setInterval(function() {
        if(condition()) {
            clearInterval(timer);
            if(on_finished) on_finished(true);
        }
        if(new Date().getTime() - time_started > timeout) {
            clearInterval(timer);
            if(on_finished) on_finished(false);        
        }
    }, interval ? interval : 100);
};
/*
 * debug
 */
utils.log = function(d,lev){
	lev = 1;
	if(lev){
		if(Array.isArray(d)){
			console.log.apply(console,d);
		}
		else{
			console.log(d);
		}
	}
};
utils.warn = function(d,lev){
	if(Array.isArray(d)){
		console.warn.apply(console,d);
	}
	else{
		console.warn(d);
	}
};
utils.error = function(d,lev){
	if(Array.isArray(d)){
		console.error.apply(console,d);
	}
	else{
		console.error(d);
	}
};

//module.exports = utils;
