(function(){
    var EventManager = {};

    var floorSelectedList = [],
        floorHoveredList = [],
        apSelectedList = [],
        apHoveredList = [],
        deviceSelectedList = [],
        deviceHoveredList = [];       

    EventManager.floorChange = function(floor) {
        ObserverManager.post(WFV.Message.FloorChange, {floor:floor});        
    }

    EventManager.floorSelecte = function(list) {
        floorSelectedList = _.union(floorSelectedList, list);
        ObserverManager.post(WFV.Message.FloorSelect, 
            {floor:floorSelectedList, change:list, isAdd: true}
        );
    }
    EventManager.floorDeselecte = function(list) {
        if (list == null) {
            list = floorSelectedList;
            floorSelectedList = []; 
        } else {
            floorSelectedList = _.difference(floorSelectedList, list);
        }
        ObserverManager.post(WFV.Message.FloorSelect, 
            {floor:floorSelectedList, change:list, isAdd: false}
        );
    }
    EventManager.floorHovere = function(list) {
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

    EventManager.apSelecte = function(list) {
        apSelectedList = _.union(apSelectedList, list);
        ObserverManager.post(WFV.Message.APSelect, 
            {apid:apSelectedList, change:list, isAdd: true}
        );        
    }
    EventManager.apDeselect = function(list) {
        if (list == null) {
            list = apSelectedList;
            apSelectedList = [];
        } else
            apSelectedList = _.difference(apSelectedList, list);
        ObserverManager.post(WFV.Message.APSelect, 
            {apid:apSelectedList, change:list, isAdd: false}
        );        
    }
    EventManager.apHover = function(list) {
        apHoveredList = _.union(apHoveredList, list);
        ObserverManager.post(WFV.Message.APHover, 
            {apid:apHoveredList, change:list, isAdd: true}
        );        
    }
    EventManager.apDehover = function(list) {
        if (list == null) {
            list = apHoveredList;
            apHoveredList = [];
        } else
            apHoveredList = _.difference(apHoveredList, list);
        ObserverManager.post(WFV.Message.APHover, 
            {apid:apHoveredList, change:list, isAdd: false}
        );         
    }

    EventManager.deviceSelect = function(list) {
        deviceSelectedList = _.union(deviceSelectedList, list);
        ObserverManager.post(WFV.Message.DeviceSelect, 
            {device:deviceSelectedList, change:list, isAdd: true}
        );                
    }
    EventManager.deviceDeselect = function(list) {
        if (list == null) {
            list = deviceSelectedList;
            deviceSelectedList = [];
        } else 
            deviceSelectedList = _.difference(deviceSelectedList, list);
        ObserverManager.post(WFV.Message.DeviceSelect, 
            {device:deviceSelectedList, change:list, isAdd: false}
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
        ObserverManager.post(WFV.Message.TimeRangeChange, {range: range});
    }    

    window["EventManager"] = EventManager;
})()
