import React, { useState } from 'react';
import { Chart } from "react-google-charts";
import '../styles/Header.css';
import { createLogElement } from "../components/Header";

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
        console.log(chartDataset);
        chartDataset = dataChart;
        console.log(chartDataset);
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

    const options = {
        title: "Heart rate chart",
        //curveType: "function",
        legend: { position: "top" },
        backgroundColor: "#eef1ff",
        // animation: {
        //     easing: 'linear',
        //     duration: 1000,
        //   },
        colors: ["#112258"],
        hAxis: {title: "Time"},
        vAxis: { 
            title: "BPM"
        }
      };

    function showFile(e) {
        fileContent = e.target.files[0];
        createLogElement(fileContent, 3, "P2Pserver FILE INFORMATION");
    }

      // Handle the OTA application reboot procedure 
  function onRebootButtonClick(){
    //0x7000
    let sectorInput = document.getElementById("sectorInput").value;
    let fileSize = fileContent.size;
    let sectorLenght;

    // Determine the lenght of sectors
    switch (document.getElementById("selectBoard").value){
      case "STM32WB5x/WB3x":
        sectorLenght = 4096;
        break;
      case "STM32WB1x":
        sectorLenght = 2048;
        break;
      default:
        sectorLenght = 4096;
    }

    // Determine the number of sectors to erase
    let numberOfsectorsToErase = (Math.floor(fileSize/sectorLenght) + 1).toString(16);

    let rebootRequest = new Uint8Array(3);
    rebootRequest[0] = parseInt('01', 8); // Boot mode
    rebootRequest[1] = sectorInput.toString(16); // Sector index
    rebootRequest[2] = numberOfsectorsToErase; // Number of sectors to erase
    rebootCharacteristic.characteristic.writeValue(rebootRequest);
    createLogElement(rebootRequest, 2, "HEART RATE REBOOT");
  }

    return (
        <div>
            <div>
                <button onClick={onNotifyButtonClick} id="notifyButton" className='defaultButton'>Notify OFF</button>
                <button onClick={onResetButtonClick} className='defaultButton'>Reset</button>
            </div>
            <div id='rebootPanel' className='rebootPanel' style={{"display": displayRebootPanel}}>
                <button onClick={onRebootButtonClick} id="rebootButton" className='defaultButton'>Reboot</button>
                <select id='selectBoard'>
                    <option>Select the board type</option>
                    <option value="STM32WB5x/WB3x">STM32WB5x/WB3x</option>
                    <option value="STM32WB1x">STM32WB1x</option>
                </select>
                <label>Select the first sector to delete</label>
                <div className='fakey'>0x<input type="text" id="sectorInput" maxLength="4" defaultValue={"7000"}></input></div>
                <input type="file" className='fileInput' onChange={(e) => showFile(e)} />
            </div>
            <div>
                <button onClick={onWriteButtonClick} className='defaultButton'>Write</button>
                <input type="text" maxLength="4" id="writeInput"></input>
            </div>
            <div>
                <button onClick={onReadButtonClick} className='defaultButton'>Read</button>
                <label id="readLabel"></label>
            </div>
            <div className='chartContainer'>
                <Chart
                    chartType="LineChart"
                    data={dataChart}
                    options={options}
                    width="800px"
                    height="400px"
                />
            </div>
            
            <div id="heartRateMeasurement" className="ChartInfoDiv">Heart Rate Measurement : </div>
            <div id="calorieCount" className="ChartInfoDiv">Calorie count : </div>
            <div id="bodySensorLocation" className="ChartInfoDiv">Body Sensor Location : </div>
        </div>
    );
};

export default HeartRate;