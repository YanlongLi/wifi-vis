(function(){
    var EventManager = {};

    var floorSelectdList = [],
        floorHoveredList = [],
        apSelectdList = [],
        apHoveredList = [],
        deviceSelectdList = [],
        deviceHoveredList = [];       

    EventManager.floorChange = function(floor, sender) {
        ObserverManager.post(WFV.Message.FloorChange, {floor:floor}, sender);
    }

    EventManager.floorSelect = function(list, sender) {
        floorSelectdList = _.union(floorSelectdList, list);
        ObserverManager.post(WFV.Message.FloorSelect, 
            {floor:floorSelectdList, change:list, isAdd: true},
            sender
        );
    }
    EventManager.floorDeSelect = function(list, sender) {
        if (list == null) {
            list = floorSelectdList;
            floorSelectdList = []; 
        } else {
            floorSelectdList = _.difference(floorSelectdList, list);
        }
        ObserverManager.post(WFV.Message.FloorSelect, 
            {floor:floorSelectdList, change:list, isAdd: false},
            sender
        );
    }
    EventManager.floorHover = function(list, sender) {
        floorHoveredList = _.union(floorHoveredList, list);
        ObserverManager.post(WFV.Message.FloorHover, 
            {floor:floorHoveredList, change:list, isAdd: true},
            sender
        );        
    }
    EventManager.floorDehover = function(list, sender) {
        if (list == null) {
            list = floorHoveredList;
            floorHoveredList = [];
        } else
            floorHoveredList = _.difference(floorHoveredList, list);
        ObserverManager.post(WFV.Message.FloorHover, 
            {floor:floorHoveredList, change:list, isAdd: false},
            sender
        );
    }

    EventManager.apSelect = function(list, sender) {
        apSelectdList = _.union(apSelectdList, list);
        ObserverManager.post(WFV.Message.ApSelect, 
            {apid:apSelectdList, change:list, isAdd: true},
            sender
        );        
    }
    EventManager.apDeselect = function(list, sender) {
        if (list == null) {
            list = apSelectdList;
            apSelectdList = [];
        } else
            apSelectdList = _.difference(apSelectdList, list);
        ObserverManager.post(WFV.Message.ApSelect, 
            {apid:apSelectdList, change:list, isAdd: false},
            sender
        );        
    }
    EventManager.apHover = function(list, sender) {
        apHoveredList = _.union(apHoveredList, list);
        ObserverManager.post(WFV.Message.ApHover, 
            {apid:apHoveredList, change:list, isAdd: true},
            sender
        );        
    }
    EventManager.apDehover = function(list, sender) {
        if (list == null) {
            list = apHoveredList;
            apHoveredList = [];
        } else
            apHoveredList = _.difference(apHoveredList, list);
        ObserverManager.post(WFV.Message.ApHover, 
            {apid:apHoveredList, change:list, isAdd: false},
            sender
        );         
    }

    EventManager.deviceSelect = function(list, sender) {
        deviceSelectdList = _.union(deviceSelectdList, list);
        ObserverManager.post(WFV.Message.DeviceSelect, 
            {device:deviceSelectdList, change:list, isAdd: true},
            sender
        );                
    }
    EventManager.deviceDeselect = function(list, sender) {
        if (list == null) {
            list = deviceSelectdList;
            deviceSelectdList = [];
        } else 
            deviceSelectdList = _.difference(deviceSelectdList, list);
        ObserverManager.post(WFV.Message.DeviceSelect, 
            {device:deviceSelectdList, change:list, isAdd: false},
            sender
        );          
    }
    EventManager.deviceHover = function(list, sender) {
        deviceHoveredList = _.union(deviceHoveredList, list);
        ObserverManager.post(WFV.Message.DeviceHover, 
            {device:deviceHoveredList, change:list, isAdd: true},
            sender
        );          
    }
    EventManager.deviceDehover = function(list, sender) {
        if (list == null) {
            list = deviceHoveredList;
            deviceHoveredList = [];
        } else         
            deviceHoveredList = _.difference(deviceHoveredList, list);
        ObserverManager.post(WFV.Message.DeviceHover, 
            {device:deviceHoveredList, change:list, isAdd: false},
            sender
        );          
    }

    EventManager.pathSelect = function(sid, tid, weight, sender) {
        ObserverManager.post(WFV.Message.PathSelect, 
            {sid:sid, tid:tid, weight:weight},
            sender
        );  
    }    

    EventManager.pathDeselect = function(sid, tid, weight, sender) {
        ObserverManager.post(WFV.Message.PathDeSelect, 
            {sid:sid, tid:tid, weight:weight},
            sender
        );  
    }    

    EventManager.timePointChange = function(time, sender) {
        ObserverManager.post(WFV.Message.TimePointChange, {time: time}, sender); 

    }

    EventManager.timeRangeChange = function(range, sender) {
        ObserverManager.post(WFV.Message.TimeRangeChange, {range: range}, sender);
    }    

    EventManager.timeRangeChanged = function(range, sender) {
        ObserverManager.post(WFV.Message.TimeRangeChanged, {range: range}, sender);
    }    

    window["EventManager"] = EventManager;
})()
