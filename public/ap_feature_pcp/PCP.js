(function(){
	window["PCP"]={};
	var tPCP;
	function PCP_createAxis(id, pos, extrema){
		var o={};

		o.name=id;
		o.pos=pos;
		o.brush;
		o.axisHeight=this.options.size[1]*0.8;
		o.hdlPos=this.options.size[1]*0.84;
		o.hdlRad=this.options.size[1]*0.02;
		o.txtPos=this.options.size[1]*0.90;
		o.extrema=extrema.slice(0);
		o.scale;

		return o;
	}

	function PCP_createInteract(){
		var o={};

		o.EnbHover=true;
		o.isSwap=true;
		o.swap;

		return o;
	}

	function PCP_createPCP(canvas, options, data){
		var o={};

		o.options=options;
		o.canvas=canvas;
		o.ord=[];
		o.axes={};
		o.data=data;
		o.colors=[];
		o.interact;
		o.redraw=false;

		//Private
		o.initInteract=PCP_InitInteract;
		o.createAxis=PCP_createAxis;
		o.getAxes=PCP_getAxes;
		o.parseData=PCP_parseData;
		o.renderAxes=PCP_renderAxes;
		o.renderData=PCP_renderData;
		o.getPath=PCP_getPath;
		o.getInfo=PCP_getInfo;

		//Public
		o.init=PCP_initPCP;
		o.clean=PCP_cleanPCP;
		o.setPos=PCP_setPos;
		o.setSize=PCP_setSize;
		o.setDataColor=PCP_setDataColor;
		o.setBrush=PCP_setBrush;
		o.getBrush=PCP_getBrush;

		return o;
	}

	function PCP_getAxes(){
		var d=this.data[0],
		l=0,
		tcount=0;
		for(var i in this.data[0]){
			l++;
		}
		for(var i in this.data[0]){
			this.ord.push(i);
			this.axes[i]=this.createAxis(i, this.options.size[0]*tcount/l, [parseFloat(d[i]),parseFloat(d[i])]);
			tcount++;
		}
	}

	function PCP_parseData(){
		var PCP_mdata=this.data;
		var PCP_tdata=[];
		var PCP_taxes=this.axes;
		var PCP_tInfo=this.getInfo;
		$.each(PCP_mdata, function(PCP_id, d){
			for(var i in d){
				var PCP_d=parseFloat(d[i]);
				if(PCP_d<PCP_taxes[i].extrema[0])
					PCP_taxes[i].extrema[0]=PCP_d;
				if(PCP_d>PCP_taxes[i].extrema[1])
					PCP_taxes[i].extrema[1]=PCP_d;
			}
		});
		$.each(this.axes, function(PCP_id, d){
			d.scale=d3.scale.linear().domain(d.extrema).range([d.axisHeight, 0]);
		});
		$.each(PCP_mdata, function(PCP_id, d){
			var PCP_titem={};
			for(var i in d){
				PCP_titem[i]=PCP_taxes[i].scale(d[i]);
			}
			PCP_titem.PCPInfo=PCP_tInfo(d, PCP_id);
			PCP_tdata.push(PCP_titem);
		});
		this.data=PCP_tdata;
	}

	function PCP_getPath(item){
		var PCP_taxes=this.axes
		var PCP_tpath="";
		$.each(this.ord, function(PCP_id, d){
			// console.log([d,item]);
			if(PCP_tpath==""){
				PCP_tpath+="M"+PCP_taxes[d].pos+","+item[d];
				return;
			}
			PCP_tpath+=" L"+PCP_taxes[d].pos+","+item[d];
		});
		return PCP_tpath;
	}

	function PCP_getInfo(item, id){
		var PCP_tInfo="No. "+id;
		for(var i in item){
			PCP_tInfo+="\n"+i+": "+item[i];
		}
		return PCP_tInfo;
	}

	function PCP_Brush(){
		var PCP_tActive=tPCP.ord.filter(function(d) { return !tPCP.axes[d].brush.empty(); }),
		PCP_tExtents=PCP_tActive.map(function(d) { return tPCP.axes[d].brush.extent(); });
		var PCP_tScale=PCP_tActive.map(function(d){ return tPCP.axes[d].scale.invert});
		d3.selectAll("PCP_fade")
		.classed("PCP_fade",false);
		d3.selectAll(".PCP_path")
		.classed("PCP_fade",function(d){
			var PCP_tHighLight=true;
			$.each(PCP_tActive,function(i,e){
				var td=PCP_tScale[i](d[e]);
				var te=PCP_tExtents[i];
				PCP_tHighLight=PCP_tHighLight && (td>=te[0] && td<=te[1]);
			});
			return !PCP_tHighLight;
		});
	}

	function PCP_InitInteract(){
		this.interact=PCP_createInteract();
	}

	function PCP_renderAxes(){
		var PCP_tCanvas=this.canvas;
		var PCP_tDrag=d3.behavior.drag()
		.on("dragstart",function(){tPCP.interact.EnbHover=false;})
		.on("drag", PCP_dragmove)
		.on("dragend",function(){tPCP.interact.EnbHover=true});
		$.each(this.axes,function(PCP_id, d){
			var PCP_tBrush=d3.svg.brush()
			.y(d.scale)
			.extent(d.scale.domain())
			.on("brushstart",function(){tPCP.interact.EnbHover=false;})
			.on("brush",PCP_Brush)
			.on("brushend",function(){tPCP.interact.EnbHover=true;});
			var PCP_axis=d3.svg.axis()
			.scale(d.scale)
			.orient("left")
			.tickValues(d.scale.domain());;
			var PCP_tg=PCP_tCanvas.append("g")
			.attr("transform","translate("+d.pos+",0)")
			.attr("class","PCP_axis")
			.attr("id","PCP_axis_"+d.name.replace(" ","_"));
			PCP_tg.append("text")
			.attr("x",-48)
			.attr("y",d.txtPos)
			.text(d.name);
			PCP_tg.append("circle")
			.attr("cx",0)
			.attr("cy",d.hdlPos)
			.attr("r",d.hdlRad)
			.attr("class","PCP_hdl")
			.attr("id","PCP_hdl_"+d.name.replace(" ","_"))
			.on("click",PCP_switch)
			.call(PCP_tDrag);
			PCP_tg.append("g")
			.attr("class","PCP_brush")
			.call(PCP_tBrush)
			.selectAll("rect")
			.attr("x",-8)
			.attr("width",16);
			PCP_tg.call(PCP_axis);
			d.brush=PCP_tBrush;
		});
}

function PCP_renderData(){
	var PCP_t=this, PCP_tColors=this.colors;
	this.canvas.selectAll(".PCP_path")
	.data(this.data)
	.enter()
	.append("path")
	.attr("d",function(d){
		return tPCP.getPath(d);
	})
	.attr("stroke",function(d,i){
		if(!PCP_tColors[i])
			PCP_tColors[i]="#000"
		return PCP_tColors[i];
	})
	.attr("class",function(d, i){
		return "PCP_path PCP_path_"+i;
	})
	.on("mouseover",function(){
		if(!tPCP.interact.EnbHover)
			return;
		d3.select(".PCP_hovered")
		.classed("PCP_hovered", false);
		d3.select(this)
		.classed("PCP_hovered", true);
	})
	.on("mouseout",function(){
		if(!tPCP.interact.EnbHover)
			return;
		d3.select(".PCP_hovered")
		.classed("PCP_hovered",false);
	})
	.append("title")
	.text(function(d){
		return d.PCPInfo;
	});
}

function PCP_dragmove(d){
	tPCP.interact.isSwap=false;
	tPCP.interact.swap =undefined;
	d3.selectAll(".PCP_chosen").classed("PCP_chosen",false);
	var PCP_tpos=d3.mouse(tPCP.canvas[0][0])[0];
	var PCP_ID=$(this).attr("id").replace("PCP_hdl_","").replace("_"," ");
	d3.select("#PCP_axis_"+PCP_ID.replace(" ","_"))
	.attr("transform","translate("+PCP_tpos+",0)");
	tPCP.axes[PCP_ID].pos=PCP_tpos;
	tPCP.canvas.selectAll("path.PCP_path")
	.attr("d",function(d){
		return tPCP.getPath(d);
	});
}

function PCP_switch(){
	if(!tPCP.interact.isSwap){
		tPCP.interact.isSwap=true;
		tPCP.interact.swap=undefined;
		return;
	}
	if(!tPCP.interact.swap){
		tPCP.interact.swap=$(this).attr("id").replace("PCP_hdl_","");
		d3.select(this)
		.classed("PCP_chosen",true);
		return;
	}
	else{
		var PCP_tName=$(this).attr("id").replace("PCP_hdl_","");
		d3.select(this)
		.classed("PCP_chosen",false);
		if(tPCP.interact.swap==PCP_tName){
			tPCP.interact.swap=undefined;
			return;
		}
		d3.select("#PCP_hdl_"+tPCP.interact.swap)
		.classed("PCP_chosen",false);
		var PCP_ax1=PCP_tName.replace("_"," "),
		PCP_ax2=tPCP.interact.swap.replace("_"," ");
		var PCP_tID1=tPCP.ord.indexOf(PCP_ax1),
		PCP_tID2=tPCP.ord.indexOf(PCP_ax2),
		PCP_tpos1=tPCP.axes[PCP_ax1].pos,
		PCP_tpos2=tPCP.axes[PCP_ax2].pos;
		tPCP.axes[PCP_ax1].pos=PCP_tpos2;
		tPCP.axes[PCP_ax2].pos=PCP_tpos1;
		tPCP.ord[PCP_tID1]=PCP_ax2;
		tPCP.ord[PCP_tID2]=PCP_ax1;
		$("#PCP_axis_"+tPCP.interact.swap)
		.attr("transform","translate("+PCP_tpos1+",0)");
		$("#PCP_axis_"+PCP_tName)
		.attr("transform","translate("+PCP_tpos2+",0)");
		tPCP.canvas.selectAll("path.PCP_path")
		.attr("d",function(d){
			return tPCP.getPath(d);
		});
		tPCP.interact.swap=undefined;
	}
}

function PCP_setPos(tPos){
	var PCP_tCanvas=d3.selectAll(".PCP_Canvas");
	if(!PCP_tCanvas.empty())
		PCP_tCanvas.attr("transform","translate("+tPos+")");
	return !PCP_tCanvas.empty();
}

function PCP_setSize(tSize){
	redraw=true;
	return false;
}

function PCP_setDataColor(tColors){
	if(tColors.length != tPCP.data.length){
		alert("PCP.js: Illegal Color Setting!");
		return false;
	}
	this.colors=tColors;
	var PCP_tPaths=d3.selectAll(".PCP_path");
	if(!PCP_tPaths.empty()){
		PCP_tPaths.attr("stroke",function(d,i){
			return tColors[i];
		});
	}
	return true;
}

function PCP_setBrush(tSelection){
	d3.selectAll(".PCP_fade")
	.classed("PCP_fade",false);
	var PCP_tPaths=d3.selectAll(".PCP_path");
	if(!PCP_tPaths.empty()){
		var PCP_tSelection=d3.set(tSelection);
		PCP_tPaths.classed("PCP_fade",function(d,i){
			return !PCP_tSelection.has(i);
		});
	}
	return !PCP_tPaths.empty();
}

function PCP_getBrush(){
	var PCP_tPaths=d3.selectAll(".PCP_path"),
	PCP_tFade=d3.set(), PCP_tBrushed=[];
	if(!PCP_tPaths.empty())
		d3.selectAll(".PCP_fade")
	.classed("PCP_NULL",function(d,i){
		PCP_tFade.add(i);
		return false;
	});
	for(var i=0; i < this.data.length; i++){
		if(!PCP_tFade.has(i))
			PCP_tBrushed.push(i);
	}
	return PCP_tBrushed;
}

function PCP_initPCP(){
	this.getAxes();
	this.parseData();
	this.initInteract();
	this.renderData();
	this.renderAxes();
}

function PCP_cleanPCP(){
	d3.select(".PCP_Canvas")
	.remove();
}

function initPCP(canvas, options, data){
	var PCP_canvas=canvas.append("g")
	.attr("class","PCP_Canvas")
	.attr("transform","translate("+options.pos+")");
	tPCP=PCP_createPCP(PCP_canvas, options, data);
	tPCP.init();
	return tPCP;
}

window["PCP"]["init"]=initPCP;
})();