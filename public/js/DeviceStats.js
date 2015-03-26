function DeviceFeature(mac, logins, durations, totalDuration, apDurations){
  this.mac = mac;
  this.logins = logins;
  this.durations = durations;
  this.totalDuration = totalDuration;
  this.apDurations = apDurations;
  this.recordCount = null;
  this.accessedAPCount = null;
  this.avgDuration = null;
  this.avgAPDuration = null;
  this.init();
}

DeviceFeature.prototype.init = function(){
  var that = this;
  that.recordCount = that.logins.length;
  that.accessedAPCount = 0;
  that.avgDuration = 0, that.avgAPDuration = {};
  that.durations.forEach(function(d) {
    that.avgDuration += d.end.date_time - d.start.date_time;
  });
  if (that.durations.length)
    that.avgDuration /= that.durations.length;
  Object.keys(that.apDurations).forEach(function(d) {
    that.avgAPDuration[d] = 0;
    that.apDurations[d].forEach(function(p) {
      that.avgAPDuration[d] += p.end.date_time - p.start.date_time;  
    });
    if (that.apDurations[d].length)
      that.avgAPDuration[d] /= that.apDurations[d].length;
  });
  curApMap = {};
  that.logins.forEach(function(d) {
    if (!(d.apid in curApMap)) {
      curApMap[d.apid] = d.apid;
      that.accessedAPCount ++;
    }
  });
}


WifiVis.DeviceStats = function(){
  function DeviceStats(){}

  var loginRecords, loginPeriods;
  var apLoginRecords, apLoginPeriods;
  var deviceFeatures = ["", "ttApNum", "avgStayTime"];
  var deviceList = [], deviceMap = {};
  var apList = [], apMap = {};
  var apNameMappings = {};

  var deviceLoginRecords;
  var deviceTotalLoginDuration = {};
  var deviceLoginDuration = {};
  var deviceAPLoginDuration = {};

  var checkInIntervalString = "2013-09-02 00:00:30";
  var checkInIntervalDate = new Date(checkInIntervalString);
  var checkInInterval;

  var devicePCP = {}, devicePCPs;

  var svg = utils.initSVG("#device-pcp-svg", [10]);
  var width = svg.w, height = svg.h;

  var size, timelineSize;

  var parseDate = d3.time.format("%H:%M").parse;
  var xformatDate = d3.time.format("%H:%M");
  var FloorAPformatDate = d3.time.format("%x");
  var parseTime = d3.time.format("%y-%m-%d %H:%M:%S");

  d3.select("#device-pcp-select-btn").on("click", selectDevices);

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

  ObserverManager.addListener(DeviceStats);
  DeviceStats.OMListen = function(message, data){
    
    if(message === WFV.Message.DeviceSelect){
      //if (!data.isAdd) {brushedDevices = []; }

      return;
    }

    if(message === WFV.Message.ApSelect){
      if (!data.isAdd) {
        apList = data.change;

        apList.forEach(function(d) {
          delete apMap[d];
        });

        deviceList = [];
        deviceMap = {};
        if (Object.keys(apMap).length > 0) {
          var waitData = Object.keys(apMap).length;
          Object.keys(apMap).forEach(function(d) {
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
              waitData --;
            }); 
          }); 

          while (waitData > 0) {};
          DeviceStats.update(); 
        }
        else {
          deviceList = [];
          render(1);
        }
        return;
      }
      else {
        apList = data.apid;
        apList.forEach(function(d) {
          apMap[d] = d;
        });
        //deviceList = [];
        var waitData = apList.length;
        apList.forEach(function(d) {
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
        DeviceStats.update();
      }
    }
  }


  DeviceStats.update = function(){

    loginRecords = [];
    var access_data = [];
    apNameMappings = {}, apFloorMappings = {};
    deviceLoginRecords = {};
    deviceTotalLoginDuration = {};
    deviceLoginDuration = {};
    deviceAPLoginDuration = {};
    for (var k = 0; k < deviceList.length; k++) {
      access_data.push(get_access_data(deviceList[k], [timeFrom]));
      deviceLoginRecords[deviceList[k]] = [];
      deviceTotalLoginDuration[deviceList[k]] = 0.0;
      deviceLoginDuration[deviceList[k]] = [];
      deviceAPLoginDuration[deviceList[k]] = {};
      for (var j = 0; j < apList.length; j ++) {
        deviceAPLoginDuration[deviceList[k]][apList[j]] = [];
      }
    }
    access_data.forEach(function(d) {
      //console.log(d[0].line);
      d[0].line
        .forEach(function(p){
          loginRecords.push(p);
          deviceLoginRecords[p.mac].push(p);
        });
    });

    checkInInterval = checkInIntervalDate - timeFrom;
    dataset = [];
    var cnt = 0;
    var dataDeviceMappings = {};

    for (var device = 0; device < access_data.length; device ++) {
      tempDataset = access_data[device][0].lines;
      if (tempDataset.length === 0) continue;
      dataset.push({start:tempDataset[0][0], end:tempDataset[0][1], device:deviceList[device]});
      //cnt = 0;
      dataDeviceMappings[cnt++] = device;
      for (var i = 1; i < tempDataset.length; i++) {
        var cur = {start:tempDataset[i][0], end:tempDataset[i][1], device:deviceList[device]}
        //if (x(dataset[cnt][1].date_time) - x(cur[0].date_time) > 5.0 || cur[0].apid != dataset[cnt][1].apid) {
        //if (x(dataset[deviceList[device]][cnt-1].end.date_time) - x(cur.start.date_time) > 0.0 || 
        //    cur.start.apid !== dataset[deviceList[device]][cnt-1].end.apid) {
        if (dataset[cnt-1].end.date_time - cur.start.date_time > 0 || 
            cur.start.apid !== dataset[cnt-1].end.apid || 
            cur.start.date_time - dataset[cnt-1].end.date_time > checkInInterval
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
      deviceTotalLoginDuration[d.device] += d.end.date_time - d.start.date_time;
      deviceLoginDuration[d.device].push(d);
      if (d.start.apid in apMap){
        if (d.start.apid in deviceAPLoginDuration[d.device]) {
          deviceAPLoginDuration[d.device][d.start.apid].push(d);
        }
        else {
          deviceAPLoginDuration[d.device][d.start.apid] = [d]; 
        }
      }
    });

    console.log(loginRecords);
    console.log(deviceLoginRecords);
    console.log(deviceLoginDuration);
    render(1);
  }


  function render(needRemove) {
    var svg = d3.select("#device-pcp-svg");
    if (needRemove) {
      svg.selectAll("g").remove();
    }
    
    devicePCPs = deviceList.map(function(d, i){
      console.log(d);
      console.log(deviceLoginRecords[d]);
      var fts_device = new DeviceFeature(d, deviceLoginRecords[d], deviceLoginDuration[d], deviceTotalLoginDuration[d], deviceAPLoginDuration[d]);
      var res = {};
      res["macid"] = db.macid_by_mac(fts_device.mac),
      res["login count"] = fts_device.recordCount,
      res["acsed ap num"] = fts_device.accessedAPCount,
      res["avg stay time"] = fts_device.avgDuration / 60000;
      Object.keys(apMap).forEach(function(p, j){
        res["avg time@" + apNameMappings[p]] = fts_device.avgAPDuration[p] / 60000;
      });
      return res;
    });
    console.log(devicePCPs);  

    devicePCP = PCP.init(svg, {pos: [70, 30], size: [width, height]}, devicePCPs);
  }

  function selectDevices() {
    console.log(devicePCP.getBrush());
    EventManager.deviceDeselect(null, "DeviceStats");
    EventManager.deviceSelect(devicePCP.getBrush().map(function(d) {
      return deviceList[d];
    }), "DeviceStats");
  }
    
  return DeviceStats;
}

