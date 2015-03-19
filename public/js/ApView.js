WifiVis.ApView = function() {
  function ApView(){}

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
  var loginRecords;
  var deviceTotalLoginDuration = {};
  var deviceLoginDuration = {};

  var deviceList = [], deviceMap = {}, apList = [], apMap = {};
  var selectedDevices = [];

  var checkInIntervalString = "2013-09-02 00:00:30";
  var checkInIntervalDate = new Date(checkInIntervalString);
  var checkInInterval;

  var size, timelineSize;
  var svg = utils.initSVG("#ap-view-svg", [10]), leftSVG = utils.initSVG("#ap-view-left-svg", [10, 0]);
  //var svg = $("#ap-view-svg");
  var g = d3.select("#ap-view-g");
  var zoom = d3.behavior.zoom().scaleExtent([1, 10]).on("zoom", zoomed);

  var brush = d3.svg.brush()
      .on("brushstart", brushstart)
      .on("brush", brush)
      .on("brushend", brushend);




  var gXAxis = d3.select("#ap-view-x-axis-g");
  var gYAxis = d3.select("#ap-view-y-axis-g");
  //var gXAxis = g.append("g").attr("class", "timeline");
  var gRect = g.append("g").attr("class", "rects"), 
      //gDot = g.append("g").attr("class", "dots"),
      //gLine = g.append("g").attr("class", "lines"), 
      gTagLine = g.append("g").attr("class", "tags"),
      gTagText = d3.select("#ap-view-left-svg").append("g").attr("class", "tags"),
      gSeg = g.append("g").attr("class", "logins");
  
  var parseDate = d3.time.format("%H:%M").parse;
  var xformatDate = d3.time.format("%H:%M");
  var parseTime = d3.time.format("%y-%m-%d %H:%M:%S");
  var FloorAPformatDate = d3.time.format("%x");

  var x = d3.time.scale()
            .domain([timeFrom, timeTo]);
            
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
          .ticks(4);
  
  var yScale = d3.scale.ordinal();
  var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left");
  
      
  initSvg();
  initInteraction();



  function zoomed() {
    var zoomX = zoom.translate()[0], zoomY = zoom.translate()[1];
  
    //gDot.attr("transform", "translate(" + (50 + zoomX) + "," + zoomY + ")scale(" + zoom.scale() + ")");
    //gDot.selectAll(".deviceAPDot")
    //    .attr("r", 2 / Math.sqrt(zoom.scale()));
    gRect.selectAll(".deviceAPRect")
        .attr("height", 5 / Math.sqrt(zoom.scale()));
    gRect.attr("transform", "translate(" + (20 + zoomX) + "," + zoomY + ")scale(" + zoom.scale() + ")");
    //gLine.attr("transform", "translate(" + (50 + zoomX) + "," + zoomY + ")scale(" + zoom.scale() + ")");
    //gLine.selectAll("deviceVerticalLine")
    //    .style("stroke-width", (1 / zoom.scale()) + "px");  
    gTagLine.attr("transform", "translate(0," + zoomY + ")scale(" + zoom.scale() + ")");
    gTagLine.selectAll(".deviceTag.line")
      .style("stroke-width", (1 / zoom.scale()) + "px");
    gTagText.attr("transform", "translate(0," + zoomY + ")scale(" + zoom.scale() + ")");
    gTagText.selectAll(".deviceTag.text")
      .style("font-size", (0.6 / zoom.scale()) + "em");
    gSeg.attr("transform", "translate(" + (20 + zoomX) + "," + zoomY + ")scale(" + zoom.scale() + ")");
    gSeg.selectAll(".deviceLogin")
      .style("stroke-width", (1 / zoom.scale()) + "px");
    //gYAxis.call(yAxis);
    gXAxis.call(xAxis);
    
    return;
  }

  function initSvg(){
    //var _w = svg.width(), _h = svg.height()-5;
    var _w = svg.w, _h = svg.h - 5;
    //var _w = $(svg.sel).width() - 10, _h = $(svg.sel).height() - 15;

    size = utils.initG(g, _w-15, _h, [0,5,20,0]);
    //timelineSize = utils.initG(gXAxis, _w, 20, [0,5,20,0]);
    x.domain([timeFrom, timeTo]).range([0, size.width]);
    gXAxis
      .attr("class", "x axis")
      .attr("transform", "translate(20," + (size.height+15) + ")")
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
            .on("zoom", zoomed);
    d3.select("#ap-view-svg").call(zoom).call(zoom.event);
    gTagText.call(zoom)
      .on("mousedown.zoom", null)
      .on("touchstart.zoom", null)
      .on("touchmove.zoom", null)
      .on("touchend.zoom", null);

    brush.x(d3.scale.identity().domain([0, leftSVG.w]))
      .y(yScale);
    gTagText
      .call(brush);
    // .selectAll("rect")
    //   .attr("x", 0)
    //   .attr("width", leftSVG.w);

    //gDot.attr("transform", "translate(50,0)scale(1,1)");
    gRect.attr("transform", "translate(20,0)scale(1,1)");
    //gLine.attr("transform", "translate(50,0)scale(1,1)");
    gSeg.attr("transform", "translate(20,0)scale(1,1)");
    gTagLine.attr("transform", "translate(0,0)scale(1,1)");
    //gXAxis.attr("transform",  "translate(0,0)scale(1,1)");

    d3.select("#ap-view-reset-btn").on("click", reset);
    d3.select("#ap-view-zoom-in-btn").on("click", zoomIn);
    d3.select("#ap-view-zoom-out-btn").on("click", zoomOut);
    //console.log(size);
  }

  function reset() {
    initSvg();
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

  function brushstart(p) {
    if (brush.data !== p) {
      gTagText.call(brush.clear());
      brush.y(yScale).data = p;
    }
  }

  function brush(p) {
    var e = brush.extent();
    console.log(e);
    selectedDevices = [];
    gTagText.selectAll(".deviceTag")
      .classed("selected", function(d) {
        var py = yScale(d) + yScale.rangeBand()/2.0 + 2.5;
        if (e[0][1] <= py && py <= e[1][1]) {
          selectedDevices.push(d);
          return true;
        }
        else
          return false;
    });
    console.log(selectedDevices);
  }

  // If the brush is empty, select all circles.
  function brushend() {
    if (brush.empty()) {
    }
    console.log(selectedDevices);
    //EventManager.deviceDeselect(null);
    EventManager.deviceSelect(selectedDevices);
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

  ObserverManager.addListener(ApView);
  ApView.OMListen = function(message, data){
    //console.log(data);
    // if(message == WFV.Message.DeviceSelect){
    //   if (!data.isAdd) return;
    //   console.log(data.device);
    //   deviceList = data.device;
    //   ApView.update();
    // }
    if(message === WFV.Message.DeviceSelect){
      if (!data.isAdd) {selectedDevices = []; }
      return;
    }

    if(message === WFV.Message.ApSelect){
      console.log(data);
      if (!data.isAdd) {
        apList = data.change;
        console.log(apMap);
        apList.forEach(function(d) {
          delete apMap[d];
        });
        console.log(apMap);
        deviceList = [];
        deviceMap = {};
        if (Object.keys(apMap).length > 0) {
          var waitData = Object.keys(apMap).length;
          Object.keys(apMap).forEach(function(d) {
            console.log(d);
            db.macs_by_ap(timeFrom, timeTo, d, function(res) {
              
              // deviceList.concat(res.map(function(p) {
              //   return p.mac;
              // }));
              res.forEach(function(p) {
                if (!(p.mac in deviceMap)) {
                  deviceMap[p.mac] = deviceList.length;
                  deviceList.push(p.mac);
                }
              });
              console.log(deviceList);
              waitData --;
            }); 
          }); 

          while (waitData > 0) {};
          ApView.update(); 
        }
        else {
          console.log(deviceList);
          deviceList = [];
          render(1);
        }
        return;
      }
      else {
        console.log(data.apid);
        apList = data.apid;
        apList.forEach(function(d) {
          apMap[d] = d;
        });
        console.log(apMap);
        //deviceList = [];
        var waitData = apList.length;
        apList.forEach(function(d) {
          console.log(d);
          db.macs_by_ap(timeFrom, timeTo, d, function(res) {
            // deviceList.concat(res.map(function(p) {
            //   return p.mac;
            // }));
            res.forEach(function(p) {
              if (!(p.mac in deviceMap)) {
                deviceMap[p.mac] = deviceList.length;
                deviceList.push(p.mac);
              }
            })
            waitData--;
          }); 
        });
        while (waitData > 0) {};
        ApView.update();
        console.log(deviceList);
      }
    }
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
        return (+tempArray1[1]) - (+tempArray2[1]);
      }
    }
    else {
      return floor1 - floor2;
    }
  }

  ApView.update = function(){


    loginRecords = [];
    var access_data = [];
    apNameMappings = {}, apFloorMappings = {};
    for (var k = 0; k < deviceList.length; k++) {
      access_data.push(get_access_data(deviceList[k], [timeFrom]));
      deviceTotalLoginDuration[deviceList[k]] = 0.0;
      deviceLoginDuration[deviceList[k]] = [];
    }
    access_data.forEach(function(d) {
      d[0].line.forEach(function(p){
        loginRecords.push(p);
      });
    });
    // access_data = access_data.filter(function(d) {
    //   return d[0].lines.length > 0;
    // });

    zoom.x(x);


    yFloorAP = [], nameAPMappings = {};
    for (var ap in apNameMappings) {
      clicked[ap] = false;
      nameAPMappings[apNameMappings[ap]] = ap;
      if (ap in apFloorMappings) continue;
      var tempArray = apNameMappings[ap].split("ap");
      apFloorMappings[ap] = tempArray[0];
      if (tempArray[0] in floorAP) {
        floorAP[tempArray[0]][ap] = apNameMappings[ap];
      }
      else {
        floorAP[tempArray[0]] = {};
        floorAP[tempArray[0]][ap] = apNameMappings[ap]; 
      }
    }
    console.log(access_data);

    // svg.append("g")
    //   .attr("class", "x axis")
    //   .attr("transform", "translate(0," + height + ")")
    //   .call(xAxis);

    //dataset = {};
    //checkInInterval = x(parseTime.parse(checkInIntervalString)) - x(timeFrom);
    checkInInterval = x(checkInIntervalDate) - x(timeFrom);
    console.log(checkInInterval);
    dataset = [];
    var cnt = 0;
    var dataDeviceMappings = {};



    for (var device = 0; device < access_data.length; device ++) {
    //for (var device = 2; device < 4; device ++) {
      tempDataset = access_data[device][0].lines;
      if (tempDataset.length === 0) continue;
      // for (var i = 0; i< tempDataset.length; i++)
      //     tempDataset[i]["device"] = deviceList[device];
      //dataset[deviceList[device]] = [];
      //dataset[deviceList[device]].push({start:tempDataset[0][0], end:tempDataset[0][1], device:deviceList[device]});
      dataset.push({start:tempDataset[0][0], end:tempDataset[0][1], device:deviceList[device]});
      //cnt = 0;
      dataDeviceMappings[cnt++] = device;
      for (var i = 1; i < tempDataset.length; i++) {
        var cur = {start:tempDataset[i][0], end:tempDataset[i][1], device:deviceList[device]}
        //if (x(dataset[cnt][1].date_time) - x(cur[0].date_time) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
        //if (x(dataset[deviceList[device]][cnt-1].end.date_time) - x(cur.start.date_time) > 0.0 || 
        //    cur.start.apid !== dataset[deviceList[device]][cnt-1].end.apid) {
        if (0.0 + x(dataset[cnt-1].end.date_time) - x(cur.start.date_time) > 0.0 || 
            cur.start.apid !== dataset[cnt-1].end.apid || 
            0.0 + x(cur.start.date_time) - x(dataset[cnt-1].end.date_time) > checkInInterval
            ) {
          //dataset[deviceList[device]].push(cur);
          dataset.push(cur);
          dataDeviceMappings[cnt++] = device;
        }
        else {
          //dataset[deviceList[device]][cnt-1].end = cur.end;
          dataset[cnt-1].end = cur.end;
        }
      }
    }

    dataset.forEach(function(d) {
      if (d.start.apid in apMap){
        deviceTotalLoginDuration[d.device] += x(d.end.date_time) - x(d.start.date_time);
        deviceLoginDuration[d.device].push(d);
      }
    });
    console.log(dataset);

    
    // apConnCnt = {};
    // dataset.forEach(function(d, i) {
    //   if (!(d[0].apid in apConnCnt)) {
    //       apConnCnt[apNameMappings[d[0].apid]] = 1;
    //   }
    //   else {
    //      apConnCnt[apNameMappings[d[0].apid]] ++; 
    //   }
    // });

    floorDomain = {};
    apNum = 0;
    apNumMappings = {};
    for (var ap in apNameMappings) {
      floorDomain[apNameMappings[ap]] = ap;
    }
    
    console.log(apNumMappings);

    for (var floor in floorAP) {
      floorDomain[floor] = floor;
    }
    
    //var yHeight = size.height;
    //if (deviceList.length * 8 > yHeight) {
      //yHeight = deviceList.length * 8;
    //}

    //gYAxis.call(yAxis);

    render(1);
  }

  function highlightTrace(apid) {
    gRect.selectAll(".apDeviceRect")
      .style("fill-opacity", 0.1);
    console.log(clicked);
    for (var k in clicked) {
      if (clicked[k]) {
        gRect.selectAll(".apid" + k)
          .style("fill-opacity", 1);    
      }
    }
    
  }
  function dehighlightTrace(apid) {
    gRect.selectAll(".apid" + apid)
      .style("fill-opacity", 0.1);
    var cnt = 0;
    for (var k in clicked) {
      if (clicked[k]) {
        cnt ++;
      }
    }
    if (cnt === 0) {
      gRect.selectAll(".apDeviceRect")
        .style("fill-opacity", 1);   
    }
  }

  function durationSimilarity(a, b) {
    return Math.abs(a.start.date_time - b.start.date_time) + Math.abs(a.end.date_time - b.end.date_time);
  }

  function render(needRemove) {

    var yHeight = deviceList.length * 8;

    for (var ap in floorDomain) {
      apNumMappings[ap] = apNum++;
    }

  
    console.log(deviceList);
    // var yDomain = deviceList.sort(function(a, b){
    //                 return deviceTotalLoginDuration[a] - deviceTotalLoginDuration[b];
    //               });
    var yDomain = deviceList;
    console.log(yDomain);
    yScale.domain(yDomain)
          .rangeBands([0, yHeight], 0.1);
    
    if (needRemove === 1) {
      //gTag.selectAll("g").remove();
      gTagText.selectAll(".deviceTag").remove();
      gTagLine.selectAll(".deviceTag").remove();
      gRect.selectAll(".apDeviceRect").remove();
      //gDot.selectAll(".apDeviceDot").remove();
      gSeg.selectAll(".deviceLogin").remove();
      d3.select("#ap-view-wrapper").selectAll(".remove").remove();

      // var tooltip = d3.select("#ap-view-wrapper")
      //     .append("div")
      //     .attr("class", "remove")
      //     .style("position", "absolute")
      //     .style("z-index", "20")
      //     .style("visibility", "hidden");
          // .style("top", "10px")
          // .style("left", "100px");

      var vertical = d3.select("#ap-view-wrapper")
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

      d3.select("#ap-view-wrapper")
        .on("mousemove", function(){  
          var mousex = d3.mouse(this)[0] + 2, mousey = d3.mouse(this)[1];
          if (mousex < 50 || mousex > svg.w + 5) {
            $("#ap-view-curtime-tip").hide();
            vertical.style("visibility", "hidden");
            return;
          }
          vertical.style("left", mousex + "px" )
            .style("visibility", "visible");
          var timePoint = x.invert(mousex - 50);
          // tooltip.html( "<p>" + d3.time.format("%c")(timePoint) + "</p>" ).style("visibility", "visible");
          // tooltip.style("top", mousey + "px")
          //   .style("left", mousex + "px");

          $("#ap-view-curtime-tip").html(d3.time.format("%c")(timePoint));
          $("#ap-view-curtime-tip").css({
            "left": mousex + 20,
            "top": size.height
          });
          $("#ap-view-curtime-tip").show();
        })
        .on("mouseout", function(){  
          $("#ap-view-curtime-tip").hide();
          vertical.style("visibility", "hidden");
          // mousex = d3.mouse(this);
          // mousex = mousex[0] + 5;
          // if (mousex < 55) mousex = 55;
          // if (mousex > svg.w + 5) mousex = svg.w + 5;
          // vertical.style("left", mousex + "px")
        });

      // var gTags = gTag.selectAll(".deviceTag")
      //   //.data(Object.keys(dataset))
      //   .data(yScale.domain())
      //   .enter()
      //   .append("g")
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
      gTagLine
        .selectAll(".deviceTag")
        //.data(Object.keys(dataset))
        .data(yScale.domain())
        .enter()
        .append("line")
        .attr("class", "deviceTag line")
        .attr("transform", "translate(0,0)scale(1,1)")
        .attr("x1", function(d) {
            return 0;
        })
        .attr("x2", function(d) {
          return size.width + 50;
        })
        .attr("y1", function(d) {
          return yScale(d) + yScale.rangeBand()/2.0;
        })
        .attr("y2", function(d) {
          return yScale(d) + yScale.rangeBand()/2.0;
        });
      gTagText.selectAll(".deviceTag")
        //.data(Object.keys(dataset))
        .data(yScale.domain())
        .enter()
        .append("text")
        .attr("class", "deviceTag text")
          .attr("transform", "translate(0,0)scale(1,1)")
        .attr("x", 0)
        .attr("y", function(d){
          return yScale(d) + yScale.rangeBand()/2.0 + 2.5;
        })
        .style("font-size", (0.6 / zoom.scale()) + "em")
        .text(function(d) {
          return db.macid_by_mac(d);
        });

      // var gDeviceRect = gRect.selectAll(".apDeviceG")
      //   .data(Object.keys(dataset))
      //   .enter()
      //   .append("g")
      //   .attr("class", "apDeviceG");
      // console.log(gDeviceRect);
      // gDeviceRect.selectAll(".apDeviceRect")
      //   .data(function(d) {
      //      console.log(dataset[d]);
      //     return dataset[d];
      //   })
      //   .enter()
      //   .append("rect")
      //   .attr("class", function(d) {
      //     return "apDeviceRect apid" + d.start.apid;
      //   })
      //   // .attr("fill", function(d) {
      //   //   var floor = +apFloorMappings[d[0].apid].substring(1);
      //   //   return ColorScheme.floor(floor);
      //   // })
      //   .attr("x", function(d){
      //       return x(d.start.date_time);
      //     })
      //   .attr("y", function(d){
      //     return yScale(d.device) - yScale.rangeBand()/2.0 - 2.5;
      //   })
      //   .attr("width", function(d){
      //     return x(d.end.date_time) - x(d.start.date_time);
      //   })
      //   .attr("height", 5)
      //   .on("click", function(d, i) {
      //     // if (clicked[d["device"]]) {
      //     //   dehighlightTrace(d["device"]);
      //     //   clicked[d["device"]] = false;
      //     // }
      //     // else {
      //     //   highlightTrace(d["device"]);
      //     //   clicked[d["device"]] = true;
      //     // }
      //   })
      //   .on("mouseover", function(d, i) {
      //   });
      // //


      console.log(dataset.filter(function(d){
          return d.device === "dcf2534b21" && d.start.apid in apMap;
        }));
      gRect.selectAll(".apDeviceRect")
        .data(dataset.filter(function(d){
          return d.start.apid in apMap;
        }))
        .enter()
        .append("rect")
        .attr("class", function(d) {
          return "apDeviceRect apid" + d.start.apid;
        })
        .attr("transform", "translate(0,0)scale(1,1)")
        .attr("fill", function(d) {
          var floor = +apFloorMappings[d.start.apid].substring(1);
          return ColorScheme.floor(floor);
        })
        .attr("x", function(d){
            return x(d.start.date_time);
          })
        .attr("y", function(d){
          return yScale(d.device) + yScale.rangeBand()/2.0 - 2.5;
        })
        .attr("width", function(d){
          return x(d.end.date_time) - x(d.start.date_time);
        })
        .attr("height", 5)
        .on("click", function(d, i) {
          // if (clicked[d.start.apid]) {
          //   clicked[d.start.apid] = false;
          //   dehighlightTrace(d.start.apid);
          // }
          // else {
          //   clicked[d.start.apid] = true;
          //   highlightTrace(d.start.apid);
          // }
          var mousex = d3.mouse(this)[0] + 2;
          var timePoint = x.invert(mousex);
          console.log(timePoint);
          var curDuration = {};
          deviceList.forEach(function(p) {
            var i1 = -1;
            var minDist = Number.MAX_VALUE;
            for (var k = 0; k < deviceLoginDuration[p].length; k++) {
              var q = deviceLoginDuration[p][k];
              var val = durationSimilarity(d, q);
              if (minDist > val) {
                minDist = val;
                i1 = k;
              }
              // if (q.start.date_time <= timePoint && q.end.date_time >= timePoint && q.start.apid === d.start.apid) {
              //   i1 = k;
              //   break;
              // }
            }
            if (i1 !== -1) {
              console.log(p);
              //curDuration[p] = deviceLoginDuration[p][i1].end.date_time - deviceLoginDuration[p][i1].start.date_time;
              //curDuration[p] = deviceLoginDuration[p][i1];
              curDuration[p] = minDist;
            }
          });
          //curDuration[d.device] = Number.MAX_VALUE;
          //curDuration[d.device] = d;
          curDuration[d.device] = 0;
          console.log(curDuration);
          var maxDuration = (timeTo - timeFrom) * 100;
          //var bisect = d3.bisector(function(p) { return p.start.date_time; }).right;
          deviceList = deviceList.sort(function(b, a) {
            //var i1 = bisect(deviceLoginDuration[a], timePoint), i2 = bisect(deviceLoginDuration[b], timePoint);
            //if (a in curDuration && b in curDuration) {
              return curDuration[b] - curDuration[a];
              //return durationSimilarity(curDuration[b], d) - durationSimilarity(curDuration[a], d);
            //}
            // else {
            //   if (a in curDuration)
            //     return 1;
            //   else
            //     if (b in curDuration)
            //       return -1;
            //     else return 0;
            // }
          });
          var yDomain = deviceList;
          console.log(yDomain);
          yScale.domain(yDomain);
          reset();
        })
        .on("mousemove", function(d, i) {
          d3.event.stopPropagation();
          var mousex = d3.mouse(this)[0] + 2, mousey = d3.mouse(this)[1];
          
          vertical.style("left", (mousex + 50) + "px" )
            .style("visibility", "visible");
          var timePoint = x.invert(mousex);
          var timeLasted = d.end.date_time - d.start.date_time;
          var descStr = "Device no." + db.macid_by_mac(d.device) + "<br />" 
              + "Mac " + d.device + "<br />" 
              + apNameMappings[d.start.apid] + "<br />"
              + "Started at" + d3.time.format("%c")(d.start.date_time) + "<br />"
              + "Lasted " + Math.round(timeLasted / 60000) + " mins" + "<br />";
          console.log(descStr);
          $("#ap-view-login-description").html(descStr);
          $("#ap-view-login-description").css({
            "left": mousex + 70,
            "top": mousey
          });
          $("#ap-view-login-description").show();

          $("#ap-view-curtime-tip").html(d3.time.format("%c")(timePoint));
          $("#ap-view-curtime-tip").css({
            "left": mousex + 70,
            "top": size.height
          });
          $("#ap-view-curtime-tip").show();
        })
        .on("mouseout", function(){  
          $("#ap-view-login-description").hide();
          $("#ap-view-curtime-tip").hide();
          vertical.style("visibility", "hidden");

        });

      console.log(loginRecords);
      gSeg.selectAll(".deviceLogin")
        .data(loginRecords.filter(function(d) {
          return d.apid in apMap;
        }))
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
          return yScale(d.mac) + yScale.rangeBand()/2.0 - 3.5;
        })
        .attr("y2", function(d) {
          return yScale(d.mac) + yScale.rangeBand()/2.0 + 3.5;
        });
    }
    else {
      gTagLine.selectAll(".deviceTag.line")
        .attr("x1", function(d) {
            return 0;
        })
        .attr("x2", function(d) {
          return size.width + 50;
        })
        .attr("y1", function(d) {
          return yScale(d) + yScale.rangeBand()/2.0;
        })
        .attr("y2", function(d) {
          return yScale(d) + yScale.rangeBand()/2.0;
        });
      gTagText.selectAll(".deviceTag.text")
        .attr("x", 0)
        .attr("y", function(d){
          return yScale(d) + yScale.rangeBand()/2.0 + 2.5;
        })
        .style("font-size", (0.6 / zoom.scale()) + "em");

      gRect.selectAll(".apDeviceRect")
        .attr("x", function(d){
            return x(d.start.date_time);
          })
        .attr("y", function(d){
          return yScale(d.device) + yScale.rangeBand()/2.0 - 2.5;
        })
        .attr("width", function(d){
          return x(d.end.date_time) - x(d.start.date_time);
        })
        .attr("height", 5 / Math.sqrt(zoom.scale()));
       
    }

  }
  $(window).resize(function(e){
    svg = utils.resizeSVG(svg);
    initSvg();
    render(0);
  });
    
  return ApView;
}


