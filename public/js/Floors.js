WifiVis.FloorsNav = function(gName){
	function FloorsNav(){}
//	var color = d3.scale.category20();
	var color = WifiVis.FLOOR_COLOR;
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
		var floor = Floor(d3.select(this), i, size.width(), size.height()/nFloors,color(i));
		floors.push(floors);
	});
	//
	return FloorsNav;
};

WifiVis.Floor = function(div, index, w, h, bgColor){
	function Floor(){}
	var mgBot= 0, iF = index;
	var btn = div.append("input").attr("type","button")
		.attr("value", "Floor "+index).style("background-color",bgColor);
		//.style("height",h).style("width", "100%");
	div.attr("id", "floor-"+index).style({
//		"width": w,
//		"height": h - mgBot,
		"margin": "0 0 "+mgBot+" 0",
	});
	div.on("click", changeToFloor);
	function changeToFloor(){
		curF = iF;
		console.log("changeToFloor:", curF);
		timeline.update();
		floorDetail.changeFloor(iF);
		floorDetail.update_ap_device(apLst);
		floorDetail.update_links();

		//
		d3.selectAll(".floor")
			.classed('pushed', false);
		d3.select(this).classed('pushed', true);
	}
	(function(){
		Object.defineProperty(Floor, "iF", {
			get: function(){return iF}
		});
	})();
	return Floor;
};


