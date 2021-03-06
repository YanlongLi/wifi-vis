WifiVis.DeviceView = function(selectedDevices){
  function DeviceView(){}

  var apNameMappings = {};
  var apFloorMappings = {};
  var apNumMappings = {};
  var nameAPMappings = {};
  var apConnCnt = {};
  var floorAP = {};
  var floorDomain = {};
  var dataset = [];
  var apNum = 0;
  var clicked = {};
  var floorCollapsed = {};
  var deviceList;
  var loginRecords;


  var checkInIntervalString = "2013-09-02 00:00:30";
  var checkInInterval;



  // var margin = {top: 50, right: 20, bottom: 30, left: 100},
  //   width = 1100 - margin.left - margin.right,
  //   height = 500 - margin.top - margin.bottom;

  var size, timelineSize;
  var svg = utils.initSVG("#device-view-svg", [10]);
  var leftSvg = utils.initSVG("#device-view-left-svg", [10, 0]);
  var listSvg = utils.initSVG("#device-view-list-svg", [10, 0]);
  //var svg = $("#device-view-svg");
  var g = d3.select("#device-view-g");
  var zoom = d3.behavior.zoom().scaleExtent([1, 10]).on("zoom", zoomed);


  var gXAxis = d3.select("#device-view-x-axis-g");
  var gYAxis = d3.select("#device-view-y-axis-g");
  //var gXAxis = g.append("g").attr("class", "timeline");
  var gRect = g.append("g").attr("class", "rects"), gDot = g.append("g").attr("class", "dots"),
      gLine = g.append("g").attr("class", "lines"), gTag = g.append("g").attr("class", "tags"),
      gSeg = g.append("g").attr("class", "logins"),
      gFloor = d3.select("#device-view-left-svg").append("g").attr("class", "floors"),
      gDevice = d3.select("#device-view-list-svg").append("g").attr("class", "devices");
  //var gBar = g.se("device-view-bar"), gDot = $("device-view-dot");
  //var svg = d3.select("#device-view-svg");
  //   .attr("width", width + margin.left + margin.right)
  //   .attr("height", height + margin.top + margin.bottom)
  // .append("g")
  //   .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var parseDate = d3.time.format("%H:%M").parse;
  var xformatDate = d3.time.format("%H:%M");
  var FloorAPformatDate = d3.time.format("%x");
  var parseTime = d3.time.format("%y-%m-%d %H:%M:%S");

  var x = d3.time.scale()
            .domain([timeFrom, timeTo]);
      //x.domain([new Date('2013-09-02'), new Date('2013-09-03')]);
   // x.domain([new Date(2013, 08, 02, 00, 00, 00, 00), new Date(2013, 08, 03, 00, 00, 00, 00)]);

            //.range([0, width]);
            
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
          .ticks(4);
      // .tickFormat(function(d) {
      //   return xformatDate(new Date(d - 8*60*60*1000))
      // })

        // var y = d3.scale.ordinal()
  //     // .range([0, height])
  //     .rangeBands([0, height], .1);

  var yFloor = d3.scale.ordinal();
      //.rangeBands([0, height], .1);

  var yScale = d3.scale.linear();
  var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left");
  
      

  initSvg();
  initInteraction();

  function zoomed() {
    var zoomX = zoom.translate()[0], zoomY = zoom.translate()[1];
    // gDot.attr("transform", "translate(" + zoom.translate()) + ")scale(" + zoom.scale() + ")");
    // gDot.selectAll(".deviceAPDot")
    //     .attr("r", 2 / Math.sqrt(zoom.scale()));
    // gRect.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");
    // gLine.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");

    gDot.attr("transform", "translate(" + (40 + zoomX) + "," + zoomY + ")scale(" + zoom.scale() + ")");
    gDot.selectAll(".deviceAPDot")
        .attr("r", 2 / Math.sqrt(zoom.scale()));
    gRect.attr("transform", "translate(" + (40 + zoomX) + "," + zoomY + ")scale(" + zoom.scale() + ")");
    gLine.attr("transform", "translate(" + (40 + zoomX) + "," + zoomY + ")scale(" + zoom.scale() + ")");
    gLine.selectAll("deviceVerticalLine")
        .style("stroke-width", (1 / zoom.scale() / zoom.scale()) + "px");
    gTag.attr("transform", "translate(0," + zoomY + ")scale(" + zoom.scale() + ")");
    gTag.selectAll(".apTag.line")
      .style("stroke-width", (1 / zoom.scale()) + "px");
    gTag.selectAll(".apTag.text")
      .style("font-size", (0.6 / zoom.scale()) + "em");
    gSeg.attr("transform", "translate(" + (40 + zoomX) + "," + zoomY + ")scale(" + zoom.scale() + ")");
    gSeg.selectAll(".deviceLogin")
      .style("stroke-width", (1 / zoom.scale()) + "px");
    gFloor.attr("transform", "translate(0," + zoomY + ")scale(" + zoom.scale() + ")");
    //gFloor.attr("transform", "translate(0," + zoom.translate()[1]+ ")scale(1," + zoom.scale() + ")");
    gFloor.selectAll(".floorBtn")
        .attr("cx", 8 / zoom.scale())
        .attr("r", 4 / zoom.scale());

    //gYAxis.call(yAxis);
    gXAxis.call(xAxis);
    //gYAxis.call(yAxis.scale(yScale.range([zoom.translate()[1] + (size.height * zoom.scale()), zoom.translate()[1]])));
    //gXAxis.call(xAxis.scale(x.range([zoom.translate()[0], zoom.translate()[0] + (size.width * zoom.scale())])));
    return;
    // gDot.attr("transform", "translate(" + d3.event.translate[0]+"," + 
    //   d3.event.translate[1] 
    //   //0
    //   + ")scale(" + d3.event.scale + "," +
    //   d3.event.scale 
    //   //1
    //   + ")");
    // gRect.attr("transform", "translate(" + d3.event.translate[0]+"," +
    //   d3.event.translate[1] 
    //   //0
    //   + ")scale(" + d3.event.scale + "," +
    //   d3.event.scale 
    //   //1
    //   + ")");
    // gLine.attr("transform", "translate(" + d3.event.translate[0]+"," + 
    //   d3.event.translate[1] 
    //   //0
    //   + ")scale(" + d3.event.scale + "," +
    //   d3.event.scale 
    //   //1
    //   + ")");
    // // gXAxis.attr("transform", "translate(" + (d3.event.translate[0]) +"," + 
    // //   //(d3.event.translate[1] + (size.height+5) * d3.event.scale)
    // //   (size.height+5) 
    // //   + ")scale(" + d3.event.scale + "," + 
    // //   d3.event.scale 
    // //   //1
    // //   + ")");
    // gXAxis.call(xAxis.scale(x.range([d3.event.translate[0], d3.event.translate[0] + (size.width * d3.event.scale)])));
  }


  // var zoom = d3.behavior.zoom()
  //   .x(x)
  //   .y(yFloor)
  //   .scaleExtent([1, 10])
  //   .on("zoom", zoomed);



  function initSvg(){
    //var _w = svg.width(), _h = svg.height()-5;
    var _w = svg.w, _h = svg.h - 5;

    size = utils.initG(g, _w-15, _h, [0,5,20,0]);
    //timelineSize = utils.initG(gXAxis, _w-40, 20, [0,0,0,0]);
    x.domain([timeFrom, timeTo]).range([0, size.width]);
    yScale.range([size.height, 0]);
    yFloor.rangeBands([size.height, 0], .1);
    gXAxis
      .attr("class", "x axis")
      .attr("transform", "translate(40," + (size.height+5) + ")")
      //.attr("transform", "translate(40," + 0 + ")")
      .call(xAxis);

     // gYAxis
     //  .attr("class", "y axis")
     //  .attr("transform", "translate(0,0)")
     //  //.attr("transform", "translate(40," + 0 + ")")
     //  .call(yAxis);

   
    //g.call(d3.behavior.zoom().scaleExtent([1, 10]).on("zoom", zoomed));
    zoom = d3.behavior.zoom()
            .center([0, 0])
            .scaleExtent([1, 10])
            .x(x)
            //.y(yScale)
            .on("zoom", zoomed);
    d3.select("#device-view-svg").call(zoom).call(zoom.event);
    d3.select("#device-view-left-svg").call(zoom).call(zoom.event);

    gDot.attr("transform", "translate(40,0)scale(1,1)");
    gRect.attr("transform", "translate(40,0)scale(1,1)");
    gLine.attr("transform", "translate(40,0)scale(1,1)");
    gSeg.attr("transform", "translate(40,0)scale(1,1)");
    gTag.attr("transform", "translate(0,0)scale(1,1)");
    //gXAxis.attr("transform",  "translate(0,0)scale(1,1)");

    d3.select("#device-view-reset-btn").on("click", reset);
    d3.select("#device-view-zoom-in-btn").on("click", zoomIn);
    d3.select("#device-view-zoom-out-btn").on("click", zoomOut);
    //console.log(size);
  }

  function reset() {
    initSvg();
    initYScale();
    render(1);
    // d3.transition().duration(750).tween("zoom", function() {
    //   var ix = d3.interpolate(x.domain(), [-size.width / 2, size.width / 2]),
    //       iy = d3.interpolate(yScale.domain(), [-size.height / 2, size.height / 2]);
    //   return function(t) {
    //     zoom.x(x.domain(ix(t))).y(yScale.domain(iy(t)));
    //     zoomed();
    //   };
    // });
  }

  function zoom_by(factor){
    var scale = zoom.scale(),
        extent = zoom.scaleExtent(),
        translate = zoom.translate(),
        tempX = translate[0], tempY = translate[1],
        target_scale = scale * factor
        //center = [svg.w / 2, svg.h / 2];
        center = [0, 0];

    // If we're already at an extent, done
    if (target_scale === extent[0] || target_scale === extent[1]) { return false; }
    // If the factor is too much, scale it down to reach the extent exactly
    var clamped_target_scale = Math.max(extent[0], Math.min(extent[1], target_scale));
    if (clamped_target_scale != target_scale){
        target_scale = clamped_target_scale;
        factor = target_scale / scale;
    }

    // Center each vector, stretch, then put back
    tempX = (tempX - center[0]) * factor + center[0];
    tempY = (tempY - center[1]) * factor + center[1];

    // Enact the zoom immediately
    zoom.scale(target_scale)
        .translate([tempX, tempY]);
    zoomed();
  }

  function zoomOut() {
    zoom_by(1/1.1);
  }

  function zoomIn() {
    zoom_by(1.1);
  }

  function initInteraction(){

  }

  function initYScale() {
    var yHeight = size.height;
    if (Object.keys(floorDomain).length * 7 > yHeight) {
      yHeight = Object.keys(floorDomain).length * 7;
    }
    yScale.domain([0, Object.keys(floorDomain).length]);


  
    yFloor.rangeBands([yHeight, 0], .1);
    yScale.range([yHeight, 0]);
    //gYAxis.call(yAxis);

    
    for (var floor in floorAP) {
      yFloorAP[floor] = d3.scale.ordinal()
                          //.rangeBands([0, height * Object.keys(floorAP[floor]).length / Object.keys(floorDomain).length], .1);
                          .rangeBands([0, yHeight * Object.keys(floorAP[floor]).length / Object.keys(floorDomain).length], .1);
      yFloorAP[floor].domain(Object.keys(floorAP[floor]));
    }
  }

  $(window).resize(function(e){
    svg = utils.resizeSVG(svg);
    initSvg();
    initYScale();
    // var deviceList = ["3990015a90", "603ccf71d3", "8379e95b56", "b3366559ca", "b0f34cb2ff",
    //                   "ed1bd9acf3", "8e8e9157ca", "d56cd93ff1", "cab06cd66c", "2f3d995c92"];
    // DeviceView.update(deviceList)
    render(0);
  });

  DeviceView.draw = function(){

    // var deviceList = ["80fdf8a380", "c60f2a7698", "23b8ce3ca8", "15e6b82888", "83c7a45337", 
    //                   "7fadbfffa4", "3f6205cf9c", "1e5adefd95", "df6990d1d6", "dacccbc087"];
    

    deviceList = ["3990015a90", "603ccf71d3", "8379e95b56", "b3366559ca"];
    this.update();
  }

  function get_access_data(mac, dates){
    var access_data = [];
    var len = dates.length;
    for(var i = 0; i < len; i++){
      var date = dates[i]
      var next_date = new Date(date).setDate(date.getDate() +1);
      var path = db.path_by_mac(mac, date, next_date);
      path.forEach(function(d) {
        if (!(d.apid in apFloorMappings)) {
          apNameMappings[d.apid] = d.ap.name;
        }
      });
      path = path.map(function(r,i){
        if(i == 0 || r.apid != path[i-1].apid) return r;
        return null;
      }).filter(function(d){return d!=null})
      var eachpath = path.map(function(r,i){
        if(i == 0) return null;
        var o1 = {date_time: r.date_time, apid:path[i-1].apid};
        var o2 = {date_time: path[i-1].date_time, apid:path[i-1].apid};
        return [o2, o1];
      });
      eachpath.shift();
      access_data.push({lines:eachpath, line:path});
    }
    return access_data;
  }

  ObserverManager.addListener(DeviceView);
  DeviceView.OMListen = function(message, data){
    console.log(data);
    if(message == WFV.Message.DeviceSelect){
      if (!data.isAdd) return;
      console.log(data.device);
      deviceList = data.device;
      DeviceView.update();
    }
  }

  function y(apid) {
    var floor = apFloorMappings[apid];

    //var floorOffset = yFloor(floor);
    //var apOffset = yFloorAP[floor](apid);
    if (floorCollapsed[floor] === true) {
      // console.log(yFloor.domain());
      // console.log(floor);
      return yFloor(floor + "apall") + yFloor.rangeBand();
    }
    //return height - (floorOffset + apOffset); 
    //return size.height - (floorOffset + apOffset); 
    //return (floorOffset + apOffset); 
    return yFloor(apNameMappings[apid]) + yFloor.rangeBand();
    //return yScale(apNumMappings[apid]);
  }

  function setY() {
    var yDomain = [];
    console.log(floorCollapsed);
     for (var floor in floorCollapsed) {
      if (floorCollapsed[floor] === false) {
        if ((floor + "apall") in floorDomain) {
          delete floorDomain[floor + "apall"];
        }
      }
    }
    for (var apName in floorDomain) {
      var floor = apFloorMappings[nameAPMappings[apName]];
      if (apName.length < 4) floor = apName;
      if (floorCollapsed[floor] === true) {
        if (floor === apName) {
          yDomain.push(apName);
          yDomain.push(apName + "apall");
          apFloorMappings[apName + "apall"] = floor;
        }
      }
      else {
        yDomain.push(apName);
      }
    }

    console.log(floorDomain);
    console.log(yDomain);

    for (var floor in floorCollapsed) {
      if (floorCollapsed[floor] === true)
        floorDomain[floor + "apall"] = floor + "apall";
    }

    //yFloor.domain(yDomain.sort(sortAPName));
    var yHeight = size.height;
    if (yDomain.length * 7 > yHeight) {
      yHeight = yDomain.length * 7;
    }

    yFloor.domain(yDomain.sort(sortAPName))
          .rangeBands([yHeight, 0], .1);
  }

  function sortAPName(ap1, ap2) {
    var tempArray1 = ap1.split("ap"), tempArray2 = ap2.split("ap");
    var floor1 = +tempArray1[0].substring(1), floor2 = +tempArray2[0].substring(1);
    if (floor1 === floor2) {
      if (tempArray1.length !== tempArray2.length) {
       if (tempArray1.length < tempArray2.length) return -1;
        else return 1;
      }  
      else {
        if (tempArray1[1] === "all") return -1;
        if (tempArray2[1] === "all") return 1;
        return (+tempArray1[1]) - (+tempArray2[1]);
      }
    }
    else {
      return floor1 - floor2;
    }
  }

  //DeviceView.update = function(deviceList){
  DeviceView.update = function(){
    var access_data = [];
    loginRecords = [];
    floorCollapsed = {};
    apNameMappings = {}, apFloorMappings = {};
    for (var k = 0; k < deviceList.length; k++) {
      access_data.push(get_access_data(deviceList[k], [timeFrom]));
      clicked[deviceList[k]] = false;
    }
    access_data.forEach(function(d) {
      d[0].line.forEach(function(p){
        loginRecords.push(p);
      });
    });
    access_data = access_data.filter(function(d) {
      return d[0].lines.length > 0;
    })

    floorAP = {};
    yFloorAP = [], nameAPMappings = {};
    for (var ap in apNameMappings) {
      nameAPMappings[apNameMappings[ap]] = ap;
      if (ap in apFloorMappings) continue;
      var tempArray = apNameMappings[ap].split("ap");
      apFloorMappings[ap] = tempArray[0];
      if (tempArray[0] in floorAP) {
        floorAP[tempArray[0]][ap] = apNameMappings[ap];
      }
      else {
        floorAP[tempArray[0]] = {};
        floorCollapsed[tempArray[0]] = false;
        nameAPMappings[tempArray[0]] = tempArray[0];
        nameAPMappings[tempArray[0] + "apall"] = tempArray[0] + "apall";
        floorAP[tempArray[0]][ap] = apNameMappings[ap]; 
      }
    }
    console.log(apFloorMappings);
    console.log(floorAP);

    // svg.append("g")
    //   .attr("class", "x axis")
    //   .attr("transform", "translate(0," + height + ")")
    //   .call(xAxis);


    checkInInterval = x(parseTime.parse(checkInIntervalString)) - x(timeFrom);
    dataset = [];
    var cnt = 0;
    var dataDeviceMappings = {};

    for (var device = 0; device < access_data.length; device ++) {
    //for (var device = 2; device < 4; device ++) {
      tempDataset = access_data[device][0].lines;
      for (var i = 0; i< tempDataset.length; i++)
          tempDataset[i]["device"] = deviceList[device];
      dataset.push(tempDataset[0]);
      dataDeviceMappings[cnt++] = device;
      for (var i = 1; i < tempDataset.length; i++) {
        var cur = tempDataset[i];
        //if (x(dataset[cnt][1].date_time) - x(cur[0].date_time) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
        if (x(dataset[cnt-1][1].date_time) - x(cur[0].date_time) > 0.0 || cur[0].apid !== dataset[cnt-1][1].apid ||
            x(cur.start.date_time) - x(dataset[cnt-1].end.date_time) > checkInInterval) {
          dataset.push(cur);
          dataDeviceMappings[cnt++] = device;
        }
        else {
          dataset[cnt-1][1] = cur[1];
        }
      }
    }

    console.log(dataset);
    
    apConnCnt = {};
    dataset.forEach(function(d, i) {
      if (!(d[0].apid in apConnCnt)) {
          apConnCnt[apNameMappings[d[0].apid]] = 1;
      }
      else {
         apConnCnt[apNameMappings[d[0].apid]] ++; 
      }
    });

    floorDomain = {};
    apNum = 0;
    apNumMappings = {};
    for (var ap in apNameMappings) {
      floorDomain[apNameMappings[ap]] = ap;
    }
    
    console.log(apNumMappings);

    for (var floor in floorAP) {
      floorDomain[floor] = floor;
      apFloorMappings[floor] = floor;
    }
    
    yFloor.domain(Object.keys(floorDomain)
        .filter(function(d) {
          return (!(d in apConnCnt)) || (apConnCnt[d] > 0);
        })
        .sort(sortAPName));
    console.log(floorDomain);
    console.log(yFloor.domain());


    var yHeight = size.height;
    if (Object.keys(floorDomain).length * 7 > yHeight) {
      yHeight = Object.keys(floorDomain).length * 7;
    }

    for (var ap in floorDomain) {
      apNumMappings[ap] = apNum++;
    }
  
    yScale.domain([0, Object.keys(floorDomain).length]);
    yScale.range([yHeight, 0]);
    //gYAxis.call(yAxis);
    yFloor.rangeBands([yHeight, 0], .1);

    for (var floor in floorAP) {
      yFloorAP[floor] = d3.scale.ordinal()
                          //.rangeBands([0, height * Object.keys(floorAP[floor]).length / Object.keys(floorDomain).length], .1);
                          .rangeBands([0, yHeight * Object.keys(floorAP[floor]).length / Object.keys(floorDomain).length], .1);
      yFloorAP[floor].domain(Object.keys(floorAP[floor]));
    }
    console.log(floorAP);
    console.log(yFloorAP);

    render(1);
  }

  function highlightTrace(mac) {
    gRect.selectAll(".mac" + mac)
      .style("fill-opacity", 1);
    gDot.selectAll(".mac" + mac)
      .style("fill-opacity", 1);
    gLine.selectAll(".mac" + mac)
      .style("stroke-opacity", 1);
  }
  function dehighlightTrace(mac) {
    gRect.selectAll(".mac" + mac)
      .style("fill-opacity", 0.3);
    gDot.selectAll(".mac" + mac)
      .style("fill-opacity", 0.3);
    gLine.selectAll(".mac" + mac)
      .style("stroke-opacity", 0.1);
  }

  function render(needRemove) {
    if (needRemove === 1) {
      gTag.selectAll(".apTag").remove();
      gRect.selectAll(".deviceAPRect").remove();
      gDot.selectAll(".deviceAPDot").remove();
      gLine.selectAll(".deviceVerticalLine").remove();
      gSeg.selectAll(".deviceLogin").remove();
      gFloor.selectAll(".floorBtn").remove();
      gDevice.selectAll(".deviceList").remove();
      d3.select("#device-view-wrapper").selectAll(".remove").remove();

      d3.select("#device-view-svg").call(zoom).call(zoom.event);
      d3.select("#device-view-left-svg").call(zoom).call(zoom.event);


      console.log(yFloor.domain());
      console.log(floorDomain);
      console.log(apFloorMappings);

      var tooltip = d3.select("#device-view-wrapper")
          .append("div")
          .attr("class", "remove")
          .style("position", "absolute")
          .style("z-index", "20")
          .style("visibility", "hidden")
          .style("top", "10px")
          .style("left", "100px");

      var vertical = d3.select("#device-view-wrapper")
          .append("div")
          .attr("class", "remove dragbox-content")
          .style("position", "absolute")
          .style("z-index", "19")
          .style("width", "1px")
          .style("height", svg.h)
          .style("top", "30px")
          .style("bottom", "0px")
          .style("left", "0px")
          .style("background", "#000");

      d3.select("#device-view-wrapper")
        .on("mousemove", function(){  
          mousex = d3.mouse(this);
          mousex = mousex[0] + 2;
          if (mousex < 58) mousex = leftSvg.w + 58;
          if (mousex > svg.w + 40) mousex = svg.w + 40;
          vertical.style("left", mousex + "px" );
          var timePoint = x.invert(mousex - 60);
          tooltip.html( "<p>" + d3.time.format("%c")(timePoint) + "</p>" ).style("visibility", "visible");
        })
        .on("mouseover", function(){  
          mousex = d3.mouse(this);
          mousex = mousex[0] + 2;
          if (mousex < 58) mousex = 58;
          if (mousex > svg.w + 40) mousex = svg.w + 40;
          vertical.style("left", mousex + "px")}
        );
      
      var gTags = gTag.selectAll(".apTag")
        .data(yFloor.domain().filter(function(d) {
          return d.length > 4;
          //return true;
        }))
        .enter()
        .append("g");
      // gTags
      //   .append("rect")
      //   .attr("class", "apTag rect")
      //   .attr("x", 0)
      //   .attr("y", function(d){
      //     return y(floorDomain[d]) - yFloor.rangeBand()/2.0 - 2.5;
      //   })
      //   .attr("width", size.width)
      //   .attr("height", 5)
      //   .style("fill", "grey")
      //   .style("opacity", 0.0);
      gTags
        .append("line")
        .attr("class", "apTag line")
        .attr("transform", "translate(0,0)scale(1,1)")
        .attr("x1", function(d) {
            return 0;
        })
        .attr("x2", function(d) {
          return size.width + 40;
        })
        .attr("y1", function(d) {
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        })
        .attr("y2", function(d) {
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        })
        .style("stroke", function(d) {
          if (d.indexOf("all") > 0) {
            return ColorScheme.floor(+apFloorMappings[d].substring(1));  
          }
          var floor = +apFloorMappings[nameAPMappings[d]].substring(1);
          return ColorScheme.floor(floor);
        });
      gTags
        .append("text")
        .attr("class", function(d) {
          var classStr =  "apTag text";
          if (d.indexOf("all") > 0)
            if (floorCollapsed[apFloorMappings[d]]) classStr += " collapsed";
          return classStr;
        })
        .attr("x", 0)
        .attr("y", function(d){
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        })
        .style("font-size", "0.6em")
        .style("fill", function(d) {
          if (d.indexOf("all") > 0) {
            return ColorScheme.floor(+apFloorMappings[d].substring(1));  
          }
          var floor = +apFloorMappings[nameAPMappings[d]].substring(1);
          return ColorScheme.floor(floor);
        })
        .text(function(d) {
          return d;
        });

      gRect.selectAll(".deviceAPRect")
        .data(dataset)
        .enter().append("rect")
        //.attr("class", "rect")
        .attr("class", function(d) {
          return "deviceAPRect mac" + d["device"];
        })
        // .attr("fill", function(d) {
        //   var floor = +apFloorMappings[d[0].apid].substring(1);
        //   return ColorScheme.floor(floor);
        // })
        .attr("x", function(d){
            return x(d[0].date_time);
          })
        .attr("y", function(d){
          return y(d[0].apid) - yFloor.rangeBand()/2.0 - 2.5;
        })
        .attr("width", function(d){
          return x(d[1].date_time) - x(d[0].date_time);
        })
        .attr("height", 5)
        .on("click", function(d, i) {
          if (clicked[d["device"]]) {
            clicked[d["device"]] = false;
            dehighlightTrace(d["device"]);
          }
          else {
            clicked[d["device"]] = true;
            highlightTrace(d["device"]);
          }
        })
        .on("mouseover", function(d, i) {
          // var mouse = [d3.event.clientX, d3.event.clientY];
          // var timePoint = x.invert(d3.mouse(this)[0]);
          // console.log(timePoint);
          // var list = "";
          // var deviceList = [];
          // dataset.forEach(function(p, j){
          //   if (timePoint >= p[0].date_time && timePoint <= p[1].date_time) {
          //     console.log(p);
          //     list += p["device"] + " ";
          //     deviceList.push(p["device"]);
          //   }
          // });
          // console.log(gRect.selectAll(".mac" + d["device"]));
          // gRect.selectAll(".mac" + d["device"])
          //   .style("fill-opacity", 1);
          // gDot.selectAll(".mac" + d["device"])
          //   .style("fill-opacity", 1);
          // gLine.selectAll(".mac" + d["device"])
          //   .style("stroke-opacity", 1);
          // console.log(list);
          // focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
          // focus.select("text").text(formatCurrency(d.close));
        })
        .on("mouseout", function(d, i){

          // gRect.selectAll(".mac" + d["device"])
          //   .style("fill-opacity", 0.3);
          // gDot.selectAll(".mac" + d["device"])
          //   .style("fill-opacity", 0.3);
          // gLine.selectAll(".mac" + d["device"])
          //   .style("stroke-opacity", 0.1);
          
        });

      var dotList = [];
      for (var k = 0; k < dataset.length; k++) {
        var dot1 = {date_time:dataset[k][0].date_time, apid:dataset[k][0].apid, device:dataset[k].device},
            dot2 = {date_time:dataset[k][1].date_time, apid:dataset[k][1].apid, device:dataset[k].device};
        dotList.push(dot1);
        dotList.push(dot2);
      }

      //svg.selectAll(".dot")
      gDot.selectAll(".deviceAPDot")
        //.data(Array.prototype.concat.apply([], dataset))
        .data(dotList)
        .enter().append("circle")
        //.attr("class", "dot")
        .attr("class", function(d) {
          return "deviceAPDot mac" + d["device"];
        })
        .attr("r", 2)
        // .style("fill", function(d) {
        //   return "#8080FF";
        // })
        .attr("cx", function(d){
          return x(d.date_time);
        })
        .attr("cy", function(d) {
          return y(d.apid) - yFloor.rangeBand()/2.0;
        })
        //.on("mouseover", function(d, i) {
        .on("click", function(d, i) {
          var mouse = [d3.event.clientX, d3.event.clientY];
          var timePoint = x.invert(d3.mouse(this)[0]);
          var list = "";
          var overlayDeviceList = [];
          dataset.forEach(function(p, j){
            if (timePoint >= p[0].date_time && timePoint <= p[1].date_time) {
              list += p["device"] + " ";
              overlayDeviceList.push(p["device"]);
            }
          });
          if (clicked[d["device"]]) {
            clicked[d["device"]] = false;
            dehighlightTrace(d["device"]);
          }
          else {
            clicked[d["device"]] = true;
            highlightTrace(d["device"]);
          }
          
          // focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
          // focus.select("text").text(formatCurrency(d.close));
        })
        // .on("mouseout", function(d, i){

        //   gRect.selectAll(".mac" + d["device"])
        //     .style("fill-opacity", 0.3);
        //   gDot.selectAll(".mac" + d["device"])
        //     .style("fill-opacity", 0.3);
        //   gLine.selectAll(".mac" + d["device"])
        //     .style("stroke-opacity", 0.1);
          
        // })
        ;

        var lineSet = [];
        for (var i = 1; i < dataset.length; i++) {
          if //(apFloorMappings[dataset[i-1][1].apid] === apFloorMappings[dataset[i][0].apid] ||
              (x(dataset[i-1][1].date_time) > x(dataset[i][0].date_time)) continue;
          lineSet.push({start:dataset[i-1][1], end:dataset[i][0], device:dataset[i-1]["device"]});
        }
        console.log(lineSet);
        //svg.selectAll(".verticalLine")
        gLine.selectAll(".deviceVerticalLine")
          .data(lineSet)
          .enter().append("line")
          //.attr("class", "verticalLine")
          .attr("class", function(d) {
            return "deviceVerticalLine mac" + d["device"];
          })
          //.style("stroke-dasharray", "1,1")
          .attr("x1", function(d) {
            return x(d["start"].date_time);
          })
          .attr("x2", function(d) {
            return x(d["end"].date_time);
          })
          .attr("y1", function(d) {
            return y(d["start"].apid) - yFloor.rangeBand()/2.0;
          })
          .attr("y2", function(d) {
            return y(d["end"].apid) - yFloor.rangeBand()/2.0;
          })
          .on("click", function(d, i) {
            if (clicked[d["device"]]) {
              clicked[d["device"]] = false;
              dehighlightTrace(d["device"]);
            }
            else {
              clicked[d["device"]] = true;
              highlightTrace(d["device"]);
            }
          })
          .on("mouseover", function(d, i) {
            // var mouse = [d3.event.clientX, d3.event.clientY];
            // var timePoint = x.invert(d3.mouse(this)[0]);
            // console.log(timePoint);
            // var list = "";
            // var deviceList = [];
            // dataset.forEach(function(p, j){
            //   if (timePoint >= p[0].date_time && timePoint <= p[1].date_time) {
            //     console.log(p);
            //     list += p["device"] + " ";
            //     deviceList.push(p["device"]);
            //   }
            // });
            // console.log(gRect.selectAll(".mac" + d["device"]));
            // gRect.selectAll(".mac" + d["device"])
            //   .style("fill-opacity", 1);
            // gDot.selectAll(".mac" + d["device"])
            //   .style("fill-opacity", 1);
            // gLine.selectAll(".mac" + d["device"])
            //   .style("stroke-opacity", 1);
            // console.log(list);
            // focus.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
            // focus.select("text").text(formatCurrency(d.close));
          })
          // .on("mouseout", function(d, i){

          //   gRect.selectAll(".mac" + d["device"])
          //     .style("fill-opacity", 0.3);
          //   gDot.selectAll(".mac" + d["device"])
          //     .style("fill-opacity", 0.3);
          //   gLine.selectAll(".mac" + d["device"])
          //     .style("stroke-opacity", 0.1);
            
          // });
          //.attr("stroke", "steelblue")
          //.style("stroke-width", "0.1em");

         gSeg.selectAll(".deviceLogin")
            .data(loginRecords)
            .enter()
            .append("line")
            .attr("class", "deviceLogin line")
            .attr("x1", function(d) {
              return x(d.date_time);
            })
            .attr("x2", function(d) {
              return x(d.date_time);
            })
            .attr("y1", function(d) {
              return y(d.apid) - yFloor.rangeBand()/2.0 - 3.5;
            })
            .attr("y2", function(d) {
              return y(d.apid) - yFloor.rangeBand()/2.0 + 3.5;
            });
          gFloor.selectAll(".floorBtn")
            .data(Object.keys(floorAP))
            .enter()
            .append("circle")
            .attr("class", function(d) {
              var classStr = "floorBtn circle floor-" + d;
              if (floorCollapsed[d]) classStr += " collapsed";
              return classStr;
            })
            .attr("r", 4)
            .style("fill", function(d) {
              return ColorScheme.floor(+d.substring(1));
            })
            .attr("cx", function(d){
              return 8;
            })
            .attr("cy", function(d) {
              if (floorCollapsed[d] === true)
                return yFloor(d) - yFloor.rangeBand()/2 - 3.5;
              else
                return yFloor(d) - yFloor.rangeBand()/2 - Object.keys(floorAP[d]).length * 3.5;
            })
            //.on("mouseover", function(d, i) {
            .on("click", function(d, i) {
              if (floorCollapsed[d] === true) {
                floorCollapsed[d] = false;
              }
              else {
                floorCollapsed[d] = true;
              }
              setY();
              render(1);
            });

          console.log(deviceList);
          gDevice.selectAll(".rect")
            .data(deviceList)
            .enter()
            .append("text")
            .attr("x", 0)
            .attr("y", function(d, i) {
              return 10 + 10 * i;
            })
            .attr("class", function(d) {
              return "deviceList text mac" + d;
            })
            .text(function(d) {
              return d;
            })
            .on("mouseover", function(d) {
              highlightTrace(d);
            })
            .on("mouseout", function(d) {
              if (!clicked[d]) dehighlightTrace(d);
            });
    }
    else {

      // gTag.selectAll(".apTag.rect")
      //   .attr("x", 0)
      //   .attr("y", function(d){
      //     return y(floorDomain[d]) - yFloor.rangeBand()/2.0 - 2.5;
      //   })
      //   .attr("width", size.width)
      //   .attr("height", 5)
      //   .style("fill", "grey")
      //   .style("opacity", 0.0);
      gTag.selectAll(".apTag.line")
        .attr("x1", function(d) {
            return 0;
        })
        .attr("x2", function(d) {
          return size.width+40;
        })
        .attr("y1", function(d) {
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        })
        .attr("y2", function(d) {
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        });
      gTag.selectAll(".apTag.text")
        .style("font-size", (0.6 / zoom.scale()) + "em")
        .attr("x", 0)
        .attr("y", function(d){
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        });

      yScale.domain([0, Object.keys(floorDomain).length]);
      gRect.selectAll(".deviceAPRect")
        .attr("x", function(d){
            return x(d[0].date_time);
          })
        .attr("y", function(d){
          return y(d[0].apid) - yFloor.rangeBand()/2.0 - 2.5;
        })
        .attr("width", function(d){
          return x(d[1].date_time) - x(d[0].date_time);
        });

    //svg.selectAll(".dot")
      gDot.selectAll(".deviceAPDot")
        .attr("r", 2 / Math.sqrt(zoom.scale()))
        .attr("cx", function(d){
          return x(d.date_time);
        })
        .attr("cy", function(d) {
          return y(d.apid) - yFloor.rangeBand()/2.0;
        });

        var lineSet = [];
        for (var i = 1; i < dataset.length; i++) {
          if //(apFloorMappings[dataset[i-1][1].apid] === apFloorMappings[dataset[i][0].apid] ||
              (x(dataset[i-1][1].date_time) > x(dataset[i][0].date_time)) continue;
          lineSet.push([dataset[i-1][1], dataset[i][0]]);
        }
        console.log(lineSet);
        //svg.selectAll(".verticalLine")
        gLine.selectAll(".deviceVerticalLine")
          //.style("stroke-dasharray", "1,1")
          .attr("x1", function(d) {
            return x(d["start"].date_time);
          })
          .attr("x2", function(d) {
            return x(d["end"].date_time);
          })
          .attr("y1", function(d) {
            return y(d["start"].apid) - yFloor.rangeBand()/2.0;
          })
          .attr("y2", function(d) {
            return y(d["end"].apid) - yFloor.rangeBand()/2.0;
          });
        gFloor.selectAll(".floorBtn")
          .attr("r", 4 / zoom.scale())
          .attr("cx", function(d){
            return 8;
          })
          .attr("cy", function(d) {
            if (floorCollapsed[d] === true)
                return yFloor(d) - yFloor.rangeBand()/2 - 3.5;
              else
                return yFloor(d) - yFloor.rangeBand()/2 - Object.keys(floorAP[d]).length * 3.5;
          });
    }

  }
    
  return DeviceView;
}


//var dvdb = new WFV_DB(new Date(2013,08,02), new Date(2013,08,03));



// dvdb.init(function(){
//   var dates = [new Date(2013,08,02)];
//   //access_data = get_access_data("ac02bf41ce", dates)
//   access_data = [];
//   access_data.push(get_access_data("5dfab8ca93", dates));
//   access_data.push(get_access_data("f8e481d35f", dates));
//   access_data.push(get_access_data("6f7da95740", dates));
//   access_data.push(get_access_data("95423c652f", dates));
//   access_data.push(get_access_data("b5ad9c2525", dates));
//   access_data.push(get_access_data("98e35d88ce", dates));
//   access_data.push(get_access_data("07a2a4e391", dates));
//   access_data.push(get_access_data("4dd99a5369", dates));
//   access_data.push(get_access_data("8bb1e41237", dates));
//   access_data.push(get_access_data("5f44f70682", dates));
//   access_data.push(get_access_data("964291cee6", dates));
//   console.log(access_data);
//   deviceView(access_data);
// });



// function deviceView(access_data){
//   var margin = {top: 50, right: 20, bottom: 30, left: 100},
//     width = 1100 - margin.left - margin.right,
//     height = 500 - margin.top - margin.bottom;

//   var parseDate = d3.time.format("%H:%M").parse;
//   var xformatDate = d3.time.format("%H:%M");
//   var yformatDate = d3.time.format("%x");

//   var dateStr = [];

//   // access_data.forEach(function(path){
//   //     path.forEach(function(d){
//   //     //d.time = parseDate(d.date_time);
//   //     d.date = d.date_time.to_date();
//   //     // console.log(d.date)
//   //   });
//   // });

//   // access_data.forEach(function(d){
//   //   dateStr.push(d[0].date)
//   // })

//   // var x = d3.scale.linear()
//   //     .range([0, width]);
//   var x = d3.time.scale()
//             .range([0, width]);

//   // var y = d3.scale.ordinal()
//   //     // .range([0, height])
//   //     .rangeBands([0, height], .1);
//   var yFloor = d3.scale.ordinal()
//       .rangeBands([0, height], .1);


//   var xAxis = d3.svg.axis()
//       .scale(x)
//       .orient("bottom");
//       // .tickFormat(function(d) {
//       //   return xformatDate(new Date(d - 8*60*60*1000))
//       // })

//   var yAxis = d3.svg.axis()
//       .scale(y)
//       .orient("left")
//       // .tickFormat(function(d) {
//       //   return yformatDate(new Date(d))
//       // })
//       // .tickFormat(function(d) {
//         // console.log(d)
//         // return d
//       // })
//       .ticks(2);

//   var svg = d3.select("#device-view-svg")
//       .attr("width", width + margin.left + margin.right)
//       .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 


//   //x.domain([0, 2*60*60*1000]);
//   //x.domain([0, 24*60*60*1000]);
//   //x.domain([new Date('2013-09-02'), new Date('2013-09-03')]);
//   x.domain([new Date(2013, 08, 02, 00, 00, 00, 00), new Date(2013, 08, 03, 00, 00, 00, 00)]);

//   // y.domain(access_data[0].line.map(function(d) {
//   //   // console.log(d[0].date_time.to_date_str()); 
//   //   // console.log(d.apid)  
//   //   return d.apid;
//   // }));
//   // var yDomain = d3.extent(access_data, function(d) {return d[0].date})
//   // var domainMin = new Date(new Date(yDomain[0]).getTime()-86400000)
//   // var domainMax = new Date(new Date(yDomain[1]).getTime()+86400000)
//   // yyy = y;
//   // console.log(domainMin, domainMax)
//   // y.domain([new Date(domainMin), new Date(domainMax)])
//   // console.log(y.domain())
//   // console.log(y("2013-09-04"))

//   yFloorAP = [];
//   for (var ap in apNameMappings) {
//     if (ap in apFloorMappings) continue;
//     var tempArray = apNameMappings[ap].split("ap");
//     apFloorMappings[ap] = tempArray[0];
//     if (tempArray[0] in floorAP) {
//       floorAP[tempArray[0]][ap] = apNameMappings[ap];
//     }
//     else {
//       floorAP[tempArray[0]] = {};
//       floorAP[tempArray[0]][ap] = apNameMappings[ap]; 
//     }
//   }
//   console.log(apFloorMappings);
//   console.log(floorAP);



//   var line = d3.svg.line()
//       .x(function(d){
//         // var h = d.date_time.getHours();
//         // var m = d.date_time.getMinutes();
//         // var s = d.date_time.getSeconds();
//         // var ml = (h*3600+m*60+s)*1000;
//         // return x(ml)
//         return x(d.date_time);
//       })
//       .y(function(d){
//         // var r = y(d.date_time.to_date_str());
//         // console.log(d.date_time.to_date_str())
//         // console.log(r)
//         // r = y(new Date(d.date))
//         // console.log(r, d.date, y.domain())
//         // return r;
//         //return y(d.apid)+y.rangeBand()/2.0;
//         return height - (y(d.apid)+y.rangeBand()/2.0);
//       });


//   svg.append("g")
//     .attr("class", "x axis")
//     .attr("transform", "translate(0," + height + ")")
//     .call(xAxis);

//   // svg.append("g")
//   //   .attr("class", "y axis")
//   //   .call(yAxis);

//   // svg.selectAll(".line")
//   //   .data(access_data[0].lines)
//   //   .enter().append("path")
//   //   .attr("class", "line")
//   //   .attr("d", line);


//   // var tempDataset = access_data[0].lines.filter(function(d) {
//   //     var h0 = d[0].date_time.getHours();
//   //     var m0 = d[0].date_time.getMinutes();
//   //     var s0 = d[0].date_time.getSeconds();
//   //     var h1 = d[1].date_time.getHours();
//   //     var m1 = d[1].date_time.getMinutes();
//   //     var s1 = d[1].date_time.getSeconds();
      
//   //     var ml0 = (h0*3600+m0*60+s0)*1000, ml1 = (h1*3600+m1*60+s1)*1000;
//   //     return true;
//   //     //return x(ml1) - x(ml0) > 2.5;
//   // });
//   var dataset = [], cnt = 0;

//   // dataset.push(tempDataset[0]);
//   // for (var i = 1; i < tempDataset.length; i++) {
//   //   var cur = tempDataset[i];
//   //   var h0 = dataset[cnt][1].date_time.getHours();
//   //   var m0 = dataset[cnt][1].date_time.getMinutes();
//   //   var s0 = dataset[cnt][1].date_time.getSeconds();
//   //   var h1 = cur[0].date_time.getHours();
//   //   var m1 = cur[0].date_time.getMinutes();
//   //   var s1 = cur[0].date_time.getSeconds();
//   //   var ml0 = (h0*3600+m0*60+s0)*1000, ml1 = (h1*3600+m1*60+s1)*1000;
//   //   //if (x(ml1) - x(ml0) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
//   //   if (x(dataset[cnt][1].date_time) - x(cur[0].date_time) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
//   //     dataset.push(cur);
//   //     cnt++;
//   //   }
//   //   else {
//   //     dataset[cnt][1] = cur[1];
//   //   }
//   // }

//   var dataDeviceMappings = {};

//   for (var device = 0; device < access_data.length; device ++) {

//     tempDataset = access_data[device][0].lines;
//     dataset.push(tempDataset[0]);
//     dataDeviceMappings[cnt++] = device;
//     for (var i = 1; i < tempDataset.length; i++) {
//       var cur = tempDataset[i];
//       // var h0 = dataset[cnt][1].date_time.getHours();
//       // var m0 = dataset[cnt][1].date_time.getMinutes();
//       // var s0 = dataset[cnt][1].date_time.getSeconds();
//       // var h1 = cur[0].date_time.getHours();
//       // var m1 = cur[0].date_time.getMinutes();
//       // var s1 = cur[0].date_time.getSeconds();
//       // var ml0 = (h0*3600+m0*60+s0)*1000, ml1 = (h1*3600+m1*60+s1)*1000;
//       //if (x(dataset[cnt][1].date_time) - x(cur[0].date_time) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
//         if (x(dataset[cnt-1][1].date_time) - x(cur[0].date_time) > 0.0 || cur[0].apid != dataset[cnt-1][1].apid) {
//         dataset.push(cur);
//         dataDeviceMappings[cnt++] = device;
//       }
//       else {
//         dataset[cnt-1][1] = cur[1];
//       }
//     }
//   }
  

//   console.log(dataset);
//   dataset.forEach(function(d) {
//     if (!(d[0].apid in apConnCnt)) {
//         apConnCnt[d[0].apid] = 1;
//     }
//     else {
//        apConnCnt[d[0].apid] ++; 
//     }
//   });

  
//   console.log(apConnCnt);
//   var floorDomain = {};
//   for (var ap in apNameMappings) {
//     //floorDomain[apNameMappings[ap]] = apNameMappings[ap];
//     floorDomain[apNameMappings[ap]] = ap;
//   }
  
//   // y.domain(Object.keys(apFloorMappings).filter(function(d) {
//   //   return apConnCnt[d] > 0;
//   // }));
//   for (var floor in floorAP) {
//     floorDomain[floor] = floor;
//   }
//   yFloor.domain(Object.keys(floorDomain).sort());
//   console.log(floorDomain);
//   console.log(yFloor.domain());

//   for (var floor in floorAP) {
//     yFloorAP[floor] = d3.scale.ordinal()
//                         .rangeBands([0, height * Object.keys(floorAP[floor]).length / Object.keys(floorDomain).length], .1);
//     yFloorAP[floor].domain(Object.keys(floorAP[floor]));
//   }
//   console.log(floorAP);
//   console.log(yFloorAP);

//   function y(apid) {
//     var floor = apFloorMappings[apid];

//     var floorOffset = yFloor(floor);
//     var apOffset = yFloorAP[floor](apid);
//     //console.log(floor + ", " + floorOffset + ", " + apOffset);
//     return height - (floorOffset + apOffset); 
//   }

//   var apBarSvg = svg.selectAll(".apTag")
//     .data(yFloor.domain().filter(function(d) {
//       return d.length > 4;
//       //return true;
//     }))
//     .enter()
//     .append("g");
//   apBarSvg
//     .attr("class", "apTag")
//     .append("rect")
//     .attr("x", 0)
//     .attr("y", function(d){
//         // var r = y(d.date_time.to_date_str());
//         // console.log(d.date_time.to_date_str())
//         // console.log(r)
//         // r = y(new Date(d.date))
//         // console.log(r, d.date, y.domain())
//         // return r;
//         //return y(d[0].apid)+y.rangeBand()/2.0 - 2.5;
//         //console.log(height - (yFloor(d)+yFloor.rangeBand()/2.0 + 2.5));
//         //return height - (yFloor(d)+yFloor.rangeBand()/2.0 + 2.5);
//         return y(floorDomain[d]) - yFloor.rangeBand()/2.0 - 2.5;
//       })
//     .attr("width", width)
//     .attr("height", 5)
//     .style("fill", "grey")
//     .style("opacity", 0.0);
//   apBarSvg
//     .append("text")
//     .attr("class", "apTag")
//     .attr("x", -40)
//     .attr("y", function(d){
//       //return height - (yFloor(d)+yFloor.rangeBand()/2.0 - 2.5);
//         return y(floorDomain[d]) - yFloor.rangeBand()/2.0 + 2.5;
//      })
//     .text(function(d) {
//       //console.log(d);
//       return d;
//       //return apNameMappings[d];
//     });
 

//   svg.selectAll(".rect")
//     .data(dataset)
//     .enter().append("rect")
//     .attr("class", "rect")
//     .attr("x", function(d){
//         var h = d[0].date_time.getHours();
//         var m = d[0].date_time.getMinutes();
//         var s = d[0].date_time.getSeconds();
//         var ml = (h*3600+m*60+s)*1000;
//         //return x(ml);
//         return x(d[0].date_time);
//       })
//     .attr("y", function(d){
//         // var r = y(d.date_time.to_date_str());
//         // console.log(d.date_time.to_date_str())
//         // console.log(r)
//         // r = y(new Date(d.date))
//         // console.log(r, d.date, y.domain())
//         // return r;
//         //return y(d[0].apid)+y.rangeBand()/2.0 - 2.5;
//         //return height - (y(d[0].apid)+y.rangeBand()/2.0 + 2.5);
//         return y(d[0].apid) - yFloor.rangeBand()/2.0 - 2.5;
//       })
//     .attr("width", function(d){
//         var h0 = d[0].date_time.getHours();
//         var m0 = d[0].date_time.getMinutes();
//         var s0 = d[0].date_time.getSeconds();
//         var h1 = d[1].date_time.getHours();
//         var m1 = d[1].date_time.getMinutes();
//         var s1 = d[1].date_time.getSeconds();
        
//         var ml0 = (h0*3600+m0*60+s0)*1000, ml1 = (h1*3600+m1*60+s1)*1000;
//         //return x(ml1) - x(ml0);
//         return x(d[1].date_time) - x(d[0].date_time);
//     })
//     .attr("height", 5)
//     .attr("fill", function(d) {
//       return "black";
//     })
//     .style("opacity", 0.1)
//     .style("stroke", "white")
//     .style("stroke-width", "2px")
//     ;

//   svg.selectAll(".dot")
//     //.data(Array.prototype.concat.apply([],access_data[0].line))
//     .data(Array.prototype.concat.apply([], dataset))
//     .enter().append("circle")
//     .attr("class", "dot")
//     .attr("r", 2.5)
//     //.style("fill", "#8080FF")
//     .style("fill", function(d) {
//       //d.
//     })
//     .attr("cx", function(d){
//       // console.log(d)
//         var h = d.date_time.getHours();
//         var m = d.date_time.getMinutes();
//         var s = d.date_time.getSeconds();
//         var ml = (h*3600+m*60+s)*1000;
//         //return x(ml)
//         return x(d.date_time);
//       })
//     .attr("cy", function(d) {
//       //return y(d.apid)+y.rangeBand()/2.0; 
//       //return height - (y(d.apid)+y.rangeBand()/2.0); 
//       return y(d.apid) - yFloor.rangeBand()/2.0;

//     });

//     var lineSet = [];
//     for (var i = 1; i < dataset.length; i++) {
//       if //(apFloorMappings[dataset[i-1][1].apid] === apFloorMappings[dataset[i][0].apid] ||
//           (x(dataset[i-1][1].date_time) > x(dataset[i][0].date_time)) continue;
//       lineSet.push([dataset[i-1][1], dataset[i][0]]);
//     }
//     console.log(lineSet);
//     svg.selectAll(".verticalLine")
//       .data(lineSet)
//       .enter().append("line")
//       .attr("class", "verticalLine")
//       //.style("stroke-dasharray", "1,1")
//       .attr("x1", function(d) {
//         var h0 = d[0].date_time.getHours();
//         var m0 = d[0].date_time.getMinutes();
//         var s0 = d[0].date_time.getSeconds();
//         //return x((h0*3600+m0*60+s0)*1000);
//         return x(d[0].date_time);
//       })
//       .attr("x2", function(d) {
//         var h1 = d[1].date_time.getHours();
//         var m1 = d[1].date_time.getMinutes();
//         var s1 = d[1].date_time.getSeconds();
//         //return x((h1*3600+m1*60+s1)*1000);
//         return x(d[1].date_time);
//       })
//       .attr("y1", function(d) {
//         //return height - (y(d[0].apid)+y.rangeBand()/2.0 + 2.5);
//         return y(d[0].apid) - yFloor.rangeBand()/2.0 - 2.5;
//       })
//       .attr("y2", function(d) {
//         //return height - (y(d[1].apid)+y.rangeBand()/2.0 + 2.5);
//         return y(d[1].apid) - yFloor.rangeBand()/2.0 - 2.5;
//       })
//       .attr("stroke", "steelblue");
// }



