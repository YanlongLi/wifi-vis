WifiVis.NlDeviceView = function(selectedDevices){
  function NlDeviceView(){}

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


  var nlSize, nlTimelineSize;
  var nlSvg = utils.initSVG("#device-view-non-linear-svg", [10]);
  var nlLeftSvg = utils.initSVG("#device-view-non-linear-left-svg", [10, 0]);
  var nlListSvg = utils.initSVG("#device-view-non-linear-list-svg", [10, 0]);
  //var svg = $("#device-view-svg");
  var nlG = d3.select("#device-view-non-linear-g");
  var lZoom = d3.behavior.zoom().scaleExtent([1, 10]).on("zoom", nlZoomed);


  var nlGXAxis = d3.select("#device-view-non-linear-x-axis-g");
  var nlGYAxis = d3.select("#device-view-non-linear-y-axis-g");
  //var gXAxis = g.append("g").attr("class", "timeline");
  var nlGRect = nlG.append("g").attr("class", "rects"), nlGDot = nlG.append("g").attr("class", "dots"),
      nlGLine = nlG.append("g").attr("class", "lines"), nlGTag = nlG.append("g").attr("class", "tags"),
      nlGSeg = nlG.append("g").attr("class", "logins"),
      nlGFloor = d3.select("#device-view-non-linear-left-svg").append("g").attr("class", "floors"),
      nlGDevice = d3.select("#device-view-non-linear-list-svg").append("g").attr("class", "devices");
  

  var parseDate = d3.time.format("%H:%M").parse;
  var xformatDate = d3.time.format("%H:%M");
  var FloorAPformatDate = d3.time.format("%x");
  var parseTime = d3.time.format("%y-%m-%d %H:%M:%S");


  var x = d3.time.scale()
            .domain([timeFrom, timeTo]);
  var nlX = d3.time.scale();

  var nlXAxis = d3.svg.axis()
      .scale(nlX)
      .orient("bottom")
      .ticks(4);
  var yFloor = d3.scale.ordinal();
      //.rangeBands([0, height], .1);

  var yScale = d3.scale.linear();
  var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left");
  var nlZoom = d3.behavior.zoom()
            .center([0, 0])
            .scaleExtent([1, 10])
            //.y(yScale)
            .on("zoom", nlZoomed);
  
      

  initNlSvg();
  initInteraction();

  function initNlSvg(){
    var _w = nlSvg.w, _h = nlSvg.h - 5;

    nlSize = utils.initG(nlG, _w-15, _h, [0,5,20,0]);
    //timelineSize = utils.initG(gXAxis, _w-40, 20, [0,0,0,0]);
    //x.domain([timeFrom, timeTo])
    yScale.range([nlSize.height, 0]);
    yFloor.rangeBands([nlSize.height, 0], .1);
    x.range([0, nlSize.width]);
    nlGXAxis
      .attr("class", "x axis")
      .attr("transform", "translate(40," + (nlSize.height+5) + ")");
      //.attr("transform", "translate(40," + 0 + ")")
      //.call(xAxis);
    var nlDomainLen = nlX.domain().length;
    if (nlDomainLen > 0) {
      nlX.range(nlX.domain().map(function(d, i) {
        return 0.5 * (x(d) + nlSize.width * (i + 1) / (nlDomainLen + 1));
      }));

      nlZoom.x(nlX);
      nlGXAxis.call(nlXAxis);
    }

     // gYAxis
     //  .attr("class", "y axis")
     //  .attr("transform", "translate(0,0)")
     //  //.attr("transform", "translate(40," + 0 + ")")
     //  .call(yAxis);

   
    //g.call(d3.behavior.zoom().scaleExtent([1, 10]).on("zoom", zoomed));
    nlZoom = d3.behavior.zoom()
            .center([0, 0])
            .scaleExtent([1, 10])
            //.y(yScale)
            .on("zoom", nlZoomed);
    d3.select("#device-view-non-linear-svg").call(nlZoom).call(nlZoom.event);
    d3.select("#device-view-non-linear-left-svg").call(nlZoom).call(nlZoom.event);

    nlGDot.attr("transform", "translate(40,0)scale(1,1)");
    nlGRect.attr("transform", "translate(40,0)scale(1,1)");
    nlGLine.attr("transform", "translate(40,0)scale(1,1)");
    nlGSeg.attr("transform", "translate(40,0)scale(1,1)");
    nlGTag.attr("transform", "translate(0,0)scale(1,1)");
    //gXAxis.attr("transform",  "translate(0,0)scale(1,1)");

    d3.select("#device-view-non-linear-reset-btn").on("click", reset);
    d3.select("#device-view-zoom-non-linear-in-btn").on("click", zoomIn);
    d3.select("#device-view-zoom-non-linear-out-btn").on("click", zoomOut);
    //console.log(size);
  }

  function reset() {
    initNlSvg();
    initYScale();
    nlRender(1);
  }

  function nlZoomed() {
    var zoomX = nlZoom.translate()[0], zoomY = nlZoom.translate()[1];

    nlGDot.attr("transform", "translate(" + (40 + zoomX) + "," + zoomY + ")scale(" + nlZoom.scale() + ")");
    nlGDot.selectAll(".deviceAPDot")
        .attr("r", 2 / Math.sqrt(nlZoom.scale()));
    nlGRect.attr("transform", "translate(" + (40 + zoomX) + "," + zoomY + ")scale(" + nlZoom.scale() + ")");
    nlGLine.attr("transform", "translate(" + (40 + zoomX) + "," + zoomY + ")scale(" + nlZoom.scale() + ")");
    nlGLine.selectAll("deviceVerticalLine")
        .style("stroke-width", (1 / nlZoom.scale() / nlZoom.scale()) + "px");
    nlGTag.attr("transform", "translate(0," + zoomY + ")scale(" + nlZoom.scale() + ")");
    nlGTag.selectAll(".apTag.line")
      .style("stroke-width", (1 / nlZoom.scale()) + "px");
    nlGTag.selectAll(".apTag.text")
      .style("font-size", (0.6 / nlZoom.scale()) + "em");
    nlGSeg.attr("transform", "translate(" + (40 + zoomX) + "," + zoomY + ")scale(" + nlZoom.scale() + ")");
    nlGSeg.selectAll(".deviceLogin")
      .style("stroke-width", (1 / nlZoom.scale()) + "px");
    nlGFloor.attr("transform", "translate(0," + zoomY + ")scale(" + nlZoom.scale() + ")");
    //gFloor.attr("transform", "translate(0," + zoom.translate()[1]+ ")scale(1," + zoom.scale() + ")");
    nlGFloor.selectAll(".floorBtn")
        .attr("cx", 8 / nlZoom.scale())
        .attr("r", 4 / nlZoom.scale());

    //gYAxis.call(yAxis);
    nlGXAxis.call(nlXAxis);
   
  }

  function zoom_by(factor){
    var scale = nlZoom.scale(),
        extent = nlZoom.scaleExtent(),
        translate = nlZoom.translate(),
        tempX = translate[0], tempY = translate[1],
        target_scale = scale * factor
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
    nlZoom.scale(target_scale)
        .translate([tempX, tempY]);
    nlZoomed();
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
    var yHeight = nlSize.height;
    console.log(Object.keys(floorDomain).length * 7  + ", " + nlSize.height);
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
    nlSvg = utils.resizeSVG(nlSvg);
    initNlSvg();
    initYScale();

    nlRender(0);
  });


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

  ObserverManager.addListener(NlDeviceView);
  NlDeviceView.OMListen = function(message, data){
    console.log(data);
    if(message == WFV.Message.DeviceSelect){
      if (!data.isAdd) return;
      console.log(data.device);
      deviceList = data.device;
      NlDeviceView.update();
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
    var yHeight = nlSize.height;
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
  NlDeviceView.update = function(){
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
    loginRecords = loginRecords.sort(function(a, b) {
      return a.date_time - b.date_time;
    });
    access_data = access_data.filter(function(d) {
      return d[0].lines.length > 0;
    });

    var nlDomain = [timeFrom].concat(loginRecords.map(function(d) {
          return new Date(d.date_time);
        }));
    
    nlX.domain(nlDomain);
    var nlDomainLen = nlX.domain().length;
    nlX.range(nlDomain.map(function(d, i) {
      return 0.5 * (x(d) + nlSize.width * (i + 1) / (nlDomainLen + 1));
    }));

    nlZoom.x(nlX);

    console.log(x.domain());
    console.log(nlX.domain());
    console.log(nlX.range());
    nlGXAxis.call(nlXAxis);

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


    var yHeight = nlSize.height;
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

    nlRender(1);
  }

  function nlHighlightTrace(mac) {
    nlGRect.selectAll(".mac" + mac)
      .style("fill-opacity", 1);
    nlGDot.selectAll(".mac" + mac)
      .style("fill-opacity", 1);
    nlGLine.selectAll(".mac" + mac)
      .style("stroke-opacity", 1);
  }
  function nlDehighlightTrace(mac) {
    nlGRect.selectAll(".mac" + mac)
      .style("fill-opacity", 0.3);
    nlGDot.selectAll(".mac" + mac)
      .style("fill-opacity", 0.3);
    nlGLine.selectAll(".mac" + mac)
      .style("stroke-opacity", 0.1);
  }

  function nlRender(needRemove) {
    if (needRemove === 1) {
      nlGTag.selectAll(".apTag").remove();
      nlGRect.selectAll(".deviceAPRect").remove();
      nlGDot.selectAll(".deviceAPDot").remove();
      nlGLine.selectAll(".deviceVerticalLine").remove();
      nlGSeg.selectAll(".deviceLogin").remove();
      nlGFloor.selectAll(".floorBtn").remove();
      nlGDevice.selectAll(".deviceList").remove();
      d3.select("#device-view-non-linear-wrapper").selectAll(".remove").remove();

      d3.select("#device-view-non-linear-svg").call(nlZoom).call(nlZoom.event);
      d3.select("#device-view-non-linear-left-svg").call(nlZoom).call(nlZoom.event);

      var tooltip = d3.select("#device-view-non-linear-wrapper")
          .append("div")
          .attr("class", "remove")
          .style("position", "absolute")
          .style("z-index", "20")
          .style("visibility", "hidden")
          .style("top", "10px")
          .style("left", "100px");

      var vertical = d3.select("#device-view-non-linear-wrapper")
          .append("div")
          .attr("class", "remove dragbox-content")
          .style("position", "absolute")
          .style("z-index", "19")
          .style("width", "1px")
          .style("height", nlSvg.h)
          .style("top", "30px")
          .style("bottom", "0px")
          .style("left", "0px")
          .style("background", "#000");

      d3.select("#device-view-non-linear-wrapper")
        .on("mousemove", function(){  
          mousex = d3.mouse(this);
          mousex = mousex[0] + 2;
          if (mousex < 58) mousex = 58;
          if (mousex > nlSvg.w + 40) mousex = nlSvg.w + 40;
          vertical.style("left", mousex + "px" );
          var timePoint = nlX.invert(mousex - 58);
          console.log(timePoint);
          tooltip.html( "<p>" + d3.time.format("%c")(timePoint) + "</p>" ).style("visibility", "visible");
        })
        .on("mouseover", function(){  
          mousex = d3.mouse(this);
          mousex = mousex[0] + 5;
          if (mousex < 58) mousex = 58;
          if (mousex > nlSvg.w + 40) mousex = nlSvg.w + 40;
          vertical.style("left", mousex + "px")}
        );
      
      var gTags = nlGTag.selectAll(".apTag")
        .data(yFloor.domain().filter(function(d) {
          return d.length > 4;
          //return true;
        }))
        .enter()
        .append("g");
     
      gTags
        .append("line")
        .attr("class", "apTag line")
        .attr("transform", "translate(0,0)scale(1,1)")
        .attr("x1", function(d) {
            return 0;
        })
        .attr("x2", function(d) {
          return nlSize.width + 40;
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

      nlGRect.selectAll(".deviceAPRect")
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
            return nlX(d[0].date_time);
          })
        .attr("y", function(d){
          return y(d[0].apid) - yFloor.rangeBand()/2.0 - 2.5;
        })
        .attr("width", function(d){
          return nlX(d[1].date_time) - nlX(d[0].date_time);
        })
        .attr("height", 5)
        .on("click", function(d, i) {
          if (clicked[d["device"]]) {
            clicked[d["device"]] = false;
            nlDehighlightTrace(d["device"]);
          }
          else {
            clicked[d["device"]] = true;
            nlHighlightTrace(d["device"]);
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

      var nlD = nlX.domain();
      console.log(nlX.domain());
      nlD.forEach(function(d) {
        console.log(
          d + "," + nlX(d)
        );
      });
      

      var dotList = [];
      //var bisect = d3.bisector(function(d) { return d.date_time; }).left;
      var bisect = d3.bisector(function(d) { return d; }).left;
      for (var k = 0; k < dataset.length; k++) {
        var dot1 = {date_time:dataset[k][0].date_time, apid:dataset[k][0].apid, device:dataset[k].device},
            dot2 = {date_time:dataset[k][1].date_time, apid:dataset[k][1].apid, device:dataset[k].device};
        //var i = bisect(loginRecords, dot1.date_time);
        var i = bisect(nlX.domain(), dot1.date_time);
        console.log(dot1.date_time);
        console.log(nlX.domain()[i] + ", " + nlX.domain()[i+1]);
        console.log(nlX(dot1.date_time) + ", " + nlX(nlX.domain()[i]));

        // console.log(nlX(dot2.date_time));
        dotList.push(dot1);
        dotList.push(dot2);
      }

      //svg.selectAll(".dot")
      nlGDot.selectAll(".deviceAPDot")
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
          return nlX(d.date_time);
        })
        .attr("cy", function(d) {
          return y(d.apid) - yFloor.rangeBand()/2.0;
        })
        //.on("mouseover", function(d, i) {
        .on("click", function(d, i) {
          if (clicked[d["device"]]) {
            clicked[d["device"]] = false;
            nlDehighlightTrace(d["device"]);
          }
          else {
            clicked[d["device"]] = true;
            nlHighlightTrace(d["device"]);
          }
          console.log(nlGRect.selectAll(".mac" + d["device"]));
          console.log(list);        
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
        nlGLine.selectAll(".deviceVerticalLine")
          .data(lineSet)
          .enter().append("line")
          //.attr("class", "verticalLine")
          .attr("class", function(d) {
            return "deviceVerticalLine mac" + d["device"];
          })
          //.style("stroke-dasharray", "1,1")
          .attr("x1", function(d) {
            return nlX(d["start"].date_time);
          })
          .attr("x2", function(d) {
            return nlX(d["end"].date_time);
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
              nlDehighlightTrace(d["device"]);
            }
            else {
              clicked[d["device"]] = true;
              nlHighlightTrace(d["device"]);
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

         nlGSeg.selectAll(".deviceLogin")
            .data(loginRecords)
            .enter()
            .append("line")
            .attr("class", "deviceLogin line")
            .attr("x1", function(d) {
              return nlX(d.date_time);
            })
            .attr("x2", function(d) {
              return nlX(d.date_time);
            })
            .attr("y1", function(d) {
              return y(d.apid) - yFloor.rangeBand()/2.0 - 3.5;
            })
            .attr("y2", function(d) {
              return y(d.apid) - yFloor.rangeBand()/2.0 + 3.5;
            });
          nlGFloor.selectAll(".floorBtn")
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
              nlRender(1);
            });

          console.log(deviceList);
          nlGDevice.selectAll(".rect")
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
              nlHighlightTrace(d);
            })
            .on("mouseout", function(d) {
              if (!clicked[d]) nlDehighlightTrace(d);
            });
    }
    else {

    
      nlGTag.selectAll(".apTag.line")
        .attr("x1", function(d) {
            return 0;
        })
        .attr("x2", function(d) {
          return nlSize.width+40;
        })
        .attr("y1", function(d) {
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        })
        .attr("y2", function(d) {
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        });
      nlGTag.selectAll(".apTag.text")
        .style("font-size", (0.6 / nlZoom.scale()) + "em")
        .attr("x", 0)
        .attr("y", function(d){
          return y(floorDomain[d]) - yFloor.rangeBand()/2.0;
        });

      yScale.domain([0, Object.keys(floorDomain).length]);
      nlGRect.selectAll(".deviceAPRect")
        .attr("x", function(d){
            return nlX(d[0].date_time);
          })
        .attr("y", function(d){
          return y(d[0].apid) - yFloor.rangeBand()/2.0 - 2.5;
        })
        .attr("width", function(d){
          return nlX(d[1].date_time) - nlX(d[0].date_time);
        });

    //svg.selectAll(".dot")
      nlGDot.selectAll(".deviceAPDot")
        .attr("r", 2 / Math.sqrt(nlZoom.scale()))
        .attr("cx", function(d){
          return nlX(d.date_time);
        })
        .attr("cy", function(d) {
          return y(d.apid) - yFloor.rangeBand()/2.0;
        });

        
        nlGLine.selectAll(".deviceVerticalLine")
          //.style("stroke-dasharray", "1,1")
          .attr("x1", function(d) {
            return nlX(d["start"].date_time);
          })
          .attr("x2", function(d) {
            return nlX(d["end"].date_time);
          })
          .attr("y1", function(d) {
            return y(d["start"].apid) - yFloor.rangeBand()/2.0;
          })
          .attr("y2", function(d) {
            return y(d["end"].apid) - yFloor.rangeBand()/2.0;
          });
        nlGFloor.selectAll(".floorBtn")
          .attr("r", 4 / nlZoom.scale())
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

  return NlDeviceView;
}
