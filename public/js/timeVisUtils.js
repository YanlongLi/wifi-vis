var TimePeriodViz = function(svgGroupName,className,pos){
	this.width = pos.width;
	this.height = pos.height;
	this.className = className;
	this.svg = d3.select("#"+svgGroupName).select("svg."+className)
		.attr("transform","translate("+pos.x+","+pos.y+")")
		.attr("width",this.width)
		.attr("height",this.height);
	this.init();
	this.draw(pos);
}

TimePeriodViz.prototype = {
	init:function(){
		var leftMargin = 40;
		var xScale;
		if(this.className=="hourPeriod"){
			xScale = d3.scale.linear().domain([0,24]).range([leftMargin,this.width -10])			
		}else{
			xScale = d3.scale.linear().domain([0,7]).rangeRound([leftMargin,this.width -10])						
		}
		this.xScale = xScale;
		this.svg.append("g")
			.attr("id","timelineXAxis"+'P')
			.attr("class","timelineXAxis" + "P")
			.attr("transform","translate(0,"+(this.height-10)+")")

			this.xAxis = d3.svg.axis()
			.scale(this.xScale)
			.orient('bottom')
			.tickSize(2,0,4)
			.tickSubdivide(0);

		this.svg.select("#timelineXAxis"+"P").call(this.xAxis);

		var textYPos = this.height/2.0;
		var textLabel = this.className=="hourPeriod"?"Period (Hour)":"Period (Day)";
		this.svg.append("text")
			.attr("transform","translate("+ 0+"," + textYPos+")")
			.text(textLabel)
			//			.text("Period (Day)")
			//			.style("text-anchor","end");
	},
	draw:function(pos){
		this.setBrush(pos);

		//this.timeBrush = new TimeBrush(this.svg,{width:pos.width,height:this.height-10},this.xScale)
	},
	setBrush:function(pos){
		d3.selectAll(".mBrush").style("pointer-events","none");
		this.brushSel = this.svg.append("g").attr("class","brush")
			.style("pointer-events","none");
		this.pos = pos;	
		var myBrush = this;
		var sel = this.brushSel;
		var timeBrush = d3.svg.brush()
			.x(this.xScale)
			.on("brushstart",brushStart)
			.on("brush",brushMove)
			.on("brushend",brushEnd);

		var height = this.pos.height-10;
		sel.call(timeBrush)
			.selectAll("rect")
			.attr("height",height);

		this.timeBrush = timeBrush;

		function brushStart(){
			timeViz.timeArrays[myBrush.className] = [];
			timeViz.toggleBrush(false,myBrush.className);
			sel.classed("selecting",true);
		}
		function brushMove(){
			var e = d3.event.target.extent();
			var stTime = e[0]*3600*1000;
			var edTime = e[1]*3600*1000;
			if(myBrush.className=="dayPeriod"){
				stTime = Math.floor(e[0])*3600*1000*24;
				edTime = Math.ceil(e[1])*3600*1000*24;
				// stTime = stTime*24;
				// edTime = edTime*24;
			}
			timeViz.periodTimeBrush[myBrush.className].updateByOutsider(stTime,edTime)			
				//			timeViz.timeBrush.updateByOutsider(stTime,edTime)
				//			this.timeBrush = new PeriodicTimeBrush(this.svg,{width:pos.width,height:this.height+5},this.xScale,period);

		}
		function brushEnd(){
			d3.selectAll(".mBrush").style("pointer-events","none");
			var e = d3.event.target.extent();
			// if(e[1]-e[0]<0.01){
			// 	timeViz.timeArrays[myBrush.className] = [];
			// 	timeViz.toggleBrush(true);
			// 	dataManager.filterStartEndTime(e,true);			

			// 	return;		
			// }
			if(e[1]-e[0]<0.01){
				timeViz.timeArrays[myBrush.className] = [];
				timeViz.toggleBrush(true);

				//var mergedArray = timeArrays;
				var mergedArray = []
					var flag = false;
				for(var index in timeViz.timeArrays){
					if(timeViz.timeArrays[index] && timeViz.timeArrays[index].length>0 && index!=myBrush.className){
						mergedArray = timeViz.timeArrays[index];
						timeViz.periodTimeBrush[index].updateByOutsiderOther(timeViz.timeArrays[index]);

						flag = true;
						break;
					}
				}
				if(!flag){
					dataManager.filterStartEndTime(e,true);						
				}else{
					var brushNum = mergedArray.length;

					var testDomain = [];
					var testRange = [];

					var xScale = timeViz.periodTimeBrush[myBrush.className].xScale;
					testDomain.push(xScale.domain()[0]);
					testRange.push(0);
					for(var i=0;i<brushNum;i++){
						testDomain = testDomain.concat([mergedArray[i][0],mergedArray[i][1]]);

						if(i!=brushNum-1){
							var middle = (mergedArray[i][1].getTime()+mergedArray[i][0].getTime())/2.0;
							middle = new Date(middle);
							testDomain.push(middle);
						}else{
							testDomain.push(xScale.domain()[xScale.domain().length-1]);
						}
						testRange = testRange.concat([1,1,0]);
					}


					var testScale = d3.scale.linear().domain(testDomain).range(testRange);
					dataManager.filterMultipleStartEndTime(mergedArray,testScale);

				}
				return;		
			}


			var e = d3.event.target.extent();
			startTimeOffset = e[0]*3600*1000;
			endTimeOffset = e[1]*3600*1000;
			if(myBrush.className=="dayPeriod"){
				startTimeOffset = Math.floor(e[0])*3600*1000*24;
				endTimeOffset = Math.ceil(e[1])*3600*1000*24;
			}			
			var period = timeViz.periodTimeBrush[myBrush.className].period;
			var periodArray = timeViz.periodTimeBrush[myBrush.className].periodArray;
			// var periodArray = timeViz.timeBrush.periodArray;

			// if(e[1]-e[0]<1000){
			// 	svgGroup.selectAll("g.mBrush").remove();
			// 	myBrush.setMultipleBrush();
			// 	dataManager.filterStartEndTime(e,true);
			// 	return;
			// }
			var offset = new Date().getTimezoneOffset()/60 *3600*1000;
			if(period!=86400000){
				offset = new Date().getTimezoneOffset()/60*3600*1000 + 24*3600*1000*3;
			}

			var testDomain = [];
			var testRange = [];

			var timeArrays = [];
			for(var i=0;i<periodArray.length;i++){
				// var startTime = periodArray[i].domain()[0].getTime()+startTimeOffset;
				// var endTime = periodArray[i].domain()[0].getTime()+endTimeOffset;
				// if(endTime>periodArray[i].domain()[1]){
				// 	endTime = periodArray[i].domain()[1];
				// }

				var stDomain = periodArray[i].domain()[0].getTime() - offset;
				var edDomain = periodArray[i].domain()[1].getTime() - offset;

				var startTime = (period)*(Math.floor(1.0*stDomain/period)) + offset + startTimeOffset;
				var endTime = (period)*(Math.floor(1.0*stDomain/period)) + offset + endTimeOffset;

				if(startTime<periodArray[i].domain()[0]){
					startTime = periodArray[i].domain()[0];
				}
				if(endTime<periodArray[i].domain()[0]){
					endTime = periodArray[i].domain()[0];
				}
				if(startTime>periodArray[i].domain()[1]){
					startTime = periodArray[i].domain()[1];
				}
				if(endTime>periodArray[i].domain()[1]){
					endTime = periodArray[i].domain()[1];
				}

				timeArrays.push([new Date(startTime),new Date(endTime)]);

				// testDomain = testDomain.concat(periodArray[i].domain()[0],new Date(startTime),new Date(endTime),periodArray[i].domain()[1]);
				// testRange = testRange.concat([0,1,1,0]);
			}

			timeViz.timeArrays[myBrush.className]  = timeArrays;

			var mergedArray = timeArrays;
			for(var index in timeViz.timeArrays){
				if(timeViz.timeArrays[index] && timeViz.timeArrays[index].length>0 && index!=myBrush.className){
					mergedArray = mergeSequence(timeArrays,timeViz.timeArrays[index]);
					break;
				}
			}
			var brushNum = mergedArray.length;

			var xScale = timeViz.periodTimeBrush[myBrush.className].xScale;
			testDomain.push(xScale.domain()[0]);
			testRange.push(0);
			for(var i=0;i<brushNum;i++){
				testDomain = testDomain.concat([mergedArray[i][0],mergedArray[i][1]]);

				if(i!=brushNum-1){
					var middle = (mergedArray[i][1].getTime()+mergedArray[i][0].getTime())/2.0;
					middle = new Date(middle);
					testDomain.push(middle);
				}else{
					testDomain.push(xScale.domain()[xScale.domain().length-1]);
				}
				testRange = testRange.concat([1,1,0]);
			}


			var testScale = d3.scale.linear().domain(testDomain).range(testRange);
			dataManager.filterMultipleStartEndTime(mergedArray,testScale);

			//			dataManager.filterMultipleStartEndTime(timeArrays,testScale);

		}
		sel.selectAll("rect.extent").style("fill","rgba(255,255,255,0.5)")
	},
}


var TimeViz = function(svgGroupName,data,id,timeIndex,keyIndex){
	this.svgGroupName = svgGroupName;
	this.data = data;
	this.id = id;
	this.svg = d3.select("#time-wrapper").select("svg");
	var timeViz = this;
	this.timeArrays = {};
	this.animationParameter = {
		"type":"normal",
		"timeStep(min)":5,
		"play":function(){
			timeViz.play();
		},
		"Periodic":"none"
	}
	this.animationFlag = false;
	this.periodTimeBrush = {};
	this.updateData(timeIndex,keyIndex,data);
}

TimeViz.prototype = {
	updateData:function(timeIndex,keyIndex,data){
		this.data = data?data:this.data;
		this.shownData = [];

		var binNum = 500;
		var extent = d3.extent(data.map(function(d){
			return d.dateTime;
		}))
		console.log("extent:",extent);
		var binSize = (extent[1].getTime()-extent[0].getTime())/binNum;
		for(var i=0;i<binNum+1;i++){
			var t = extent[0].getTime()+i*binSize;
			var dt = new Date(t);
			this.shownData.push({dateTime:dt,value:0})
		}
		for(var i=0;i<data.length;i++){
			var index = parseInt((data[i].dateTime-extent[0])/binSize);
			this.shownData[index].value++;
		}
		/*
			 for(var i=0;i<data.length;i++){
			 var timeString = data[i][timeIndex];
			 var dt = new Date(timeString);
			 this.shownData.push({dateTime:dt,value:parseFloat(data[i][keyIndex]),id:i});
			 }
			 */		
		/*
			 this.maxValue = d3.max(this.shownData,function(d){
			 return d.value;
			 })
			 */

		this.xScale = d3.time.scale().domain(d3.extent(this.shownData.map(function(d){
			return d.dateTime;
		})));
		this.yScale = d3.scale.linear().domain(d3.extent(this.shownData.map(function(d){
			return d.value;
		})));

	},
	renderBasicTimeLine:function(pos,color,hideTick,title){
		//this.width = pos.width;
		this.height = pos.height * 0.65;
		//this.leftMargin = pos.width/20.0;
		//this.width = pos.width-this.leftMargin;
		this.width = pos.width;
		//d3.select("#"+this.svgGroupName).remove();
		// d3.select("#time-svg").append("g")
		//d3.select("#time-wrapper").remove();
		var SVG = this.svg;
		var svgGroup = SVG.append("g");
		svgGroup.attr("id",this.svgGroupName)
			.attr("transform","translate("+pos.x+","+pos.y+")");

		//svgGroup.select("#timelineXAxis"+this.id).remove();
		svgGroup.append("g")
			.attr("id","timelineXAxis"+this.id)
			.attr("class","timelineXAxis")
			.attr("transform","translate(0,"+this.height+")")
			//.attr("transform","translate("+this.leftMargin+",0)");


			var leftMargin = 40;
		svgGroup.append("g")
			.attr("id","timelineYAxis"+this.id)
			.attr("class","timelineYAxis")
			.attr("transform","translate("+leftMargin+",0)")

			//this.xScale.range([this.leftMargin,this.leftMargin+this.width]);
			this.xScale.range([leftMargin,this.width-10]);
		this.yScale.range([this.height,0]);

		this.xAxis = d3.svg.axis()
			.scale(this.xScale)
			.orient('bottom')
			.tickSize(2,0,4)
			.tickSubdivide(0);

		this.yAxis = d3.svg.axis()
			.scale(this.yScale)
			.orient('left')
			.ticks(4)

			svgGroup.select("#timelineXAxis"+this.id).call(this.xAxis);
		svgGroup.select("#timelineYAxis"+this.id).call(this.yAxis);
		if(hideTick){
			svgGroup.selectAll("#timelineXAxis"+this.id)
				.selectAll("text")
				.style("visibility","hidden");
		}
		var myTimeViz = this;

		var line = d3.svg.line()
			.x(function(d){
				return myTimeViz.xScale(d.dateTime);
			})
		.y(function(d){
			return myTimeViz.yScale(d.value);
		});

		var sel = svgGroup.append("path").attr("class","basicTimeline")
			.datum(this.shownData);

		sel.attr("d",line)
			.style("stroke",color)
			.attr("fill","none");

		//this.renderTitle(svgGroup,pos,title);
		this.pos = pos;
		///////brsuh
		//this.timeBrush = new TimeBrush(this.svg,{width:pos.width,height:this.height+5},this.xScale)
		//this.multiTimeBrush = new PeriodicTimeBrush(this.svg,{width:pos.width,height:this.height+5},this.xScale,6*3600*1000);
		this.toggleBrush(true);
		//this.timeBrush.updateBrush()
	},
	toggleBrush:function(flag,periodFlag){
		var pos = this.pos;
		this.svg.selectAll("g.brush").remove();
		this.svg.selectAll("g.mBrush").remove();
		if(flag){
			this.timeBrush = new TimeBrush(this.svg,{width:pos.width,height:this.height+5},this.xScale)			
		}else{
			var period = 24*3600*1000;
			if(periodFlag && periodFlag=="dayPeriod"){
				period = 7*24*3600*1000;
			}
			//			this.timeBrush = new PeriodicTimeBrush(this.svg,{width:pos.width,height:this.height+5},this.xScale,period);			
			this.periodTimeBrush[periodFlag] = new PeriodicTimeBrush(this.svg,{width:pos.width,height:this.height+5},this.xScale,period,periodFlag);

		}
	},
	toggleBrush1:function(){
		var pos = this.pos;
		d3.selectAll("g.brush").remove();
		d3.selectAll("g.mBrush").remove();
		if(this.animationParameter.Periodic=="none"){
			this.timeBrush = new TimeBrush(this.svg,{width:pos.width,height:this.height+5},this.xScale)
		}else{
			var period = 12*3600*1000;
			if(this.animationParameter.Periodic=="half day"){
				period = 12*3600*1000;
			}else if(this.animationParameter.Periodic=="day"){
				period = 24*3600*1000;
			}else if(this.animationParameter.Periodic=="week"){
				period = 7*24*3600*1000;
			}
			this.timeBrush = new PeriodicTimeBrush(this.svg,{width:pos.width,height:this.height+5},this.xScale,period);
		}		
	},
	renderTitle:function(svg,pos,title){
		var gTitle = svg.append("g").attr("class","timelineTitle")
			.attr("transform","translate(0,"+pos.height/1.5+")");
		gTitle.append("text")
			.text(title)
			//.attr("text-anchor","start")
			//.style("text-align","left");

	},
	renderHorizonTimeline:function(pos,color,bandNum,hideTick,title){
		this.height = pos.height;
		this.leftMargin = pos.width/20.0;
		this.width = pos.width-this.leftMargin;
		d3.select("#"+this.svgGroupName).remove();
		// d3.select("#time-svg").append("g")
		var SVG = d3.select("#time-svg");
		var svgGroup = SVG.append("g");
		svgGroup.attr("id",this.svgGroupName)
			.attr("transform","translate("+pos.x+","+pos.y+")");

		//svgGroup.select("#timelineXAxis"+this.id).remove();
		svgGroup.append("g")
			.attr("id","timelineXAxis"+this.id)
			.attr("class","timelineXAxis")
			.attr("transform","translate(0,"+this.height+")")
			//.attr("transform","translate("+this.leftMargin+",0)");

			this.xScale.range([this.leftMargin,this.leftMargin+this.width]);
		this.yScale.range([this.height,0]);

		this.xAxis = d3.svg.axis()
			.scale(this.xScale)
			.orient('bottom')
			//.ticks(16)
			.tickSubdivide(3)
			.tickSize(4,0,2)
			.innerTickSize(2)
			.tickPadding(1)
			.tickFormat(d3.time.format("%H:%M:%S"))

			svgGroup.select("#timelineXAxis"+this.id).call(this.xAxis);
		if(hideTick){
			svgGroup.selectAll("#timelineXAxis"+this.id)
				.selectAll("text")
				.style("visibility","hidden");
		}

		var chart = d3.horizon()
			.width(this.width)
			.height(this.height)
			.bands(bandNum)
			.mode("mirror")
			.interpolate("basis");

		var data = this.shownData.map(function(d){
			return [d.dateTime,d.value+1];
		})

		gHorizon = svgGroup.append("g").attr("class","horizon")
			.attr("transform","translate("+this.leftMargin+",0)");

		gHorizon.data([data]).call(chart);
		this.svgGroup = svgGroup;

		this.renderTitle(svgGroup,pos,title);
	},
	play:function(){
		if(this.animationFlag){
			parameterManager.turnPlay(true);			
			this.animationFlag = !this.animationFlag;
			//should not be here...

			return;
		}
		parameterManager.turnPlay(false);
		this.animationFlag = true;
		var myTimeViz = this;
		var startTime = this.xScale.domain()[0];
		var endTime = new Date(startTime.getTime()+1000*60*60*3);
		if(myTimeViz.timeBrush.filteredStartEndTime){
			startTime = myTimeViz.timeBrush.filteredStartEndTime[0];
			endTime = myTimeViz.timeBrush.filteredStartEndTime[1];
		}
		var timeRange = endTime.getTime()-startTime.getTime();
		var globalEndTime = this.xScale.domain()[1];
		var timeStep = myTimeViz.animationParameter["timeStep(min)"]*60*1000;

		myTimeViz.animation(startTime,globalEndTime,timeRange,timeStep);

		//start Animation
	},
	animation:function(stTime,edTime,timeRange,timeStep){
		var currentStartTime = stTime;
		var currentEndTime = new Date(stTime.getTime() + timeRange);
		var newStartTime = new Date(currentStartTime.getTime());
		var newEndTime = new Date(currentEndTime.getTime());  

		var myTimeViz = this;
		var timer = setInterval(function(){
			if(currentEndTime>=edTime || !myTimeViz.animationFlag){
				clearInterval(timer);
				if(myTimeViz.animationParameter.type=="movement"){
					dataManager.filterStartEndTimeMovement([newStartTime,newEndTime],true,[myTimeViz.animationParameter["timeStep(min)"]]);
				}
				parameterManager.turnPlay(true);     			
				myTimeViz.animationFlag = false;
			}else{
				timeStep = myTimeViz.animationParameter["timeStep(min)"]*60*1000;
				newStartTime = new Date(currentStartTime.getTime()+timeStep);
				newEndTime = new Date(currentEndTime.getTime()+timeStep);
				if(myTimeViz.animationParameter.type=="movement"){
					dataManager.filterStartEndTimeMovement([newStartTime,newEndTime],false,[myTimeViz.animationParameter["timeStep(min)"]]);
				}else{
					dataManager.filterStartEndTime([newStartTime,newEndTime]);
				}
				myTimeViz.timeBrush.updateBrush(newStartTime,newEndTime);
				currentStartTime = newStartTime;
				currentEndTime = newEndTime;
			}
		},100);
	},
	updateDataPoint:function(data,linksData){
		var xScale = this.xScale;
		var y = this.yScale.range()[0];
		var yScale = this.yScale;
		var controlScale = d3.scale.log().domain(d3.extent(linksData.map(function(d){
			return d.timeDistance+1;
		}))).range(yScale.range());

		var svg = this.svg;

		var newLinksData = [];
		for(var i=0;i<linksData.length;i++){
			var d1 = {x:xScale(linksData[i].src.dateTime),y:y};
			var dd3 = {x:xScale(linksData[i].dest.dateTime),y:y};
			var d2 = {x:(d1.x+dd3.x)/2.0,y:controlScale(linksData[i].timeDistance+1)};
			newLinksData.push([d1,d2,dd3]);
			newLinksData[newLinksData.length-1].index = i;
		}

		var line = d3.svg.line()
			.interpolate("monotone")
			.x(function(d){
				return d.x;
			})
		.y(function(d){
			return d.y;
		})

		var selLinks = svg.selectAll("path.timeClusterNodeLink")
			.data(newLinksData,function(d){
				return d.index;
			});
		var enter1 = selLinks.enter().append("path")
			.attr("class","timeClusterNodeLink");

		selLinks.style("stroke","rgb(255,255,0)")
			.style("stroke-opacity","0.2")		
			.transition()
			.attr("d",line)
			.style("pointer-events","none");

		selLinks.exit().remove();

		var sel = svg.selectAll("g.timeClusterNode")
			.data(data,function(d){
				return d.id;
			});

		var enter = sel.enter().append("g")
			.attr("class","timeClusterNode")
			enter.append("circle");

		sel.selectAll("circle")
			.data(data,function(d){
				return d.id;
			})
		.attr("r",3)
			.style("fill",function(d){
				return fillColor(d.clusterInfo.index);
			})
		.style("stroke","none")
			.transition()
			.attr("cx",function(d){
				return xScale(d.dateTime);
			})
		.attr("cy",y);
		sel.exit().remove();

	},
	updateDataPointwithLine:function(data,linksData){
		var xScale = this.xScale;
		var yScaleRange = this.yScale.range();
		var yScaleDomain = d3.extent(data.map(function(d){
			return d.xDis;
		}));
		this.pointYScale = d3.scale.linear().domain(yScaleDomain)
			.range([yScaleRange[0]-3,yScaleRange[1]+3]);

		var pointYScale = this.pointYScale;

		var svg = this.svg;

		var selLinks = svg.selectAll("path.timeClusterNodeLink")
			.data(linksData,function(d){
				return d.src.id +"," + d.dest.id;
			});
		var enter1 = selLinks.enter().append("path")
			.attr("class","timeClusterNodeLink");

		selLinks.style("stroke","rgb(255,255,0")
			.transition()
			.attr("d",function(d){
				var x0 = xScale(d.src.dateTime);
				var y0 = pointYScale(d.src.xDis);
				var x1 = xScale(d.dest.dateTime);
				var y1 = pointYScale(d.dest.xDis);
				return "M"+[x0,y0] + "L" + [x1,y1];
			})
		.style("pointer-events","none");

		selLinks.exit().remove();


		var sel = svg.selectAll("g.timeClusterNode")
			.data(data,function(d){
				return d.id;
			});

		var enter = sel.enter().append("g")
			.attr("class","timeClusterNode")
			enter.append("circle");

		sel.selectAll("circle")
			.data(data,function(d){
				return d.id;
			})
		.attr("r",3)
			.style("fill",function(d){
				return fillColor(d.clusterInfo.index);
			})
		.style("stroke","none")
			.transition()
			.attr("cx",function(d){
				return xScale(d.dateTime);
			})
		.attr("cy",function(d){
			return pointYScale(d.xDis);
		});
		sel.exit().remove();


	}
}


var PeriodicTimeBrush = function(svgGroup,pos,xScale,period,className){
	this.svgGroup = svgGroup;
	this.className = className;
	//	this.brushSel = svgGroup.append("g").attr("class","mBrush");
	this.xScale = xScale;
	this.pos = pos;
	this.brushLock = false;
	this.period = period;
	this.init();
	//	this.setMultipleBrush();
	//this.setBrush();

}

PeriodicTimeBrush.prototype = {
	init:function(){
		var svgGroup = this.svgGroup;		
		var xDomain = this.xScale.domain();
		var myScale = this.xScale;
		var startTime = xDomain[0];
		var endTime = xDomain[1]
			var period = this.period;
		//		var offset = 420*60*1000;
		//		var offset = 0;
		var offset = new Date().getTimezoneOffset()/60 *3600*1000;
		if(period!=86400000){
			offset = new Date().getTimezoneOffset()/60*3600*1000 + 24*3600*1000*3;
		}
		//	var startEndTime = new Date(startTime.getTime()%period + startTime.getTime() - offset);
		var startEndTime = new Date((period)*(Math.ceil((startTime.getTime()-offset)/period)) + offset);	
		//var startEndTime = startTime
		var currentTime = startEndTime;

		var periodArray = [];
		var xRange = this.xScale.range();

		var periodNum = endTime.getDay()-startTime.getDay();
		//var periodRange = (xRange[1]-xRange[0])/
		//var periodNum = (endTime.getTime()-startTime.getTime())/period;
		//var periodRange = (xRange[1]-xRange[0])/periodNum;

		var stRatio = (startEndTime.getTime()-startTime.getTime())/period;
		//var stRange = stRatio*periodRange;

		var currentScale = d3.time.scale().domain([startTime,startEndTime])
			//.range([xRange[0],stRange]);
			.range([myScale(startTime),myScale(startEndTime)]);

		periodArray.push(currentScale);
		var tEndTime = t;
		//var currentSTRange = stRange;
		for(var t=currentTime;t<endTime;t=tEndTime){
			tEndTime = new Date(t.getTime()+period);
			var cScale = d3.time.scale().domain([t,tEndTime])
				.range([myScale(t),myScale(tEndTime)])
				//				.range([currentSTRange,currentSTRange+periodRange]);
				//currentSTRange +=periodRange;
				periodArray.push(cScale);
		}

		var lastScale = periodArray[periodArray.length-1];
		lastScale.domain([lastScale.domain()[0],endTime])
			.range([lastScale.range()[0],xRange[1]]);

		this.periodArray = periodArray;


	},
	setMultipleBrush:function(brushNum){
		var myBrush = this;
		var sel = this.brushSel;
		var svgGroup = this.svgGroup;

		svgGroup.selectAll("g.mBrush").remove();
		this.brushSel = [];
		var periodArray = this.periodArray;

		//		for(var i=0;i<periodArray.length;i++){
		for(var i=0;i<brushNum;i++){
			this.brushSel[i] = svgGroup.append("g").attr("class","mBrush")
				.attr("id","mBrush"+i);
		}

		var timeBrushs = [];
		for(var i=0;i<brushNum;i++){
			var timeBrush = d3.svg.brush()
				//				.x(periodArray[i])
				// .on("brushstart",brushStart)
				// .on("brush",brushMove)
				// .on("brushend",brushEnd);

				var height = this.pos.height;
			var sel = this.brushSel[i];

			sel.call(timeBrush)
				.selectAll("rect")
				.attr("height",height);

			timeBrushs.push(timeBrush);
		}
		this.timeBrushs = timeBrushs;

		var startTimeOffset;
		var endTimeOffset;

		// function brushStart(){
		// 	sel.classed("selecting",true);
		// 	var e = d3.event.target.extent();
		// 	oriStartTime = e[0];
		// 	oriEndTime = e[1];
		// 	//calculate
		// 	// this.brushLock = true;
		// 	// animationFlag = false;
		// }
		// function brushMove(){
		// 	var targetBrush = d3.event.target;
		// 	var e = d3.event.target.extent();
		// 	var targetDomain = targetBrush.x().domain();
		// 	startTimeOffset = e[0]-targetDomain[0];
		// 	endTimeOffset = e[1]-targetDomain[0];


		// 	for(var i=0;i<periodArray.length;i++){
		// 		var startTime = periodArray[i].domain()[0].getTime()+startTimeOffset;
		// 		var endTime = periodArray[i].domain()[0].getTime()+endTimeOffset;
		// 		if(endTime>periodArray[i].domain()[1]){
		// 			endTime = periodArray[i].domain()[1];
		// 		}
		// 		myBrush.updateBrush(myBrush.brushSel[i],myBrush.timeBrushs[i],periodArray[i],new Date(startTime),new Date(endTime));
		// 	}
		// 	//myBrush.updateBrushTimeStamps(e[0],e[1],false);
		// }
		// function brushEnd(){
		// 	var targetBrush = d3.event.target;
		// 	var e = d3.event.target.extent();
		// 	var targetDomain = targetBrush.x().domain();
		// 	startTimeOffset = e[0]-targetDomain[0];
		// 	endTimeOffset = e[1]-targetDomain[0];

		// 	if(e[1]-e[0]<1000){
		// 		svgGroup.selectAll("g.mBrush").remove();
		// 		myBrush.setMultipleBrush();
		// 		dataManager.filterStartEndTime(e,true);
		// 		return;
		// 	}

		// 	var testDomain = [];
		// 	var testRange = [];

		// 	var timeArrays = [];
		// 	for(var i=0;i<periodArray.length;i++){
		// 		var startTime = periodArray[i].domain()[0].getTime()+startTimeOffset;
		// 		var endTime = periodArray[i].domain()[0].getTime()+endTimeOffset;
		// 		if(endTime>periodArray[i].domain()[1]){
		// 			endTime = periodArray[i].domain()[1];
		// 		}
		// 		timeArrays.push([new Date(startTime),new Date(endTime)]);

		// 		testDomain = testDomain.concat(periodArray[i].domain()[0],new Date(startTime),new Date(endTime),periodArray[i].domain()[1]);
		// 		testRange = testRange.concat([0,1,1,0]);
		// 	}

		// 	var testScale = d3.scale.linear().domain(testDomain).range(testRange);

		// 	dataManager.filterMultipleStartEndTime(timeArrays,testScale);
		// 	// }
		// 	// for(var i=0;i<periodArray.length;i++){
		// 	// 	myBrush.brushSel[i].style("pointer-events", "all").selectAll(".resize").style("display", myBrush.brushSel[i].empty() ? "none" : null);

		// 	// }
		// 	//console.log(e);
		// 	// var stTime = e[0].getLumpyString();
		// 	// var edTime = e[1].getLumpyString();
		//  //          if(e[1].getTime()-e[0].getTime()<1000){
		//  //              selectionFlag = false;
		//  //              myBrush.updateBrushTimeStamps(stTime,edTime,true);
		//  //              console.log("no selection")
		//  //              return;
		//  //          }
		//  //          selectionFlag = true;
		//  //          if(directFetch){
		//  //          	incCalculate(globalStartTime,globalEndTime,e[0],e[1],globalData);
		//  //          }else{
		//  //          	multiStepFetchCheck(e[0],e[1],1000*60,60*1000);
		//  //          	//multiStepFetch(e[0],e[1],1000*60,60*1000)
		//  //          }
		// 	this.brushLock = false;            
		//           //updateConnection(stTime,edTime);
		// }		

	},
	updateBrushTimeStamps:function(brushSel,xScale,startTime,endTime,isDisappear){
		var myBrush = this;
		//		var sel = this.brushSel;
		var sel = brushSel;
		//		var xScale = this.xScale;
		var width = this.pos.width;
		//var stPos = this.xScale(startTime);
		//var edPos = this.xScale(endTime);
		//var width = edPos - stPos;
		if(!startTime || !endTime){
			return;
		}
		var textData = [startTime,endTime];
		var textSel = sel.selectAll("g.timeStamp")
			.data(textData,function(d){
				return d;
			});
		var enter = textSel.enter().append("g")
			.attr("class","timeStamp");

		if(isDisappear){
			textSel.remove();
			return;
		}

		enter.append("text");
		enter.append("path")
			textSel.selectAll("text")
			.data(textData,function(d){
				return d;
			})
		.text(function(d){
			return d.getFullTimeString();
		})
		.attr("x",function(d){
			return xScale(d);
		})
		.attr("y",this.pos.height+20)
			.attr("text-anchor",function(d,i){
				if(i==0){
					if(xScale(d)<width/17.0){
						return "start";
					}
					return "end";
				}else{
					if(xScale(d)>width*16.5/17.0){
						return "end";
					}
					return "start";
				}
			})
		.style("font-size","11px")

			textSel.selectAll("path")
			.data(textData,function(d){
				return d;
			})
		.attr("d",function(d){
			var x0 = xScale(d);
			var y0 = 0;
			var x1 = x0;
			var y1 = myBrush.pos.height+5;
			return "M"+x0+","+y0+"L"+x1+","+y1;
		})
		.style("stroke","rgba(255,255,255,0.5)");

		textSel.exit().remove();


	},
	updateBrush:function(sel,timeBrush,xScale,startTime,endTime){
		if(this.brushLock){
			return;
		}
		//        var sel = this.brushSel;
		var stPos = xScale(startTime);
		var edPos = xScale(endTime);
		var width = edPos-stPos;
		if(!startTime || !endTime || !width || width<0){
			return;
		}
		timeBrush.extent([startTime,endTime]);
		sel.selectAll("rect.extent")
			.attr("x",stPos)
			.attr("width",width);
		sel.selectAll("g.w")
			.attr("transform","translate("+stPos+",0)");
		sel.selectAll("g.e")
			.attr("transform","translate("+edPos+",0)");

		sel.classed("selecting",true);
		selectionFlag = true;

		this.updateBrushTimeStamps(sel,xScale,startTime,endTime,false);
		//this.updateBrushTimeStamps(startTime,endTime,false);
	},
	updateProgressiveBrush:function(startTime,endTime,isFinish){
		var sel = this.brushSel;
		var stPos = this.xScale(startTime);
		var newEdTime = endTime;
		if(this.lastProgressiveEndTime && endTime<this.lastProgressiveEndTime){
			newEdTime = this.lastProgressiveEndTime;
		}
		//var edPos = this.xScale(endTime);
		var edPos = this.xScale(newEdTime);
		var height = this.pos.height;
		var width = edPos-stPos;
		var proSel = sel.selectAll("rect.progressiveHint")
			.data([{stPos:stPos,edPos:edPos}],function(d){
				return d.stPos;
			});
		var enter = proSel.enter();
		enter.append("rect")
			.attr("class","progressiveHint")
			.attr("x",function(d){
				return d.stPos;
			})
		.attr("y",0)
			.attr("width",width)
			.attr("height",height)

			//proSel.selectAll("rect")	
			proSel.attr("x",function(d){
				return d.stPos;
			})
		.attr("y",0)
			.attr("width",width)
			.attr("height",height)
			.style("fill","rgba(255,255,255,0.1)")

			proSel.exit().remove();
		this.lastProgressiveEndTime = newEdTime;
		if(isFinish){
			this.lastProgressiveEndTime = null;;
			proSel.remove();
		}
	},
	enableBrush:function(){
		d3.select("g.brush").style("pointer-events","all");
		//d3.select(".icon-white").style("poniter-events","all");
	},
	disableBrush:function(){
		d3.select("g.brush").style("pointer-events","none");
		//d3.select(".icon-white").style("poniter-events","none");
	},
	updateByOutsider:function(startTimeOffset,endTimeOffset){
		//		startTimeOffset = e[0]-targetDomain[0];
		//		endTimeOffset = e[1]-targetDomain[0];

		//		var offset = 0;
		var offset = new Date().getTimezoneOffset()/60 *3600*1000;

		//		var offset = 420*60*1000;
		var periodArray = this.periodArray;
		var myBrush = this;
		var period = this.period;
		if(period!=86400000){
			offset = new Date().getTimezoneOffset()/60*3600*1000 + 24*3600*1000*3;
		}
		var timeArrays = [];

		for(var i=0;i<periodArray.length;i++){
			//var startTime = periodArray[i].domain()[0].getTime()+startTimeOffset + offset;
			// var startTime = periodArray[i].domain()[1].getTime() - period + startTimeOffset;
			// var endTime = periodArray[i].domain()[0].getTime()+endTimeOffset + offset;

			var stDomain = periodArray[i].domain()[0].getTime() - offset;
			var edDomain = periodArray[i].domain()[1].getTime() - offset;

			var startTime = (period)*(Math.floor(1.0*stDomain/period)) + offset + startTimeOffset;
			var endTime = (period)*(Math.floor(1.0*stDomain/period)) + offset + endTimeOffset;


			if(startTime<periodArray[i].domain()[0]){
				startTime = periodArray[i].domain()[0];
			}
			if(endTime<periodArray[i].domain()[0]){
				endTime = periodArray[i].domain()[0];
			}
			if(startTime>periodArray[i].domain()[1]){
				startTime = periodArray[i].domain()[1];
			}
			if(endTime>periodArray[i].domain()[1]){
				endTime = periodArray[i].domain()[1];
			}
			timeArrays.push([new Date(startTime),new Date(endTime)]);

		}
		var mergedArray = timeArrays;
		for(var index in timeViz.timeArrays){
			if(timeViz.timeArrays[index] && timeViz.timeArrays[index].length>0 && index!=myBrush.className){
				mergedArray = mergeSequence(timeArrays,timeViz.timeArrays[index]);
				break;
			}
		}
		var brushNum = mergedArray.length;
		this.setMultipleBrush(brushNum);

		for(var i=0;i<brushNum;i++){
			//			myBrush.updateBrush(myBrush.brushSel[i],myBrush.timeBrushs[i],periodArray[i],timeArrays[i][0],timeArrays[i][1]);
			myBrush.updateBrush(myBrush.brushSel[i],myBrush.timeBrushs[i],myBrush.xScale,mergedArray[i][0],mergedArray[i][1]);
		}
	},
	updateByOutsiderOther:function(timeArrays){
		var mergedArray = timeArrays;
		var brushNum = mergedArray.length;
		this.setMultipleBrush(brushNum);
		var myBrush = this;

		for(var i=0;i<brushNum;i++){
			//			myBrush.updateBrush(myBrush.brushSel[i],myBrush.timeBrushs[i],periodArray[i],timeArrays[i][0],timeArrays[i][1]);
			myBrush.updateBrush(myBrush.brushSel[i],myBrush.timeBrushs[i],myBrush.xScale,mergedArray[i][0],mergedArray[i][1]);
		}    	
	}
}



var TimeBrush = function(svgGroup,pos,xScale){
	this.svgGroup = svgGroup;
	svgGroup.select("g.brush").remove();
	this.brushSel = svgGroup.append("g").attr("class","brush");
	this.xScale = xScale;
	this.pos = pos;
	this.brushLock = false;
	this.setBrush();
}

TimeBrush.prototype = {
	setBrush:function(){
		var myBrush = this;
		var sel = this.brushSel;
		var timeBrush = d3.svg.brush()
			.x(this.xScale)
			.on("brushstart",brushStart)
			.on("brush",brushMove)
			.on("brushend",brushEnd);

		var height = this.pos.height;
		sel.call(timeBrush)
			.selectAll("rect")
			.attr("height",height);

		this.timeBrush = timeBrush;

		function brushStart(){
			sel.classed("selecting",true);
			this.brushLock = true;
			//animationFlag = false;
			myBrush.filteredStartEndTime = null;
		}
		function brushMove(){
			var e = d3.event.target.extent();
		}
		function brushEnd(){

			var e = d3.event.target.extent();
			//console.log(e);
			var stTime = e[0].getLumpyString();
			var edTime = e[1].getLumpyString();
			if(e[1].getTime()-e[0].getTime()<1000){
				selectionFlag = false;
				myBrush.updateBrushTimeStamps(stTime,edTime,true);
				console.log("no selection")
					dataManager.filterStartEndTime(e,true);
				return;
			}
			dataManager.filterStartEndTime(e);
			myBrush.updateBrushTimeStamps(e[0],e[1],false);

			myBrush.filteredStartEndTime = e;
			selectionFlag = true;
			/*
				 if(directFetch){
				 incCalculate(globalStartTime,globalEndTime,e[0],e[1],globalData);
				 }else{
				 multiStepFetchCheck(e[0],e[1],1000*60,60*1000);
			//multiStepFetch(e[0],e[1],1000*60,60*1000)
			}
			*/
			this.brushLock = false;            
			//updateConnection(stTime,edTime);
		}
		sel.selectAll("rect.extent").style("fill","rgba(255,255,255,0.5)")
	},
	updateBrushTimeStamps:function(startTime,endTime,isDisappear){
		var myBrush = this;
		var sel = this.brushSel;
		var xScale = this.xScale;
		var width = this.pos.width;
		//var stPos = this.xScale(startTime);
		//var edPos = this.xScale(endTime);
		//var width = edPos - stPos;
		if(!startTime || !endTime){
			return;
		}
		var textData = [startTime,endTime];
		var textSel = sel.selectAll("g.timeStamp")
			.data(textData,function(d){
				return d;
			});
		var enter = textSel.enter().append("g")
			.attr("class","timeStamp");

		if(isDisappear){
			sel.selectAll("g.timeStamp").remove()
				//why?
				//textSel.selectAll("text").remove();
				//textSel.selectAll("path").remove();
				return;
		}

		enter.append("text");
		enter.append("path")
			textSel.selectAll("text")
			.data(textData,function(d){
				return d;
			})
		.text(function(d){
			return d.getFullTimeString();
		})
		.attr("x",function(d){
			return xScale(d);
		})
		.attr("y",this.pos.height+25)
			.attr("text-anchor",function(d,i){
				if(i==0){
					if(xScale(d)<width/17.0){
						return "start";
					}
					return "end";
				}else{
					if(xScale(d)>width*16.5/17.0){
						return "end";
					}
					return "start";
				}
			})
		.style("font-size","11px")

			textSel.selectAll("path")
			.data(textData,function(d){
				return d;
			})
		.attr("d",function(d){
			var x0 = xScale(d);
			var y0 = 0;
			var x1 = x0;
			var y1 = myBrush.pos.height+5;
			return "M"+x0+","+y0+"L"+x1+","+y1;
		})
		.style("stroke","rgba(255,255,255,0.5)");

		textSel.exit().remove();


	},
	updateBrush:function(startTime,endTime){
		if(this.brushLock){
			return;
		}
		var sel = this.brushSel;
		var stPos = this.xScale(startTime);
		var edPos = this.xScale(endTime);
		var width = edPos-stPos;
		if(!startTime || !endTime || !width || width<0){
			return;
		}

		this.filteredStartEndTime = [startTime,endTime];        
		this.timeBrush.extent([startTime,endTime]);
		sel.selectAll("rect.extent")
			.attr("x",stPos)
			.attr("width",width);
		sel.selectAll("g.w")
			.attr("transform","translate("+stPos+",0)");
		sel.selectAll("g.e")
			.attr("transform","translate("+edPos+",0)");

		sel.classed("selecting",true);
		selectionFlag = true;
		this.updateBrushTimeStamps(startTime,endTime,false);
	},
	updateProgressiveBrush:function(startTime,endTime,isFinish){
		var sel = this.brushSel;
		var stPos = this.xScale(startTime);
		var newEdTime = endTime;
		if(this.lastProgressiveEndTime && endTime<this.lastProgressiveEndTime){
			newEdTime = this.lastProgressiveEndTime;
		}
		//var edPos = this.xScale(endTime);
		var edPos = this.xScale(newEdTime);
		var height = this.pos.height;
		var width = edPos-stPos;
		var proSel = sel.selectAll("rect.progressiveHint")
			.data([{stPos:stPos,edPos:edPos}],function(d){
				return d.stPos;
			});
		var enter = proSel.enter();
		enter.append("rect")
			.attr("class","progressiveHint")
			.attr("x",function(d){
				return d.stPos;
			})
		.attr("y",0)
			.attr("width",width)
			.attr("height",height)

			//proSel.selectAll("rect")	
			proSel.attr("x",function(d){
				return d.stPos;
			})
		.attr("y",0)
			.attr("width",width)
			.attr("height",height)
			.style("fill","rgba(255,255,255,0.1)")

			proSel.exit().remove();
		this.lastProgressiveEndTime = newEdTime;
		if(isFinish){
			this.lastProgressiveEndTime = null;;
			proSel.remove();
		}
	},
	enableBrush:function(){
		d3.select("g.brush").style("pointer-events","all");
		//d3.select(".icon-white").style("poniter-events","all");
	},
	disableBrush:function(){
		d3.select("g.brush").style("pointer-events","none");
		//d3.select(".icon-white").style("poniter-events","none");
	}
}

function mergeSequence(array1,array2){
	var mergedArray = [];
	var i=0;
	var j=0;
	while(i<array1.length){
		var val = array1[i];
		var stVal = val[0];
		var edVal = val[1];

		while(j<array2.length && array2[j][0]<edVal){
			var newArray;
			if(array2[j][1]<stVal){

			}else{
				newArray = [d3.max([stVal,array2[j][0]]),d3.min([edVal,array2[j][1]])]
					mergedArray.push(newArray);
				if(array2[j][1]>edVal){
					break;
				}
			}
			j++;

			// }else if(array2[j][0]<stVal && array2[j][1]>=stVal && array2[j][1]<edVal){
			// 	newArray = [stVal,array2[j][1]];
			// }else if(array2[j][0]<stVal && array2[j][1]>=stVal && array2[j][1]<edVal){
			// 	newArray = [stVal,edVal];
			// }else if(array2[j][0]>=stVal && array2[j][1]<edVal){
			// 	newArray = [array2[j][0],array2[j][1]];
			// }else if(array2[j][0]>=stVal && array2[j][1]>=edVal){
			// 	newArray = [array2[j][0],edVal];
			// }
	}
	i++;
}
return mergedArray;
}
