var db = new WFV_DB(new Date(2013,08,02), new Date(2013,08,03));
var access_data;
var apNameMappings = {};
var apFloorMappings = {};
var apConnCnt = {};
var floorAP = {};

function get_access_data(mac, dates){
  var access_data = [];
  var len = dates.length;
  for(var i = 0; i < len; i++){
    var date = dates[i]
    var next_date = new Date(date).setDate(date.getDate() +1);
    var path = db.path_by_mac(mac, date, next_date);
    console.log(path)
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


db.init(function(){
  var dates = [new Date(2013,08,02)];
  //access_data = get_access_data("ac02bf41ce", dates)
  access_data = [];
  access_data.push(get_access_data("5dfab8ca93", dates));
  access_data.push(get_access_data("f8e481d35f", dates));
  access_data.push(get_access_data("6f7da95740", dates));
  access_data.push(get_access_data("95423c652f", dates));
  access_data.push(get_access_data("b5ad9c2525", dates));
  access_data.push(get_access_data("98e35d88ce", dates));
  access_data.push(get_access_data("07a2a4e391", dates));
  access_data.push(get_access_data("4dd99a5369", dates));
  access_data.push(get_access_data("8bb1e41237", dates));
  access_data.push(get_access_data("5f44f70682", dates));
  access_data.push(get_access_data("964291cee6", dates));

  console.log(access_data);
  device_view(access_data);
});



function device_view(access_data){
  var margin = {top: 50, right: 20, bottom: 30, left: 100},
    width = 1100 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var parseDate = d3.time.format("%H:%M").parse;
  var xformatDate = d3.time.format("%H:%M");
  var yformatDate = d3.time.format("%x");

  var dateStr = [];

  // access_data.forEach(function(path){
  //     path.forEach(function(d){
  //     //d.time = parseDate(d.date_time);
  //     d.date = d.date_time.to_date();
  //     // console.log(d.date)
  //   });
  // });

  // access_data.forEach(function(d){
  //   dateStr.push(d[0].date)
  // })

  // var x = d3.scale.linear()
  //     .range([0, width]);
  var x = d3.time.scale()
            .range([0, width]);

  // var y = d3.scale.ordinal()
  //     // .range([0, height])
  //     .rangeBands([0, height], .1);
  var yFloor = d3.scale.ordinal()
      .rangeBands([0, height], .1);


  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");
      // .tickFormat(function(d) {
      //   return xformatDate(new Date(d - 8*60*60*1000))
      // })

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      // .tickFormat(function(d) {
      //   return yformatDate(new Date(d))
      // })
      // .tickFormat(function(d) {
        // console.log(d)
        // return d
      // })
      .ticks(2);

  var svg = d3.select("body").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 


  //x.domain([0, 2*60*60*1000]);
  //x.domain([0, 24*60*60*1000]);
  //x.domain([new Date('2013-09-02'), new Date('2013-09-03')]);
  x.domain([new Date(2013, 08, 02, 00, 00, 00, 00), new Date(2013, 08, 03, 00, 00, 00, 00)]);

  // y.domain(access_data[0].line.map(function(d) {
  //   // console.log(d[0].date_time.to_date_str()); 
  //   // console.log(d.apid)  
  //   return d.apid;
  // }));
  // var yDomain = d3.extent(access_data, function(d) {return d[0].date})
  // var domainMin = new Date(new Date(yDomain[0]).getTime()-86400000)
  // var domainMax = new Date(new Date(yDomain[1]).getTime()+86400000)
  // yyy = y;
  // console.log(domainMin, domainMax)
  // y.domain([new Date(domainMin), new Date(domainMax)])
  // console.log(y.domain())
  // console.log(y("2013-09-04"))

  yFloorAP = [];
  for (var ap in apNameMappings) {
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
  console.log(apFloorMappings);
  console.log(floorAP);



  var line = d3.svg.line()
      .x(function(d){
        // var h = d.date_time.getHours();
        // var m = d.date_time.getMinutes();
        // var s = d.date_time.getSeconds();
        // var ml = (h*3600+m*60+s)*1000;
        // return x(ml)
        return x(d.date_time);
      })
      .y(function(d){
        // var r = y(d.date_time.to_date_str());
        // console.log(d.date_time.to_date_str())
        // console.log(r)
        // r = y(new Date(d.date))
        // console.log(r, d.date, y.domain())
        // return r;
        //return y(d.apid)+y.rangeBand()/2.0;
        return height - (y(d.apid)+y.rangeBand()/2.0);
      });


  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  // svg.append("g")
  //   .attr("class", "y axis")
  //   .call(yAxis);

  // svg.selectAll(".line")
  //   .data(access_data[0].lines)
  //   .enter().append("path")
  //   .attr("class", "line")
  //   .attr("d", line);


  // var tempDataset = access_data[0].lines.filter(function(d) {
  //     var h0 = d[0].date_time.getHours();
  //     var m0 = d[0].date_time.getMinutes();
  //     var s0 = d[0].date_time.getSeconds();
  //     var h1 = d[1].date_time.getHours();
  //     var m1 = d[1].date_time.getMinutes();
  //     var s1 = d[1].date_time.getSeconds();
      
  //     var ml0 = (h0*3600+m0*60+s0)*1000, ml1 = (h1*3600+m1*60+s1)*1000;
  //     return true;
  //     //return x(ml1) - x(ml0) > 2.5;
  // });
  var dataset = [], cnt = 0;

  // dataset.push(tempDataset[0]);
  // for (var i = 1; i < tempDataset.length; i++) {
  //   var cur = tempDataset[i];
  //   var h0 = dataset[cnt][1].date_time.getHours();
  //   var m0 = dataset[cnt][1].date_time.getMinutes();
  //   var s0 = dataset[cnt][1].date_time.getSeconds();
  //   var h1 = cur[0].date_time.getHours();
  //   var m1 = cur[0].date_time.getMinutes();
  //   var s1 = cur[0].date_time.getSeconds();
  //   var ml0 = (h0*3600+m0*60+s0)*1000, ml1 = (h1*3600+m1*60+s1)*1000;
  //   //if (x(ml1) - x(ml0) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
  //   if (x(dataset[cnt][1].date_time) - x(cur[0].date_time) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
  //     dataset.push(cur);
  //     cnt++;
  //   }
  //   else {
  //     dataset[cnt][1] = cur[1];
  //   }
  // }

  var dataDeviceMappings = {};

  for (var device = 0; device < access_data.length; device ++) {

    tempDataset = access_data[device][0].lines;
    dataset.push(tempDataset[0]);
    dataDeviceMappings[cnt++] = device;
    for (var i = 1; i < tempDataset.length; i++) {
      var cur = tempDataset[i];
      // var h0 = dataset[cnt][1].date_time.getHours();
      // var m0 = dataset[cnt][1].date_time.getMinutes();
      // var s0 = dataset[cnt][1].date_time.getSeconds();
      // var h1 = cur[0].date_time.getHours();
      // var m1 = cur[0].date_time.getMinutes();
      // var s1 = cur[0].date_time.getSeconds();
      // var ml0 = (h0*3600+m0*60+s0)*1000, ml1 = (h1*3600+m1*60+s1)*1000;
      //if (x(dataset[cnt][1].date_time) - x(cur[0].date_time) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
        if (x(dataset[cnt-1][1].date_time) - x(cur[0].date_time) > 0.0 || cur[0].apid != dataset[cnt-1][1].apid) {
        dataset.push(cur);
        dataDeviceMappings[cnt++] = device;
      }
      else {
        dataset[cnt-1][1] = cur[1];
      }
    }
  }
  

  console.log(dataset);
  dataset.forEach(function(d) {
    if (!(d[0].apid in apConnCnt)) {
        apConnCnt[d[0].apid] = 1;
    }
    else {
       apConnCnt[d[0].apid] ++; 
    }
  });

  
  console.log(apConnCnt);
  var floorDomain = {};
  for (var ap in apNameMappings) {
    //floorDomain[apNameMappings[ap]] = apNameMappings[ap];
    floorDomain[apNameMappings[ap]] = ap;
  }
  
  // y.domain(Object.keys(apFloorMappings).filter(function(d) {
  //   return apConnCnt[d] > 0;
  // }));
  for (var floor in floorAP) {
    floorDomain[floor] = floor;
  }
  yFloor.domain(Object.keys(floorDomain).sort());
  console.log(floorDomain);
  console.log(yFloor.domain());

  for (var floor in floorAP) {
    yFloorAP[floor] = d3.scale.ordinal()
                        .rangeBands([0, height * Object.keys(floorAP[floor]).length / Object.keys(floorDomain).length], .1);
    yFloorAP[floor].domain(Object.keys(floorAP[floor]));
  }
  console.log(floorAP);
  console.log(yFloorAP);

  function y(apid) {
    var floor = apFloorMappings[apid];

    var floorOffset = yFloor(floor);
    var apOffset = yFloorAP[floor](apid);
    //console.log(floor + ", " + floorOffset + ", " + apOffset);
    return height - (floorOffset + apOffset); 
  }

  var apBarSvg = svg.selectAll(".apTag")
    .data(yFloor.domain().filter(function(d) {
      return d.length > 4;
      //return true;
    }))
    .enter()
    .append("g");
  apBarSvg
    .attr("class", "apTag")
    .append("rect")
    .attr("x", 0)
    .attr("y", function(d){
        // var r = y(d.date_time.to_date_str());
        // console.log(d.date_time.to_date_str())
        // console.log(r)
        // r = y(new Date(d.date))
        // console.log(r, d.date, y.domain())
        // return r;
        //return y(d[0].apid)+y.rangeBand()/2.0 - 2.5;
        //console.log(height - (yFloor(d)+yFloor.rangeBand()/2.0 + 2.5));
        //return height - (yFloor(d)+yFloor.rangeBand()/2.0 + 2.5);
        return y(floorDomain[d]) - yFloor.rangeBand()/2.0 - 2.5;
      })
    .attr("width", width)
    .attr("height", 5)
    .style("fill", "grey")
    .style("opacity", 0.0);
  apBarSvg
    .append("text")
    .attr("class", "apTag")
    .attr("x", -40)
    .attr("y", function(d){
      //return height - (yFloor(d)+yFloor.rangeBand()/2.0 - 2.5);
        return y(floorDomain[d]) - yFloor.rangeBand()/2.0 + 2.5;
     })
    .text(function(d) {
      //console.log(d);
      return d;
      //return apNameMappings[d];
    });
 

  svg.selectAll(".rect")
    .data(dataset)
    .enter().append("rect")
    .attr("class", "rect")
    .attr("x", function(d){
        var h = d[0].date_time.getHours();
        var m = d[0].date_time.getMinutes();
        var s = d[0].date_time.getSeconds();
        var ml = (h*3600+m*60+s)*1000;
        //return x(ml);
        return x(d[0].date_time);
      })
    .attr("y", function(d){
        // var r = y(d.date_time.to_date_str());
        // console.log(d.date_time.to_date_str())
        // console.log(r)
        // r = y(new Date(d.date))
        // console.log(r, d.date, y.domain())
        // return r;
        //return y(d[0].apid)+y.rangeBand()/2.0 - 2.5;
        //return height - (y(d[0].apid)+y.rangeBand()/2.0 + 2.5);
        return y(d[0].apid) - yFloor.rangeBand()/2.0 - 2.5;
      })
    .attr("width", function(d){
        var h0 = d[0].date_time.getHours();
        var m0 = d[0].date_time.getMinutes();
        var s0 = d[0].date_time.getSeconds();
        var h1 = d[1].date_time.getHours();
        var m1 = d[1].date_time.getMinutes();
        var s1 = d[1].date_time.getSeconds();
        
        var ml0 = (h0*3600+m0*60+s0)*1000, ml1 = (h1*3600+m1*60+s1)*1000;
        //return x(ml1) - x(ml0);
        return x(d[1].date_time) - x(d[0].date_time);
    })
    .attr("height", 5)
    .attr("fill", function(d) {
      return "black";
    })
    .style("opacity", 0.1)
    .style("stroke", "white")
    .style("stroke-width", "2px")
    ;

  svg.selectAll(".dot")
    //.data(Array.prototype.concat.apply([],access_data[0].line))
    .data(Array.prototype.concat.apply([], dataset))
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 2.5)
    //.style("fill", "#8080FF")
    .style("fill", function(d) {
      //d.
    })
    .attr("cx", function(d){
      // console.log(d)
        var h = d.date_time.getHours();
        var m = d.date_time.getMinutes();
        var s = d.date_time.getSeconds();
        var ml = (h*3600+m*60+s)*1000;
        //return x(ml)
        return x(d.date_time);
      })
    .attr("cy", function(d) {
      //return y(d.apid)+y.rangeBand()/2.0; 
      //return height - (y(d.apid)+y.rangeBand()/2.0); 
      return y(d.apid) - yFloor.rangeBand()/2.0;

    });

    var lineSet = [];
    for (var i = 1; i < dataset.length; i++) {
      if //(apFloorMappings[dataset[i-1][1].apid] === apFloorMappings[dataset[i][0].apid] ||
          (x(dataset[i-1][1].date_time) > x(dataset[i][0].date_time)) continue;
      lineSet.push([dataset[i-1][1], dataset[i][0]]);
    }
    console.log(lineSet);
    svg.selectAll(".verticalLine")
      .data(lineSet)
      .enter().append("line")
      .attr("class", "verticalLine")
      //.style("stroke-dasharray", "1,1")
      .attr("x1", function(d) {
        var h0 = d[0].date_time.getHours();
        var m0 = d[0].date_time.getMinutes();
        var s0 = d[0].date_time.getSeconds();
        //return x((h0*3600+m0*60+s0)*1000);
        return x(d[0].date_time);
      })
      .attr("x2", function(d) {
        var h1 = d[1].date_time.getHours();
        var m1 = d[1].date_time.getMinutes();
        var s1 = d[1].date_time.getSeconds();
        //return x((h1*3600+m1*60+s1)*1000);
        return x(d[1].date_time);
      })
      .attr("y1", function(d) {
        //return height - (y(d[0].apid)+y.rangeBand()/2.0 + 2.5);
        return y(d[0].apid) - yFloor.rangeBand()/2.0 - 2.5;
      })
      .attr("y2", function(d) {
        //return height - (y(d[1].apid)+y.rangeBand()/2.0 + 2.5);
        return y(d[1].apid) - yFloor.rangeBand()/2.0 - 2.5;
      })
      .attr("stroke", "steelblue");
}



