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

utils.initG = function(g, _w, _h, mgs){
	var mg = [0, 0, 0, 0];
	if(mgs){
		mgs[0] && (mg[0] = mg[1] = mg[2] = mg[3] = mgs[0]);
		mgs[1] && (mg[1] = mg[3] = mgs[1]);
		mgs[2] && (mg[2] = mgs[2]);
		mgs[3] && (mg[3] = mgs[3]);
	}
	var w = _w - mg[1] - mg[3];
			h = _h - mg[0] - mg[2];
	g.attr("transform", "translate("+mg[3]+","+mg[0]+")");
	return {width: w, height: h};
}

utils.initSVG = function(sel, mgs){
	var size = utils.getSize(sel);
	
	var mg = [0, 0, 0, 0];
	if(mgs){
		mgs[0] && (mg[0] = mg[1] = mg[2] = mg[3] = mgs[0]);
		mgs[1] && (mg[1] = mg[3] = mgs[1]);
		mgs[2] && (mg[2] = mgs[2]);
		mgs[3] && (mg[3] = mgs[3]);
	}
	var w = size.width() - mg[1] - mg[3];
			h = size.height() - mg[0] - mg[2];
	var svg = d3.select(sel + " > svg").attr("width", size.width()).attr("height", size.height());			
	// var svg = d3.select(sel + " > svg").attr("width", w).attr("height", h);			
	var g = svg.append("g").attr("transform", "translate("+mg[3]+","+mg[0]+")")
		.attr("offset-x", mg[3])
		.attr("offset-y", mg[0]);
	g.append("rect").attr("class", "placeholder")
		.attr("width", w).attr("height", h);

	return {svg:svg, g: g, w: w, h: h, sel:sel, mgs:mgs };
};

utils.resizeSVG = function(element) {
	var sel = element.sel;
	var mgs = element.mgs;
	var svg = element.svg;
	var size = utils.getSize(sel);
	
	var mg = [0, 0, 0, 0];
	if(mgs){
		mgs[0] && (mg[0] = mg[1] = mg[2] = mg[3] = mgs[0]);
		mgs[1] && (mg[1] = mg[3] = mgs[1]);
		mgs[2] && (mg[2] = mgs[2]);
		mgs[3] && (mg[3] = mgs[3]);
	}	
	var w = size.width() - mg[1] - mg[3];
			h = size.height() - mg[0] - mg[2];
	element.w = w;
	element.h = h;
	svg.attr("width", size.width()).attr("height", size.height());
	svg.select(".placeholder").attr("width", w).attr("height", h);
	return element;
}

utils.identity = function(x){return x};

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

utils.createSpinner = function(radius, length) {
    var opts = {            
        lines: 13, // 花瓣数目
        length: 50, // 花瓣长度
        width: 5, // 花瓣宽度
        radius: 30, // 花瓣距中心半径
        corners: 1, // 花瓣圆滑度 (0-1)
        rotate: 0, // 花瓣旋转角度
        direction: 1, // 花瓣旋转方向 1: 顺时针, -1: 逆时针
        color: '#999', // 花瓣颜色
        speed: 1, // 花瓣旋转速度
        trail: 60, // 花瓣旋转时的拖影(百分比)
        shadow: false, // 花瓣是否显示阴影
        hwaccel: false, //spinner 是否启用硬件加速及高速旋转            
        className: 'spinner', // spinner css 样式名称
        zIndex: 2e9, // spinner的z轴 (默认是2000000000)
        top: '50%', // spinner 相对父容器Top定位 单位 px
        left: '50%'// spinner 相对父容器Left定位 单位 px
    };
    if (radius)
        opts.radius = radius;
    if (length)
        opts.length = length;    
    return new Spinner(opts); 
}

//检查点是否在多边形内部
// from https://github.com/substack/point-in-polygon
utils.pointInPolygon = function(point, vs) {
	var xi, xj, i, intersect,
		x = point[0],
		y = point[1],
		inside = false;
	for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		xi = vs[i][0],
		yi = vs[i][1],
		xj = vs[j][0],
		yj = vs[j][1],
		intersect = ((yi > y) != (yj > y))
		  && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}
	return inside;
}
//

/*
 * find first index of element that have value greater than V 
 * in a sorted array
 */
utils.firstIndexOfGreater = function(array, V, _valueFunction){
	var len = array.length;
	var value = _valueFunction ? _valueFunction : function(d){return d};
	if(len == 0 || value(array[len-1]) - V <= 0) return len;
	if(value(array[0]) > V) return 0;
	var minIndex = 0, minElement;
	var maxIndex = len - 1, maxElement;
	var midIndex;
	var midElement;

	while (minIndex < maxIndex) {
		minElement = array[minIndex];
		maxElement = array[maxIndex];
		if(value(maxElement) - V <= 0){
			return maxIndex + 1;
		}
		midIndex = (minIndex + maxIndex) / 2 | 0;
		midElement = array[midIndex];

		if (value(midElement) - V > 0) {
			maxIndex = midIndex;
		}
		else {
			minIndex = midIndex;	
		}
		if(maxIndex == midIndex +1){
			return maxIndex;
		}
	}
	console.warn("some thing wrong");
	return maxIndex + 1;
}

utils.lastIndexOfLess = function(array, V, _valueFunction){
	var len = array.length;
	var value = _valueFunction ? _valueFunction : function(d){return d};
	if(len == 0 || value(array[0]) - V >= 0) return -1;
	if(value(array[len-1]) - V < 0) return len-1;
	var minIndex = 0, minElement;
	var maxIndex = len - 1, maxElement;
	var midIndex;
	var midElement;

	while (minIndex < maxIndex) {
		minElement = array[minIndex];
		maxElement = array[maxIndex];
		if(value(minElement) - V >= 0){
			return minIndex - 1;
		}
		midIndex = (minIndex + maxIndex) / 2 | 0;
		midElement = array[midIndex];
		
		if (value(midElement) - V < 0) {
			minIndex = midIndex;
		}
		else {
			maxIndex = midIndex;	
		}
		if(maxIndex == midIndex +1){
			return minIndex;
		}
	}
	console.warn("some thing wrong");
	return maxIndex + 1;
}

Array.prototype.firstIndexOfGreater = function(V, value){
	return utils.firstIndexOfGreater(this, V, value);
}
Array.prototype.lastIndexOfLess = function(V, value){
	return utils.lastIndexOfLess(this, V, value);
}

