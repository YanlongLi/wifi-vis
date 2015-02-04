/*
 *
 */
floor_image_size = WifiVis.FLOOR_IMG_SIZE;

WifiVis.FloorDetail = function(selector, _iF){
	function FloorDetail(){}
	//
	var iF;
	var o = utils.initSVG(selector, [0]), g = o.g;
	var imgOriSize = {}, imgSize = {},
			x = d3.scale.linear(), y = d3.scale.linear(),
			img = g.append("image").attr("id","floor-background"),
			IMG_DIR = "data/floors/";
	var aps;
	var gAps = g.append("g").attr("id","aps-wrapper"),
			gPath = g.append("g").attr("id", "path-wrapper"),
			//gFloorLabel = g.append("g").attr("class",'floor-label'),
			pathF = d3.svg.line()
				.x(function(d){return x(d.ap.pos_x)})
				.y(function(d){return y(d.ap.pos_y)});
	gAps.append("rect").attr("class","placeholder");
	gPath.append("rect").attr("class","placeholder");
	//gFloorLabel.append('text');
	var imgOffset = [20,20];

	if(_iF){
		changeFloor(_iF);
	}
	//
	FloorDetail.changeFloor = changeFloor;
	FloorDetail.move = moveImage;
	FloorDetail.moveRelative = moveRelative;
	FloorDetail.drawPath = drawPath;
	//
	function _imgPath(iF){return IMG_DIR+iF+"F.jpg"};
	function _resizeImg(){
		x.domain([0, imgOriSize.w]).range([0, imgSize.w]);
		y.domain([0, imgOriSize.h]).range([0, imgSize.h]);
		img.attr('width', imgSize.w);
		img.attr('height', imgSize.h);
		img.attr('opacity', 0.1);
		gAps.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
		gPath.select("rect.placeholder").attr("width",imgSize.w).attr("height", imgSize.h);
	}
	function changeFloor(_iF){
		iF = _iF;
		// update label
		//gFloorLabel.select("text").text("Floor " +iF);
		//
		console.log("change to floor:", iF);
		img.attr("xlink:href", _imgPath(iF));
		imgOriSize.w = floor_image_size[iF][0];
		imgOriSize.h = floor_image_size[iF][1];
		img.attr("width", imgOriSize.w);
		img.attr("height",imgOriSize.h);
		console.log("floor image original size:",imgOriSize.w,imgOriSize.h);
		// compute new size
		var ratioW, ratioH, ratio;
		ratio = (ratioW = imgOriSize.w / o.w) > (ratioH = imgOriSize.h / o.h)?
			ratioW:ratioH;
		imgSize.w = imgOriSize.w / ratio;
		imgSize.h = imgOriSize.h / ratio;
		console.log("floor image shown size:",imgSize.w,imgSize.h);
		//gFloorLabel.select("text").attr("x",imgSize.w/2).attr("y", imgSize.h/2);
		//
		_resizeImg();
		moveImage(imgOffset);

		//aps = dataCenter.find_aps({floors:[iF]});
		return FloorDetail;
	}
	function _drawAps(aps){
		aps.forEach(function(ap){
			ap.c = numByAp.get(ap.apid) || 0;
			if(ap.c == 0){
				console.log("empty ap:", ap);
			}
		});
		console.log("draw_aps:",aps.length);
		apSel = gAps.selectAll("circle").data(aps);
		apSelEnter = apSel.enter().append("circle");
		apSel.attr("cx", function(ap){return x(ap.pos_x)})
			.attr("cy", function(ap){return y(ap.pos_y)})
			.attr("r",function(ap){
				return ap.c/80 > 1?ap.c/80:3;
			}).on("mouseover", function(ap){
				d3.select(this).attr("r", function(ap){
					return ap.c/40 > 4 ? ap.c/40:4;
				});
				d3.select(this).append("title").text("Record Num:"+ap.c);
			}).on("mouseout", function(ap){
				d3.select(this).attr("r", function(ap){
					return ap.c/80 > 1?ap.c/80:3;
				});
			});
		apSel.attr("title",function(ap){return ap.name});
		apSel.exit().remove();
	}
	var pathByMac, numByAp;
	function drawPath(_pathByMac){
		pathByMac = _pathByMac;
		//
		var records = Array.prototype.concat.apply([], pathByMac);
		var i = -1, len = records.length, r;
		numByAp = d3.map();
		//console.log("record size:", records.length);
		while(++i < len){
			r = records[i];
			if(numByAp.has(r.apid)){
				numByAp.set(r.apid, numByAp.get(r.apid)+1);
			}else{
				numByAp.set(r.apid, 1);
			}
		}
		console.log("mapsize:", numByAp.size());
		aps = apCenter.findAllApsOnFloor(iF);
		/*
		d3.json("/getApsByFloor?floor="+iF, function(err, _aps){
			console.log("get aps by floor:",iF);
			aps = _aps.map(function(ap){
				ap.apid = +ap.apid;
				ap.floor = +ap.floor;
				ap.pos_x = ap.x;
				ap.pos_y = ap.y;
				delete ap.x;
				delete ap.y;
			});
			_drawAps(aps);
		});*/
		_drawAps(aps);
		//
		utils.log(["draw path, path number:", pathByMac.length]);
		var selPath = gPath.selectAll("path").data(pathByMac);
		var selPathEnter = selPath.enter().append("path");
		selPath.attr("d", pathF);
		selPath.exit().remove();
	}
	function moveImage(offset){
		imgOffset = offset;
		img.transition().attr("x", imgOffset[0]).attr("y", imgOffset[1]);
		d3.selectAll("#path-wrapper, #aps-wrapper, .floor-label")
			.transition()
			.attr('transform', "translate("+imgOffset[0]+","+imgOffset[1]+")");
		//
		utils.log(["move image:", imgOffset]);
	}
	function moveRelative(offset){
		var dx = offset[0], dy = offset[1];
		imgOffset[0] += dx;
		imgOffset[1] += dy;
		moveImage(imgOffset);
	}
	//
	return FloorDetail;
};
