var utils = utils ? utils : {};
utils.DEBUG = true;
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
	g.append("rect").attr("class", "placeholder")
		.attr("width", w).attr("height", h);

	return {svg:svg, g: g, w: w, h: h };
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
//
//module.exports = utils;
utils.initArrowMarker = function(svg, markerId){
	svg.append("svg:defs").append("svg:marker")
		.attr("id",markerId)
		.attr("viewBox","0 -10 20 20")
		.attr("refX",14.5)
		.attr("refY",0)
		.attr("markerWidth",5)
		.attr("markerHeight",4)
		.attr("orient","auto")
		.append("svg:path")
		.attr("d","M0,-8L18,0L0,8");
//		.style("stroke","red")
		//.style("fill","rgb(115, 115, 115)");
}

utils.arcline = function(){
	function arcline(points){
		return single_arc(points[0], points[1]);
	}

	var x = default_x;
	var y = default_y;
	var r = default_r;

	arcline.x = function(_){
		if(!arguments.length) return x;
		x = _;
		return arcline;
	};
	arcline.y = function(_){
		if(!arguments.length) return y;
		y = _;
		return arcline;
	}
	arcline.r = function(_){
		if(!arguments.length) return r;
		r = _;
		return arcline;
	}


	function single_arc(p0, p1){
		var x0 = x(p0), y0 = y(p0), r0 = r(p0),
				x1 = x(p1), y1 = y(p1), r1 = r(p1);
		var dx = x1 - x0,
				dy = y1 - y0;
		var dr = Math.sqrt(dx*dx + dy*dy);

		var theta = Math.atan(dy/dx);
		var theta1 = theta + Math.PI/6.0;
		var theta2 = theta - Math.PI/6.0;
		var directionX = dx>=0?1:-1;
		var directionY = dy>0?1:-1;

		if(dx<0){
			theta+=Math.PI;
			if(dy<0){
				//	directionY*=-1;	
			}
		}
		if((dx<=0&&dy>0) || (dx>=0&&dy<0)){
			directionY*=-1;
		}
		var newX0 = x0 + directionX*r0*(Math.cos(theta1));
		var newY0 = y0 + directionY*r0*(Math.sin(theta1));

		var newX1 = x1 - directionX*r1*(Math.cos(theta2));
		var newY1 = y1 - directionY*r1*(Math.sin(theta2)); 
		var str = "M"+ newX0 + "," + newY0 + "A" + dr + "," + dr + " 0 0,0 " + newX1 + "," + newY1;

		return str;
	}

	function default_x(d){ return d[0] };
	function default_y(d){ return d[1] }
	function default_r(d){ return d[2] || 0};

	return arcline;
}
