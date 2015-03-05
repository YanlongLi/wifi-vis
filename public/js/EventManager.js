(function(){
    var EventManager = {};

    var floorSelectdList = [],
        floorHoveredList = [],
        apSelectdList = [],
        apHoveredList = [],
        deviceSelectdList = [],
        deviceHoveredList = [];       

    EventManager.floorChange = function(floor) {
        ObserverManager.post(WFV.Message.FloorChange, {floor:floor});        
    }

    EventManager.floorSelect = function(list) {
        floorSelectdList = _.union(floorSelectdList, list);
        ObserverManager.post(WFV.Message.FloorSelect, 
            {floor:floorSelectdList, change:list, isAdd: true}
        );
    }
    EventManager.floorDeSelect = function(list) {
        if (list == null) {
            list = floorSelectdList;
            floorSelectdList = []; 
        } else {
            floorSelectdList = _.difference(floorSelectdList, list);
        }
        ObserverManager.post(WFV.Message.FloorSelect, 
            {floor:floorSelectdList, change:list, isAdd: false}
        );
    }
    EventManager.floorHover = function(list) {
        floorHoveredList = _.union(floorHoveredList, list);
        ObserverManager.post(WFV.Message.FloorHover, 
            {floor:floorHoveredList, change:list, isAdd: true}
        );        
    }
    EventManager.floorDehover = function(list) {
        if (list == null) {
            list = floorHoveredList;
            floorHoveredList = [];
        } else
            floorHoveredList = _.difference(floorHoveredList, list);
        ObserverManager.post(WFV.Message.FloorHover, 
            {floor:floorHoveredList, change:list, isAdd: false}
        );         
    }

    EventManager.apSelect = function(list) {
        apSelectdList = _.union(apSelectdList, list);
        ObserverManager.post(WFV.Message.ApSelect, 
            {apid:apSelectdList, change:list, isAdd: true}
        );        
    }
    EventManager.apDeselect = function(list) {
        if (list == null) {
            list = apSelectdList;
            apSelectdList = [];
        } else
            apSelectdList = _.difference(apSelectdList, list);
        ObserverManager.post(WFV.Message.ApSelect, 
            {apid:apSelectdList, change:list, isAdd: false}
        );        
    }
    EventManager.apHover = function(list) {
        apHoveredList = _.union(apHoveredList, list);
        ObserverManager.post(WFV.Message.ApHover, 
            {apid:apHoveredList, change:list, isAdd: true}
        );        
    }
    EventManager.apDehover = function(list) {
        if (list == null) {
            list = apHoveredList;
            apHoveredList = [];
        } else
            apHoveredList = _.difference(apHoveredList, list);
        ObserverManager.post(WFV.Message.ApHover, 
            {apid:apHoveredList, change:list, isAdd: false}
        );         
    }

    EventManager.deviceSelect = function(list) {
        deviceSelectdList = _.union(deviceSelectdList, list);
        ObserverManager.post(WFV.Message.DeviceSelect, 
            {device:deviceSelectdList, change:list, isAdd: true}
        );                
    }
    EventManager.deviceDeselect = function(list) {
        if (list == null) {
            list = deviceSelectdList;
            deviceSelectdList = [];
        } else 
            deviceSelectdList = _.difference(deviceSelectdList, list);
        ObserverManager.post(WFV.Message.DeviceSelect, 
            {device:deviceSelectdList, change:list, isAdd: false}
        );          
    }
    EventManager.deviceHover = function(list) {
        deviceHoveredList = _.union(deviceHoveredList, list);
        ObserverManager.post(WFV.Message.DeviceHover, 
            {device:deviceHoveredList, change:list, isAdd: true}
        );          
    }
    EventManager.deviceDehover = function(list) {
        if (list == null) {
            list = deviceHoveredList;
            deviceHoveredList = [];
        } else         
            deviceHoveredList = _.difference(deviceHoveredList, list);
        ObserverManager.post(WFV.Message.DeviceHover, 
            {device:deviceHoveredList, change:list, isAdd: false}
        );          
    }

    EventManager.pathSelect = function(sid, tid, weight) {
        ObserverManager.post(WFV.Message.PathSelect, 
            {sid:sid, tid:tid, weight:weight}
        );  
    }    

    EventManager.pathDeelect = function(sid, tid, weight) {
        ObserverManager.post(WFV.Message.PathDeSelect, 
            {sid:sid, tid:tid, weight:weight}
        );  
    }    

    EventManager.timePointChange = function(time) {
        ObserverManager.post(WFV.Message.TimePointChange, {time: time});        
    }

    EventManager.timeRangeChange = function(range) {
        ObserverManager.post(WFV.Message.TimeRangeChange, {range: range});
    }    

    EventManager.timeRangeChanged = function(range) {
        ObserverManager.post(WFV.Message.TimeRangeChanged, {range: range});
    }    

    window["EventManager"] = EventManager;
})()
