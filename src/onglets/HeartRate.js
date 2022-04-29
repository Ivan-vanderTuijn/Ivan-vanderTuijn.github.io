import React, { useState } from 'react';
import { Chart } from "react-google-charts";
import '../styles/Header.css';
import { createLogElement } from "../components/Header";
import Reboot from '../components/Reboot.js';
import { height } from '@mui/system';

const HeartRate = (props) => {
    let chartDataset = [];
    const GRAPH_MAX_LABELS = 25;
    let notifyCharacteristic; // 00002a37-0000-1000-8000-00805f9b34fb
    let readCharacteristic; // 00002a38-0000-1000-8000-00805f9b34fb
    let writeCharacteristic; // 00002a39-0000-1000-8000-00805f9b34fbs
    let rebootCharacteristic;
    let displayRebootPanel = "none";
    let fileContent;
    const [dataChart, setDataChart] = useState([
    ["x", "Heart rate"],["", 70]
    ]);

    // Filtering the different datathroughput characteristics
    props.allCharacteristics.map(element => {
        switch (element.characteristic.uuid){
            case "00002a37-0000-1000-8000-00805f9b34fb" : 
                notifyCharacteristic = element;
            break;
            case "00002a38-0000-1000-8000-00805f9b34fb" : 
                readCharacteristic = element;
            break;
            case "00002a39-0000-1000-8000-00805f9b34fb" : 
                writeCharacteristic = element;
            break;
            case "0000fe11-8e22-4541-9d4c-21edae82ed19":
                rebootCharacteristic = element;
                displayRebootPanel = "block";
            break;
            default:
                console.log("# No characteristics find..");
        }
    });

    // read button handler
    async function onReadButtonClick() {
        var value = await readCharacteristic.characteristic.readValue();
        let statusWord = new Uint8Array(value.buffer);
        console.log(statusWord);
        document.getElementById('readLabel').innerHTML = "0x" + statusWord.toString();
        createLogElement(statusWord, 1, "HEART RATE READ");
    }

    // write button handler
    async function onWriteButtonClick() {
        let myInput = document.getElementById('writeInput').value;
        let myWord;
        console.log(myInput);
        myWord = new Uint8Array(2);
        myWord[0] = myInput.slice(0, 2);
        myWord[1] = myInput.slice(2, 4);
        try {
            console.log("Writing >> " + myWord);
            await writeCharacteristic.characteristic.writeValue(myWord);
            createLogElement(myWord, 1, "HEART RATE WRITE");
        }
        catch (error) {
            console.log('Argh! ' + error);
        }
    }

    // reset calorie count button handler
    async function onResetButtonClick() {
        const resetEnergyExpended = Uint8Array.of(1);
        try {
            console.log("Writing >> " + resetEnergyExpended);
            await writeCharacteristic.characteristic.writeValue(resetEnergyExpended);
            createLogElement(resetEnergyExpended, 1, "HEART RATE WRITE");
        }
        catch (error) {
            console.log('Argh! ' + error);
    }
  }

    async function onNotifyButtonClick() {
        let notifStatus = document.getElementById('notifyButton').innerHTML;
        if (notifStatus === "Notify OFF") {
            console.log('Notification ON');
            notifyCharacteristic.characteristic.startNotifications();
            notifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
            document.getElementById('notifyButton').innerHTML = "Notify ON"
            createLogElement(notifyCharacteristic, 3, "HEART RATE ENABLE NOTIFICATION");
            console.log(notifyCharacteristic.characteristic);
        } else {
            notifyCharacteristic.characteristic.stopNotifications();
            console.log('Notification OFF');
            document.getElementById('notifyButton').innerHTML = "Notify OFF"
            createLogElement(notifyCharacteristic, 3, "HEART RATE DISABLE NOTIFICATION");
            console.log(notifyCharacteristic.characteristic);
        }
    }

    function notifHandler(event) {
        console.log("Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        console.log(buf);
        
        document.getElementById('heartRateMeasurement').innerHTML = "heart Rate Measurement : " + buf[1].toString();
        document.getElementById('calorieCount').innerHTML = "Calorie count : " + buf[3].toString();
        document.getElementById('bodySensorLocation').innerHTML = "Body Sensor Location : " + buf[6].toString();
        addDataToCHart(buf[1]);
        console.log(JSON.stringify(buf));
        createLogElement(buf, 2, "HEART RATE NOTIFICATION");
    }   

    function addDataToCHart(data) {
        // Get current time
        let currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
        chartDataset = dataChart;
        chartDataset.shift();// Remove the first element
        if (chartDataset.length >= GRAPH_MAX_LABELS) {
            chartDataset.pop(); // Remove the last element
            chartDataset.unshift([currentTime,data]); // Add data at the beginning of to the Array
            chartDataset.unshift(["x", "Heart rate"]);
        } else {
            chartDataset.unshift([currentTime,data]); // Add data at the beginning of to the Array
            chartDataset.unshift(["x", "Heart rate"]); // Add data at the beginning of to the Array
        }
              
        // Remove element index 1 of the Array but without effet
        // Also permit to refresh the chart
        console.log(chartDataset);
        setDataChart([
            ...chartDataset.slice(0, 1),
            ...chartDataset.slice(1, chartDataset.length)
          ]);
        // Push element at end of array
        console.log(chartDataset);
        setDataChart(chartDataset)
    }

    // Chart options
    const options = {
        title: "Heart rate chart",
        legend: { position: "none" },
        backgroundColor: "#f8f9fa",
        colors: ["#112258"],
        hAxis: {title: "Time"},
        vAxis: {title: "BPM"}
      };

    return (
    <div className="container-fluid">
        <div className="container">
            {rebootCharacteristic === undefined ? null : <Reboot rebootCharacteristic={rebootCharacteristic}></Reboot>}
            <div className='row justify-content-center mt-3'>
                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2' >
                    <button className="btn btn-primary" type="button" onClick={onNotifyButtonClick} id="notifyButton">Notify OFF</button>
                </div>
                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
                    <button className="btn btn-primary" type="button" onClick={onResetButtonClick}>Reset Energy</button>
                </div>
            </div>
            <div className='row justify-content-center mt-3 mb-3'>
                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
                    <div class="input-group">
                        <span class="input-group-text" id="button-write">0x</span>
                        <input type="text" class="form-control" placeholder="..." aria-describedby="button-write" maxLength="4" id="writeInput"></input>
                        <button class="btn btn-primary" type="button" id="button-write" onClick={onWriteButtonClick} data-bs-toggle="tooltip" data-bs-placement="bottom" title="Write Control Point">Write</button>
                    </div>
                </div>
                <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
                    <div className="input-group">
                        <button className="btn btn-primary w-50" type="button" onClick={onReadButtonClick} aria-describedby="readLabel">Read</button>
                        <span className="input-group-text w-50 text-center" id="readLabel">0x....</span>
                    </div>              
                </div>
            </div>
            <div class="card text-dark bg-light mb-3">
                <div class="card-header" >Heart Rate Chart</div>
                <div class="card-body">
                    <p class="card-text" id="heartRateMeasurement">Heart Rate Measurement :</p>
                    <p class="card-text" id="calorieCount">Calorie count :</p>
                    <p class="card-text" id="bodySensorLocation">Body Sensor Location :</p>
                </div>
                <div className='chartContainer'style={{width: "100%"}}>
                    <Chart
                        chartType="LineChart"
                        data={dataChart}
                        options={options}
                        height={"400px"}
                    />
                </div>
                <div class="card-footer">
                    <small class="text-muted"></small>
                </div>
            </div>
            
            
        </div>
    </div>
    );
};

export default HeartRate;