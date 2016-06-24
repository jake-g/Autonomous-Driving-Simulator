// If you use jslint, the following line prevents use strict from throwing an error.
/*jslint node: true */
"use strict";

var gauge = require("./libs/gauge2.js");

/*
---------------------------------------ZMQ------------------------------------------
*/
var zmq = require('zmq');
var subscriber = zmq.socket('sub');

var port = 5005; // match the publisher
var port2 = 8690; // match the publisher
var topic = "Scores"; // use '' for all topics
var topic2 = "Simulator";
var dataAwareness;
var dataSim;
init_zmq(port, topic);
init_zmq(port2, topic2);

function init_zmq(port, topic) {
    console.log('Initializing ZMQ...');
    subscriber.connect('tcp://localhost:' + port);
    subscriber.subscribe(topic);
    subscriber.on('message', queue_message);
}

function queue_message() {
    var msg_str = Array.prototype.slice.call(arguments).toString(); // as string
    var msg = split_message(msg_str);
    if(msg[0] === "Scores "){
      dataAwareness = msg[1];
    } else {
      dataSim = msg[1];
    }
    // console.log(msg[0], msg[1]);
}

function split_message(msg) {
    topic = msg.substr(0, msg.indexOf('{')); // gets topic from msg
    var json_str = msg.substr(msg.indexOf('{') - 1, msg.length - 1); // gets data from msg
    var json = JSON.parse(json_str);
    return [topic, json];
}

/*
---------------------------------------Plots------------------------------------------
Initializes elements, starts draw cycle
*/
function init() {
    // Settings to provide to element
    var settings = {
        size: 300,
        clipWidth: 300,
        clipHeight: 200,
        ringWidth: 50,
        maxValue: 100,
        transitionMs: 100,
    };
    var settingsTorcs = {
        size: 300,
        clipWidth: 300,
        clipHeight: 200,
        ringWidth: 50,
        maxValue: 200,
        transitionMs: 100,
    };

    var distGauge = gauge('#distraction', settings);
    var phoneGauge = gauge('#phone', settings);
    var happyGauge = gauge('#happy', settings);
    var sleepGauge = gauge('#sleep', settings);
    var fuelGauge = gauge('#fuel', settings);
    var speedGauge = gauge('#speed', settingsTorcs);
    var rpmGauge = gauge('#rpm', settingsTorcs);
    var yawGauge = gauge('#yaw', settingsTorcs);
    var gearGauge = gauge('#gear', settingsTorcs);

    distGauge.render();
    phoneGauge.render();
    happyGauge.render();
    sleepGauge.render();
    fuelGauge.render();
    speedGauge.render();
    rpmGauge.render();
    yawGauge.render();
    gearGauge.render();

    // Update
    var FPS = 30;  // TODO send fps of zmq
    setInterval(function() {
        //		 var batteryVal = simulateBattery();  // count from 1 to 100
        //		 var speedVal = simulatePedal(); // updates data
        if (dataAwareness === null) {
            console.log('Waiting to detect face....');
        } else { // Update values
            distGauge.update(dataAwareness.Distraction);
            phoneGauge.update(dataAwareness.Phone);
            happyGauge.update(dataAwareness.Happy);
            sleepGauge.update(dataAwareness.Sleep);
        }
        if(dataSim === null) {
            console.log('Waiting for Simulator data...');
        }else{
            fuelGauge.update(parseFloat(dataSim.Fuel));
            speedGauge.update(parseFloat(dataSim.Speed));
            rpmGauge.update(parseFloat(dataSim.RPM));
            yawGauge.update(parseFloat(dataSim.Yaw));
            gearGauge.update(parseInt(dataSim.Gear));
        }
    }, 1000/FPS);
}


/*
-------------------------------------Helpers------------------------------------------
*/
// Picks random setpoint and increments data util setpoint is reached
var val = 0;
var setPoint = 0;
var increment = 1;

function simulatePedal() {
    if (Math.abs(setPoint - val) < increment) { // reset setpoint
        setPoint = Math.round(Math.random() * 100); // int from 0 to 100
        increment = 3 * (Math.random() + 0.5); // float between 0.5 and 3
        // console.log("Value :\t" + val +
        // 						"\tSet Point :\t" + setPoint +
        // 						"\tIncrement :\t" + increment);		// debug
    } else if (val < setPoint) {
        val += increment;
    } else {
        val += -1 * increment;
    }
    return val;
}

// Simulate Battery
var batteryVal = 0;

function simulateBattery() {
    batteryVal += 0.5;
    return batteryVal % 100;

}
/*
When window loads run init
*/
window.onload = function() {
    init();

};
