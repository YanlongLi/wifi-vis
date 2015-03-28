WFV.FloorBar = function(_time_range){
	function FloorBar(){}
	var floor_color = ColorScheme.floor;
	//
	var svg = $("#floor-bar-wrapper > svg"), size;
	var g = d3.select('#floor-bar-g');
	//
	var tl_offset;
	var x_scale = d3.time.scale(),
		y_scale = d3.scale.linear(),
		bar_scale = d3.scale.linear(),
		vertical_scale = d3.scale.ordinal();
	var tickFormat = d3.time.format.multi([
			["%I:%M", function(d) { return d.getMinutes(); }],
			["%H:%M", function(d) { return d.getHours(); }],
			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
			["%b %d", function(d) { return d.getDate() != 1; }]
	]);
	var time_axis = d3.svg.axis().scale(x_scale).ticks(3).tickFormat(tickFormat);
	var line = d3.svg.area()
		.x(function(d){return x_scale(d.time)})
		.y(function(d){return y_scale(d.count)})
		.y0(function(){return vertical_scale.rangeBand()});

	//
	var timePoint, timeRange = [timeFrom, timeTo];
	var curFloorLst = [], currentFloor;
	//
	var tipTimePoint = d3.tip().attr('class', 'd3-tip')
		.direction("nw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var time = d[2];
			var f = d3.time.format("%Y-%m-%d %H:%M:%S");
			return f(time);
		});
	var tipFloor= d3.tip().attr('class', 'd3-tip')
		.direction("nw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var floor = d[2];
			return "floor:" + floor.floor+ "</br>"
				+ "max online person:" + floor.maxCount;
		});
	d3.select("#floor-bar-wrapper").select("svg").call(tipTimePoint);
	d3.select("#floor-bar-wrapper").select("svg").call(tipFloor);
	//
	init_svg();
	init_interaction();
	//
	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 20, 20, 30]);
		//
		var offset = tl_offset = size.width * 0.25;
		vertical_scale.rangeBands([0, size.height]);
		x_scale.range([0, size.width - offset]);
		bar_scale.range([0, offset - 6]);
		//
		//
		g.select(".floor-tls-g").attr("transform", "translate("+offset+")");
		g.select(".floor-tls-g").select(".x.axis")
			.attr("transform", "translate(0,"+size.height+")").call(time_axis.scale(x_scale));
	}
	function init_interaction(){
		g.select(".floor-tls-g").on("mousemove", function(d){
			var pos = d3.mouse(this);
			var time = x_scale.invert(pos[0]);
			// update value circles
			var index = -2, dx, realTime = null;
			g.select(".floor-tls-g").selectAll("g.tl").each(function(d){
				if(!realTime){
					index = utils.lastIndexOfLess(d.tl_data, time, function(d){return d.time});
					if(index < 0) index = 0;
					if(index > d.tl_data.length -1) index = d.tl_data.length - 1;
					realTime = d.tl_data[index].time;
					dx = x_scale(realTime);
				}
				y_scale.domain([0, d.maxCount]);
				var count = d.tl_data[index].count;
				var dy = y_scale(count);
				d3.select(this).select("circle").attr("cx", dx).attr("cy", dy).style("opacity", 1);
				d3.select(this).select("text")
					// .attr("x", dx).attr("y", dy)
					.attr("x", x_scale.range()[1]).attr("y", vertical_scale.rangeBand())
					.style("text-anchor", "start").style("font-size", "10px")
					.text(count).style("opacity", 1);
			});
			// update timeline
			d3.select(this).select("line.timepoint-line")
				.attr("x1", dx).attr("y1", 0)
				.attr("x2", dx).attr("y2", size.height);
			var p = [pos[1] - 10, pos[0] - 10, realTime];
			tipTimePoint.show(p,this);
			//
		}).on("mouseout", function(d){
			tipTimePoint.hide();
			g.select(".floor-tls-g").selectAll("g.tl").each(function(d){
				d3.select(this).selectAll("circle, text").style("opacity", 0);
			});
		});
	}
	//
	ObserverManager.addListener(FloorBar);
	FloorBar.OMListen = function(message, data, sender){
		if(message == WFV.Message.FloorChange){
			currentFloor = data.floor;
			if(!currentFloor) return;
			g.selectAll(".floor-tls-g, .floor-bars-g").selectAll("g.tl, g.bar")
				.classed("current", false).filter(function(d){
					return d.floor == currentFloor;
			}).classed("current", true);
		}
		if(message ==  WFV.Message.FloorHover){
			var floor = data.floor, change = data.change, isAdd = data.isAdd;
			g.selectAll(".floor-tls-g, .floor-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return change.indexOf(d.floor) != -1;
			}).classed("hover", isAdd);
		}
		if(message ==  WFV.Message.FloorSelect){
			var floor = data.floor, change = data.change, isAdd = data.isAdd;
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return change.indexOf(d.floor) != -1;
			}).classed("selected", isAdd).attr("_selected", isAdd ? "true" : null);
		}
		if(message ==  WFV.Message.TimeRangeChanged){
			timeRange = data.range;
			x_scale.domain(timeRange);
			db.floor_bar_data(timeRange[0], timeRange[1], function(data){
				update_floor_bars(data);
			});
			//
			db_tl.tlDataFloors(timeRange[0], timeRange[1], 10, curFloorLst, update_floor_tls);
			g.select(".floor-tls-g").select(".x.axis").call(time_axis.scale(x_scale));
		}
	}

	//
	function update_floor_bars(_data){
		// [{apid:, floor, count:, type:"ap"}]
		var items = g.select(".floor-bars-g").selectAll("g.bar");
		if(_data && _data.length){
			//
			items = items.data(_data, function(d){return d.floor});
			var enter = items.enter().append("g").attr("class", "bar");
			enter.append("rect").append("title");
			enter.append("text").attr("class", "label");
			enter.append("text").attr("class", "value");
			// 
			enter.each(function(d){
				curFloorLst.push(d.floor);
			});
			//bars.exit().remove();
		}
		// to sort the slections  TODO
		items = g.select(".floor-bars-g").selectAll("g.bar");
		var tmpCurIds = [];
		items.sort(function(d1, d2){
			return d2.count - d1.count;	
		}).order().each(function(d){
			tmpCurIds.push(d.floor);
		});
		curFloorLst = tmpCurIds;
		// update bar scale
		var cmax = 1;
		items.each(function(d){
			cmax = d.count > cmax ? d.count : cmax;	
		});
		bar_scale.domain([0, cmax]);
		//
		vertical_scale.domain(curFloorLst);
		var per_height = vertical_scale.rangeBand();
		y_scale.range([per_height, 4]);
		//
		items.attr("floor", function(d){return d.floor})
			.each(function(d){
				var ele = d3.select(this);
				ele.select("rect").style("fill", floor_color(d.floor))
					.attr("height", per_height - 2)
					.attr("width", bar_scale(d.count))
					.select("title").text("persons(occur): " + d.count);
				ele.selectAll("text").attr("y", per_height/2).attr("dy", 5);
				ele.select("text.label").text("'" + d.floor).attr("x", -6)
					ele.select("text.value").text(d.count).attr("x", bar_scale(d.count)).attr("dy", 6);
			}).on("click", function(d){
				onFloorClick.call(this, d.floor);
			}).on("mousemove",function(d){
				onFloorHover(d.floor, true);
			}).on("mouseout", function(d){
				onFloorHover(d.floor, false);
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.floor);
			return "translate(0,"+dy+")";
		});
	}
	function update_floor_tls(_data){
		var items = g.select(".floor-tls-g").selectAll("g.tl");
		if(_data){
			items = items.data(_data, function(d){return d.floor});
			var enter = items.enter().append("g").attr("class", "tl");
			enter.append("path");
			enter.append("circle").attr("r", 3).attr("fill", "#807E7E").style("opacity", 0);
			enter.append("text");
		}
		var per_height = vertical_scale.rangeBand();
		//
		items = g.select(".floor-tls-g").selectAll("g.tl");
		items.each(function(d){
			d.maxCount = d3.max(d.tl_data, function(d){return d.count});
		})
		//
		items.attr("floor", function(d){return d.floor})
			.each(function(d){
				var ele = d3.select(this);
				var cmax = d3.max(d.tl_data, function(d){return d.count});
				y_scale.domain([0, cmax || 1]);
				ele.select("path").attr("d", line(d.tl_data))
					.style("fill", floor_color(d.floor))
					.style("fill-opacity", "0.5")
					.style("stroke", "black");
			}).on("click", function(d){
				onFloorClick.call(this, d.floor);
			}).on("mouseenter",function(d){
				onFloorHover(d.floor, true);
			}).on("mousemove", function(d){
				var pos = d3.mouse(this);
				var p = [pos[1] + 60, pos[0] - 10, d];
				tipFloor.show(p, this);
			}).on("mouseout", function(d){
				onFloorHover(d.floor, false);
				tipFloor.hide();
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.floor);
			return "translate(0,"+dy+")";
		});
	}
	function onFloorHover(floor, f){
		g.selectAll(".floor-tls-g, .floor-bars-g").selectAll("g.tl, g.bar").filter(function(d){
			return d.floor == floor;
		}).classed("hover", f);
		EventManager.floorHover([floor], FloorBar);
	}
	function onFloorClick(floor){
		if(d3.select(this).attr("_selected")){
			g.selectAll(".floor-tls-g, .floor-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.floor == floor;
			}).classed("selected",false).attr("_selected", null);
			EventManager.floorDeselect([floor], FloorBar);
		}else{
			g.selectAll(".floor-tls-g, .floor-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.floor == floor;
			}).classed("selected",true).attr("_selected", true);
			EventManager.floorSelect([floor], FloorBar);
		}
	}
	//
	$(window).resize(function(){
		init_svg();
		update_floor_bars();
		update_floor_tls();
	});
	//
	return FloorBar;
}

/*
 *
 */

WFV.FloorBarFloorAps = function(timeFrom, timeTo){
	function FloorBarFloorAps(){}
	var floor_color = ColorScheme.floor;
	//
	var svg = $("#floor-bar-floor-aps-wrapper > svg"), size;
	var g = d3.select('#floor-bar-floor-aps-g');
	//
	var tl_offset;
	var x_scale = d3.time.scale(),
		y_scale = d3.scale.linear(),
		bar_scale = d3.scale.linear(),
		vertical_scale = d3.scale.ordinal();
	var tickFormat = d3.time.format.multi([
			["%I:%M", function(d) { return d.getMinutes(); }],
			["%H:%M", function(d) { return d.getHours(); }],
			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
			["%b %d", function(d) { return d.getDate() != 1; }]
	]);
	var time_axis = d3.svg.axis().scale(x_scale).ticks(3).tickFormat(tickFormat);
	var line = d3.svg.area().interpolate("monotone")
		.x(function(d){return x_scale(d.time)})
		.y(function(d){return y_scale(d.count)})
		.y0(function(){return vertical_scale.rangeBand()});

	//
	var timePoint, timeRange = [timeFrom, timeTo],
		selFloors = [], curApidLst = [];
	var barDataByFloor;
	//
	var tipTimePoint = d3.tip().attr('class', 'd3-tip')
		.direction("nw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var time = d[2];
			var f = d3.time.format("%Y-%m-%d %H:%M:%S");
			return f(time);
		});
	var tipAp= d3.tip().attr('class', 'd3-tip')
		.direction("sw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var ap = d[2];
			var _name = apMap.get(ap.apid).name.split(/ap|f/);
			_name.shift();
			return "ap:" + _name.join("-") + "</br>"
				+ "apid:" + ap.apid + "</br>"
				+ "max online person:" + ap.maxCount;
		});
	d3.select("#floor-bar-floor-aps-wrapper").select("svg").call(tipTimePoint);
	d3.select("#floor-bar-floor-aps-wrapper").select("svg").call(tipAp);
	//
	init_svg();
	init_interaction();
	//
	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 20, 20, 30]);
		//
		var offset = tl_offset = size.width * 0.25;
		vertical_scale.rangeBands([0, size.height]);
		x_scale.range([0, size.width - offset]);
		bar_scale.range([0, offset - 6]);
		//
		//
		g.select(".ap-tls-g").attr("transform", "translate("+offset+")");
		g.select(".ap-tls-g").select(".x.axis")
			.attr("transform", "translate(0,"+size.height+")").call(time_axis.scale(x_scale));
	}
	function init_interaction(){
		g.select(".ap-tls-g").on("mousemove", function(d){
			var pos = d3.mouse(this);
			var time = x_scale.invert(pos[0]);
			// update value circles
			var index = -2, dx, realTime = null;
			g.select(".ap-tls-g").selectAll("g.tl").each(function(d){
				if(!realTime){
					index = utils.lastIndexOfLess(d.tl_data, time, function(d){return d.time});
					if(index < 0) index = 0;
					if(index > d.tl_data.length -1) index = d.tl_data.length - 1;
					realTime = d.tl_data[index].time;
					dx = x_scale(realTime);
				}
				y_scale.domain([0, d.maxCount]);
				var count = d.tl_data[index].count;
				var dy = y_scale(count);
				d3.select(this).select("circle").attr("cx", dx).attr("cy", dy).style("opacity", 1);
				d3.select(this).select("text")
					// .attr("x", dx).attr("y", dy)
					.attr("x", x_scale.range()[1]).attr("y", vertical_scale.rangeBand())
					.style("text-anchor", "start").style("font-size", "10px")
					.text(count).style("opacity", 1);
			});
			// update timeline
			d3.select(this).select("line.timepoint-line")
				.attr("x1", dx).attr("y1", 0)
				.attr("x2", dx).attr("y2", size.height);
			var p = [pos[1] - 10, pos[0] - 10, realTime];
			tipTimePoint.show(p,this);
		}).on("mouseout", function(d){
			tipTimePoint.hide();
			g.select(".ap-tls-g").selectAll("g.tl").each(function(d){
				d3.select(this).selectAll("circle, text").style("opacity", 0);
			});
		});
	}
	//
	ObserverManager.addListener(FloorBarFloorAps);
	FloorBarFloorAps.OMListen = function(message, data, sender){
		if(message == WFV.Message.FloorChange){
		}
		if(message ==  WFV.Message.FloorSelect){
			var floors = selFloors = data.floor, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				var addBarData = change.map(function(f){
					return barDataByFloor[f-1].aps;
				});
				addBarData = Array.prototype.concat.apply([], addBarData);
				update_ap_bars(addBarData);
				//
				db_tl.tlDataApsOfFloors(timeRange[0], timeRange[1], 10, change, update_ap_tls);
				// check whether there are some old selected aps
				var oldSelAps = EventManager.selectedAps();
				console.log("old selected aps");
				g.selectAll(".ap-bars-g, .ap-tls-g").selectAll("g.tl, g.bar").filter(function(d){
					return oldSelAps.indexOf(d.apid) != -1;
				}).attr("_selected", true).classed("selected", true);
			}else{
				var removedApids = [];
				g.selectAll(".ap-bars-g, .ap-tls-g").selectAll("g.tl, g.bar").filter(function(d){
					if(change.indexOf(d.floor) != -1){
						removedApids.push(d.apid);
						return true;
					}
					return false;
				}).remove();
				curApidLst = _.difference(curApidLst, removedApids);
				update_ap_bars();
				update_ap_tls();
			}
		}
		if(message ==  WFV.Message.floorHover){

		}
		if(message ==  WFV.Message.ApHover){
			var apid = data.apid, change = data.change, isAdd = data.isAdd;
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).classed("hover", isAdd);
		}
		if(message ==  WFV.Message.ApSelect){
			var apid = data.apid, change = data.change, isAdd = data.isAdd;
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).classed("selected", isAdd).attr("_selected", isAdd ? "true" : null);
		}
		if(message ==  WFV.Message.TimeRangeChanged){
			timeRange = data.range;
			x_scale.domain(timeRange);
			db.ap_bar_data(timeRange[0], timeRange[1], function(data){
				barDataByFloor = data;	
				var newBarData = selFloors.map(function(floor){return barDataByFloor[floor-1].aps});
				newBarData = Array.prototype.concat.apply([], newBarData);
				update_ap_bars(newBarData);
			});
			db_tl.tlDataApsOfFloors(timeRange[0], timeRange[1], 10, selFloors, update_ap_tls);
			g.select(".ap-tls-g").select(".x.axis").call(time_axis.scale(x_scale));
		}
	}

	//
	function update_ap_bars(_data){
		// [{apid:, floor, count:, type:"ap"}]
		var items = g.select(".ap-bars-g").selectAll("g.bar");
		if(_data && _data.length){
			//
			items = items.data(_data, function(d){return d.apid});
			var enter = items.enter().append("g").attr("class", "bar");
			enter.append("rect").append("title");
			enter.append("text").attr("class", "label");
			enter.append("text").attr("class", "value");
			// 
			enter.each(function(d){
				curApidLst.push(d.apid);
			});
			//bars.exit().remove();
		}
		// to sort the slections  TODO
		items = g.select(".ap-bars-g").selectAll("g.bar");
		var tmpCurIds = [];
		items.sort(function(d1, d2){
			return d2.count - d1.count;	
		}).order().each(function(d){
			tmpCurIds.push(d.apid);
		});
		curApidLst = tmpCurIds;
		// update bar scale
		var cmax = 1;
		items.each(function(d){
			cmax = d.count > cmax ? d.count : cmax;	
		});
		bar_scale.domain([0, cmax]);
		//
		vertical_scale.domain(curApidLst);
		var per_height = vertical_scale.rangeBand();
		y_scale.range([per_height, 4]);
		//
		items.attr("apid", function(d){return d.apid})
			.each(function(d){
				var ele = d3.select(this);
				ele.select("rect").style("fill", floor_color(d.floor))
					.attr("height", per_height - 2)
					.attr("width", bar_scale(d.count))
					.select("title").text("persons(occur): " + d.count);
				var _name = apMap.get(d.apid).name.split(/ap|f/);
				_name.shift();
				ele.selectAll("text").attr("y", per_height/2).attr("dy", 5);
				ele.select("text.label").text(_name.join("-")).attr("x", -6)
					ele.select("text.value").text(d.count).attr("x", bar_scale(d.count)).attr("dy", 6);
			}).on("click", function(d){
				onApClick.call(this, d.apid);
			}).on("mousemove",function(d){
				onApHover(d.apid, true);
			}).on("mouseout", function(d){
				onApHover(d.apid, false);
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.apid);
			return "translate(0,"+dy+")";
		});
	}
	function update_ap_tls(_data){
		var items = g.select(".ap-tls-g").selectAll("g.tl");
		if(_data){
			items = items.data(_data, function(d){return d.apid});
			var enter = items.enter().append("g").attr("class", "tl");
			enter.append("path");
			enter.append("circle").attr("r", 3).attr("fill", "#807E7E").style("opacity", 0);
			enter.append("text");
		}
		var per_height = vertical_scale.rangeBand();
		//
		items = g.select(".ap-tls-g").selectAll("g.tl");
		items.each(function(d){
			d.maxCount = d3.max(d.tl_data, function(d){return d.count});
		})
		//
		items.attr("apid", function(d){return d.apid})
			.each(function(d){
				var ele = d3.select(this);
				var cmax = d3.max(d.tl_data, function(d){return d.count});
				y_scale.domain([0, cmax || 1]);
				ele.select("path").attr("d", line(d.tl_data))
					.style("fill", floor_color(d.floor))
					.style("fill-opacity", "0.5")
					.style("stroke", "black");
			}).on("click", function(d){
				onApClick.call(this, d.apid);
			}).on("mouseenter",function(d){
				onApHover(d.apid, true);
			}).on("mousemove", function(d){
				var pos = d3.mouse(this);
				var p = [pos[1] - 10, pos[0] - 10, d];
				tipAp.show(p, this);
			}).on("mouseout", function(d){
				onApHover(d.apid, false);
				tipAp.hide();
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.apid);
			return "translate(0,"+dy+")";
		});
	}
	function onApHover(apid, f){
		g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
			return d.apid == apid;
		}).classed("hover", f);
		if(f){
			EventManager.apHover([apid], FloorBarFloorAps);
		}else{
			EventManager.apDehover([apid], FloorBarFloorAps);
		}
	}
	function onApClick(apid){
		if(d3.select(this).attr("_selected")){
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.apid == apid;
			}).classed("selected",false).attr("_selected", null);
			EventManager.apDeselect([apid], FloorBarFloorAps);
		}else{
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.apid == apid;
			}).classed("selected",true).attr("_selected", true);
			EventManager.apSelect([apid], FloorBarFloorAps);
		}
	}
	//
	$(window).resize(function(){
		init_svg();
		update_ap_bars();
		update_ap_tls();
	});
	//
	return FloorBarFloorAps;
}

WFV.FloorBarSelAps = function(){
	function FloorBarSelAps(){}
	var floor_color = ColorScheme.floor;
	//
	var svg = $("#floor-bar-sel-aps-wrapper > svg"), size;
	var g = d3.select('#floor-bar-sel-aps-g');
	//
	var tl_offset;
	var x_scale = d3.time.scale(),
		y_scale = d3.scale.linear(),
		bar_scale = d3.scale.linear(),
		vertical_scale = d3.scale.ordinal();
	var tickFormat = d3.time.format.multi([
			["%I:%M", function(d) { return d.getMinutes(); }],
			["%H:%M", function(d) { return d.getHours(); }],
			["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
			["%b %d", function(d) { return d.getDate() != 1; }]
	]);
	var time_axis = d3.svg.axis().scale(x_scale).ticks(3).tickFormat(tickFormat);
	var line = d3.svg.area().interpolate("monotone")
		.x(function(d){return x_scale(d.time)})
		.y(function(d){return y_scale(d.count)})
		.y0(function(){return vertical_scale.rangeBand()});

	//
	var timePoint, timeRange = [timeFrom, timeTo],
		selFloors = [], curApidLst = [];
	var barDataByFloor, barDataMap;
	//
	var tipTimePoint = d3.tip().attr('class', 'd3-tip')
		.direction("nw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var time = d[2];
			var f = d3.time.format("%Y-%m-%d %H:%M:%S");
			return f(time);
		});
	var tipAp= d3.tip().attr('class', 'd3-tip')
		.direction("nw")
		.offset(function(d){
			return [d[0],d[1]];
		}).html(function(d){
			var ap = d[2];
			var _name = apMap.get(ap.apid).name.split(/ap|f/);
			_name.shift();
			return "ap:" + _name.join("-") + "</br>"
				+ "apid:" + ap.apid + "</br>"
				+ "max online person:" + ap.maxCount;
		});
	d3.select("#floor-bar-sel-aps-wrapper").select("svg").call(tipTimePoint);
	d3.select("#floor-bar-sel-aps-wrapper").select("svg").call(tipAp);
	//
	init_svg();
	init_interaction();
	//
	function init_svg(){
		var _w = svg.width(), _h = svg.height();
		size = utils.initG(g, _w, _h, [10, 20, 20, 30]);
		//
		var offset = tl_offset = size.width * 0.25;
		vertical_scale.rangeBands([0, size.height]);
		x_scale.range([0, size.width - offset]);
		bar_scale.range([0, offset - 6]);
		//
		//
		g.select(".ap-tls-g").attr("transform", "translate("+offset+")");
		g.select(".ap-tls-g").select(".x.axis")
			.attr("transform", "translate(0,"+size.height+")").call(time_axis.scale(x_scale));
	}
	function init_interaction(){
		g.select(".ap-tls-g").on("mousemove", function(d){
			var pos = d3.mouse(this);
			var time = x_scale.invert(pos[0]);
			// update value circles
			var index = -2, dx, realTime = null;
			g.select(".ap-tls-g").selectAll("g.tl").each(function(d){
				if(!realTime){
					index = utils.lastIndexOfLess(d.tl_data, time, function(d){return d.time});
					if(index < 0) index = 0;
					if(index > d.tl_data.length -1) index = d.tl_data.length - 1;
					realTime = d.tl_data[index].time;
					dx = x_scale(realTime);
				}
				y_scale.domain([0, d.maxCount]);
				var count = d.tl_data[index].count;
				var dy = y_scale(count);
				d3.select(this).select("circle").attr("cx", dx).attr("cy", dy).style("opacity", 1);
				d3.select(this).select("text")
					// .attr("x", dx).attr("y", dy)
					.attr("x", x_scale.range()[1]).attr("y", vertical_scale.rangeBand())
					.style("text-anchor", "start").style("font-size", "10px")
					.text(count).style("opacity", 1);
			});
			// update timeline
			d3.select(this).select("line.timepoint-line")
				.attr("x1", dx).attr("y1", 0)
				.attr("x2", dx).attr("y2", size.height);
			var p = [pos[1] - 10, pos[0] - 10, realTime];
			tipTimePoint.show(p,this);
		}).on("mouseout", function(d){
			tipTimePoint.hide();
			g.select(".ap-tls-g").selectAll("g.tl").each(function(d){
				d3.select(this).selectAll("circle, text").style("opacity", 0);
			});
		});
	}
	//
	ObserverManager.addListener(FloorBarSelAps);
	FloorBarSelAps.OMListen = function(message, data, sender){
		if(message == WFV.Message.FloorChange){
		}
		if(message ==  WFV.Message.FloorSelect){
		}
		if(message ==  WFV.Message.floorHover){
		}
		if(message ==  WFV.Message.ApHover){
			var apid = data.apid, change = data.change, isAdd = data.isAdd;
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return change.indexOf(d.apid) != -1;
			}).classed("hover", isAdd);
		}
		if(message ==  WFV.Message.ApSelect){
			var apid = data.apid, change = data.change, isAdd = data.isAdd;
			if(isAdd){
				var newBarData = change.map(function(d){return barDataMap.get(d)});
				update_ap_bars(newBarData);
				//
				db_tl.tlDataAps(timeRange[0], timeRange[1], 10, change, update_ap_tls);
			}else{
				g.selectAll(".ap-bars-g, .ap-tls-g").selectAll("g.tl, g.bar").filter(function(d){
					return change.indexOf(d.apid) != -1;
				}).remove();
				curApidLst = _.difference(curApidLst, change);
				update_ap_bars();
				update_ap_tls();
			}
		}
		if(message ==  WFV.Message.TimeRangeChanged){
			timeRange = data.range;
			x_scale.domain(timeRange);
			db.ap_bar_data(timeRange[0], timeRange[1], function(data){
				barDataMap = data;	
				var newBarData = curApidLst.map(function(apid){return barDataMap.get(apid)});
				update_ap_bars(newBarData);
			}, true);
			//
			db_tl.tlDataAps(timeRange[0], timeRange[1], 10, curApidLst, update_ap_tls);
			g.select(".ap-tls-g").select(".x.axis").call(time_axis.scale(x_scale));
		}
	}

	//
	function update_ap_bars(_data){
		// [{apid:, floor, count:, type:"ap"}]
		var items = g.select(".ap-bars-g").selectAll("g.bar");
		if(_data && _data.length){
			//
			items = items.data(_data, function(d){return d.apid});
			var enter = items.enter().append("g").attr("class", "bar");
			enter.append("rect").append("title");
			enter.append("text").attr("class", "label");
			enter.append("text").attr("class", "value");
			// 
			enter.each(function(d){
				curApidLst.push(d.apid);
			});
			//bars.exit().remove();
		}
		// to sort the slections  TODO
		items = g.select(".ap-bars-g").selectAll("g.bar");
		var tmpCurIds = [];
		items.sort(function(d1, d2){
			return d2.count - d1.count;	
		}).order().each(function(d){
			tmpCurIds.push(d.apid);
		});
		curApidLst = tmpCurIds;
		// update bar scale
		var cmax = 1;
		items.each(function(d){
			cmax = d.count > cmax ? d.count : cmax;	
		});
		bar_scale.domain([0, cmax]);
		//
		vertical_scale.domain(curApidLst).rangeBands([0, size.height]);
		var per_height = vertical_scale.rangeBand();
		// adjust bar height
		if(per_height && per_height > size.height / 5){
			per_height = size.height / 5;
			vertical_scale.rangeBands([0, per_height * curApidLst.length]);
			per_height = vertical_scale.rangeBand();
		}
		y_scale.range([per_height, 4]);
		//
		items.attr("apid", function(d){return d.apid})
			.each(function(d){
				var ele = d3.select(this);
				ele.select("rect").style("fill", floor_color(d.floor))
					.attr("height", per_height - 2)
					.attr("width", bar_scale(d.count))
					.select("title").text("persons(occur): " + d.count);
				var _name = apMap.get(d.apid).name.split(/ap|f/);
				_name.shift();
				ele.selectAll("text").attr("y", per_height/2).attr("dy", 5);
				ele.select("text.label").text(_name.join("-")).attr("x", -6)
					ele.select("text.value").text(d.count).attr("x", bar_scale(d.count)).attr("dy", 6);
			}).on("click", function(d){
				// onApClick.call(this, d.apid);
			}).on("mousemove",function(d){
				onApHover(d.apid, true);
			}).on("mouseout", function(d){
				onApHover(d.apid, false);
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.apid);
			return "translate(0,"+dy+")";
		});
	}
	function update_ap_tls(_data){
		var items = g.select(".ap-tls-g").selectAll("g.tl");
		if(_data){
			items = items.data(_data, function(d){return d.apid});
			var enter = items.enter().append("g").attr("class", "tl");
			enter.append("path");
			enter.append("circle").attr("r", 3).attr("fill", "#807E7E").style("opacity", 0);
			enter.append("text");
		}
		var per_height = vertical_scale.rangeBand();
		//
		items = g.select(".ap-tls-g").selectAll("g.tl");
		items.each(function(d){
			d.maxCount = d3.max(d.tl_data, function(d){return d.count});
		})
		//
		items.attr("apid", function(d){return d.apid})
			.each(function(d){
				var ele = d3.select(this);
				var cmax = d3.max(d.tl_data, function(d){return d.count});
				y_scale.domain([0, cmax || 1]);
				ele.select("path").attr("d", line(d.tl_data))
					.style("fill", floor_color(d.floor))
					.style("fill-opacity", "0.5")
					.style("stroke", "black");
			}).on("click", function(d){
				// onApClick.call(this, d.apid);
			}).on("mouseenter",function(d){
				onApHover(d.apid, true);
			}).on("mousemove", function(d){
				var pos = d3.mouse(this);
				var p = [pos[1] + 60, pos[0] - 10, d];
				tipAp.show(p, this);
			}).on("mouseout", function(d){
				onApHover(d.apid, false);
				tipAp.hide();
			});
		items.transition().attr("transform", function(d){
			var dy = vertical_scale(d.apid);
			return "translate(0,"+dy+")";
		});
	}
	function onApHover(apid, f){
		g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
			return d.apid == apid;
		}).classed("hover", f);
		if(f){
			EventManager.apHover([apid], FloorBarSelAps);
		}else{
			EventManager.apDehover([apid], FloorBarSelAps);
		}
	}
	function onApClick(apid){
		if(d3.select(this).attr("_selected")){
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.apid == apid;
			}).classed("selected",false).attr("_selected", null);
			EventManager.apDeselect([apid], FloorBarSelAps);
		}else{
			g.selectAll(".ap-tls-g, .ap-bars-g").selectAll("g.tl, g.bar").filter(function(d){
				return d.apid == apid;
			}).classed("selected",true).attr("_selected", true);
			EventManager.apSelect([apid], FloorBarSelAps);
		}
	}
	//
	$(window).resize(function(){
		init_svg();
		update_ap_bars();
		update_ap_tls();
	});
	//
	return FloorBarSelAps;
}
