var db = new WFV_DB(new Date(2013,08,02), new Date(2013,08,4));
var access_data;

function get_access_data(mac, dates){
  var access_data = [];
  var len = dates.length;
  for(var i = 0; i < len; i++){
    var date = dates[i]
    var next_date = new Date(date).setDate(date.getDate() +1);
    var path = db.path_by_mac(mac, date, next_date);
    path = path.map(function(r,i){
      if(i == 0 || r.apid != path[i-1].apid) return r;
      return null;
    }).filter(function(d){return d!=null})
    access_data.push(path);
  }
  return access_data;
}


db.init(function(){
  var dates = [new Date(2013,08,02), new Date(2013,08,04)];
  access_data = get_access_data("ac02bf41ce", dates)
  // console.log(access_data);
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

  access_data.forEach(function(path){
      path.forEach(function(d){
      //d.time = parseDate(d.date_time);
      d.date = d.date_time.to_date();
      // console.log(d.date)
    });
  });

  access_data.forEach(function(d){
    dateStr.push(d[0].date)
  })

  var x = d3.scale.linear()
      .range([0, width]);

  var y = d3.scale.ordinal()
      // .range([0, height])
      .rangeBands([0, height], .1);


  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom")
      .tickFormat(function(d) {
        return xformatDate(new Date(d - 8*60*60*1000))
      })
      .ticks(5);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(function(d) {
        // console.log(d.date)
        return yformatDate(new Date(d))
      })
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
 


  x.domain([0, 24*60*60*1000]);
  y.domain(access_data.map(function(d) {
    // console.log(d[0].date_time.to_date_str());   
    return d[0].date
  }));
  // var yDomain = d3.extent(access_data, function(d) {return d[0].date})
  // var domainMin = new Date(new Date(yDomain[0]).getTime()-86400000)
  // var domainMax = new Date(new Date(yDomain[1]).getTime()+86400000)
  // yyy = y;
  // console.log(domainMin, domainMax)
  // y.domain([new Date(domainMin), new Date(domainMax)])
  // console.log(y.domain())
  // console.log(y("2013-09-04"))

  var line = d3.svg.line()
      .x(function(d){
        var h = d.date_time.getHours();
        var m = d.date_time.getMinutes();
        var s = d.date_time.getSeconds();
        var ml = (h*3600+m*60+s)*1000;
        return x(ml)
      })
      .y(function(d){
        // var r = y(d.date_time.to_date_str());
        // console.log(d.date_time.to_date_str())
        // console.log(r)
        // r = y(new Date(d.date))
        // console.log(r, d.date, y.domain())
        // return r;
        return y(d.date)+y.rangeBand()/2.0
      });


  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  svg.selectAll(".line")
    .data(access_data)
    .enter().append("path")
    .attr("class", "line")
    .attr("d", line);

  svg.selectAll(".dot")
    .data(Array.prototype.concat.apply([],access_data))
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 2.5)
    .attr("cx", function(d){
      // console.log(d)
        var h = d.date_time.getHours();
        var m = d.date_time.getMinutes();
        var s = d.date_time.getSeconds();
        var ml = (h*3600+m*60+s)*1000;
        return x(ml)
      })
    .attr("cy", function(d) {return y(d.date)+y.rangeBand()/2.0; })
}
