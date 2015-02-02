WifiVis.FloorsNav = function(gName){
	function FloorsNav(){}
	var nFloors = WifiVis.NUM_FLOOR;
	var Floor = WifiVis.Floor;
	//
	//
	var size = utils.getSize(gName);
	var floorDivs = d3.select(gName).selectAll("div.floor")
		.data(d3.range(1, nFloors+1));
	floorDivs.enter().append("div").attr("class","floor");
	var floors = [];
	floorDivs.each(function(i){
		var floor = Floor(d3.select(this), i, size.width(), size.height()/nFloors);
		floors.push(floors);
	});
	//
	return FloorsNav;
};

WifiVis.Floor = function(div, index, w, h){
	function Floor(){}
	var mgBot= 0, iF = index;
	var btn = div.append("input").attr("type","button")
		.attr("value", "Floor "+index).style("height",h).style("width", "20%");
	div.attr("id", "floor-"+index).style({
		"width": w,
		"height": h - mgBot,
		"margin": "0 0 "+mgBot+" 0",
	});
	btn.on("click", changeToFloor);
	function changeToFloor(){
		curF = iF;
		console.log("changeToFloor:", curF);
		var timelineData = dataCenter.find_records({floors:[iF]});
		timeline.updateData(timelineData);
		timeline.renderTimeline(tlSize, "#1C98F3");
		floorDetail.changeFloor(iF);
		var recs = dataCenter.find_records({floors:[iF]});
		var rMaps = pathDataCenter.groupByMac(recs);
		floorDetail.drawPath(rMaps.values());
	}
	(function(){
		Object.defineProperty(Floor, "iF", {
			get: function(){return iF}
		});
	})();
	return Floor;
};


