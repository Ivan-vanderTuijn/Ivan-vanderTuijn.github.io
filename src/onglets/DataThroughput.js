import React, { useState } from 'react';
import { Chart } from "react-google-charts";
import '../styles/Header.css';
import { createLogElement } from "../components/Header";

const DataThroughput = (props) => {
    const [dataChartDownload, setDataChartDownload] = useState([["x", "Download rate"],["", 0]]);
    const [dataChartUpload, setDataChartUpload] = useState([["x", "Upload rate"],["", 0]]);
    const [intervalIdDownload, setIntervalIdDownload] = useState();
    const [intervalIdUpload, setIntervalIdUpload] = useState();
    const [displayDownloadDiv, setDisplayDownloadDiv] = useState("block");
    const [displayUploadDiv, setDisplayUploadDiv] = useState("none");
    const CHUNK_LENGTH = 237;
    const GRAPH_MAX_LABELS = 25;
    let chartDatasetDownload = [];
    let chartDatasetUpload = [];
    let bytesReceivedDownload = 0;
    let bytesReceivedUpload = 0;
    let MaxBytesPerSecReceivedDownload = 0;
    let MaxBytesPerSecReceivedUpload = 0;
    let downloadNotifyCharacteristic;
    let uploadNotifyCharacteristic;
    let writeCharacteristic;  
    // 711 char s
    // let dataToUpload = "124123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123123124";
    // 237 chars
    let dataToUpload = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    // Filtering the different datathroughput characteristics
    props.allCharacteristics.map(element => {
        switch (element.characteristic.uuid){
            case "0000fe81-8e22-4541-9d4c-21edae82ed19" : 
                downloadNotifyCharacteristic = element;
            break;
            case "0000fe82-8e22-4541-9d4c-21edae82ed19" : 
                writeCharacteristic = element;
            break;
            case "0000fe83-8e22-4541-9d4c-21edae82ed19" : 
                uploadNotifyCharacteristic = element;
            break;
            default:
                console.log("# No characteristics find..");
        }
    });

    async function uploadingData(){
        var encoder = new TextEncoder();
        var view = encoder.encode(dataToUpload);
        try {
            // console.log("Writing >> " + view);
            // console.log(view);
            await writeCharacteristic.characteristic.writeValue(view);
        }
        catch (error) {
            console.log('Argh! ' + error);
        }
    }
        
    async function onUploadButtonClick() {
        if (document.getElementById('UploadButton').innerHTML === "Start Upload"){
            // 4ms : max 60000
            // 5ms : max 48000
            setIntervalIdUpload(setInterval(uploadingData,4));
            createLogElement("", 0, "DT START UPLOAD");
            document.getElementById('UploadButton').innerHTML = "Stop Upload";
        }else{
            clearInterval(intervalIdUpload);
            document.getElementById('UploadButton').innerHTML = "Start Upload";
            createLogElement("", 0, "DT STOP UPLOAD");
        }        
    }

    function eachSeconds() {
        if (bytesReceivedDownload > MaxBytesPerSecReceivedDownload) {
            MaxBytesPerSecReceivedDownload = bytesReceivedDownload;
        }
        addDataToDownloadChart(bytesReceivedDownload);
        document.getElementById('AveragebytesReceivedDownloadDownload').innerHTML = "Average : " + bytesReceivedDownload + " Bytes/sec";
        document.getElementById('MaxbytesReceivedDownloadDownload').innerHTML = "Max : " + MaxBytesPerSecReceivedDownload + " Bytes/sec";
        document.getElementById('PacketSizeDownload').innerHTML = "Packet size : " + CHUNK_LENGTH + " Bytes";
        bytesReceivedDownload = 0;        
    }

    // Download notify button click handler
    async function onDownloadNotifyButtonClick() {
        // Stop the upload
        clearInterval(intervalIdUpload);
        document.getElementById('UploadButton').innerHTML = "Start Upload";
        createLogElement("", 0, "DT STOP UPLOAD");
        // Hide the uppload div
        setDisplayUploadDiv("none");

        // Stop upload notifications
        uploadNotifyCharacteristic.characteristic.stopNotifications();
        createLogElement(uploadNotifyCharacteristic, 3, "DT DISABLE NOTIFICATION");
        console.log('Upload Notification OFF');
        document.getElementById('notifyButtonUpload').innerHTML = "Upload Notify OFF"

        // Show download div
        setDisplayDownloadDiv("block");

        // Start download notifications
        console.log('Download Notification ON');
        downloadNotifyCharacteristic.characteristic.startNotifications();
        downloadNotifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandlerDownload;
        createLogElement(downloadNotifyCharacteristic, 3, "DT ENABLE NOTIFICATION");
        document.getElementById('notifyButtonDownload').innerHTML = "Download Notify ON"
        // Start the timer
        setIntervalIdDownload(setInterval(eachSeconds, 1000));
    }

    // Download notify button click handler
    async function onUploadNotifyButtonClick() {
        // Hide  download div
        setDisplayDownloadDiv("none");

        // Stop download notifications
        clearInterval(intervalIdDownload);
        downloadNotifyCharacteristic.characteristic.stopNotifications();
        createLogElement(downloadNotifyCharacteristic, 3, "DT DISABLE NOTIFICATION");
        console.log('Download Notification OFF');
        document.getElementById('notifyButtonDownload').innerHTML = "Download Notify OFF"

        // Show upload div
        setDisplayUploadDiv("block");

        // Start upload notifications
        console.log('Upload Notification ON');
        uploadNotifyCharacteristic.characteristic.startNotifications();
        uploadNotifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandlerUpload;
        createLogElement(uploadNotifyCharacteristic, 3, "DT ENABLE NOTIFICATION");
        document.getElementById('notifyButtonUpload').innerHTML = "Upload Notify ON"
    }

    function notifHandlerDownload(event) {
        // console.log("Download Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        // createLogElement(buf, 3, "DT DOWNLOAD NOTIFICATION RECEIVED");
        bytesReceivedDownload = bytesReceivedDownload + buf.byteLength;
    }    

    // Receive a notification each seconds
    function notifHandlerUpload(event) {
        console.log("Upload Notification Received");
        var buf = new Uint8Array(event.target.value.buffer);
        // console.log(buf);
        // createLogElement(buf, 3, "DT UPLOAD NOTIFICATION RECEIVED");
        // Convert decimal into hexadecimal
        let decToHex0 = buf[0].toString(16);
        let decToHex1 = buf[1].toString(16);
        // Concatenate and switch index 1 with index 0
        let hexToDec = decToHex1 + decToHex0;
        hexToDec = parseInt(hexToDec,16);

        // Calculate the maximum bytes uploaded
        bytesReceivedUpload = hexToDec;
        if (bytesReceivedUpload > MaxBytesPerSecReceivedUpload) {
            MaxBytesPerSecReceivedUpload = bytesReceivedUpload;
        }
        addDataToUploadChart(bytesReceivedUpload);
        document.getElementById('AveragebytesReceivedDownloadUpload').innerHTML = "Average : " + hexToDec + " Bytes/sec";
        document.getElementById('MaxbytesReceivedDownloadUpload').innerHTML = "Max : " + MaxBytesPerSecReceivedUpload + " Bytes/sec";
        document.getElementById('PacketSizeUpload').innerHTML = "Packet size : " + CHUNK_LENGTH + " Bytes";    
    }  

    function addDataToDownloadChart(data) {
        // Get current time
        let currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
        chartDatasetDownload = dataChartDownload;
        chartDatasetDownload.shift();// Remove the first element
        if (chartDatasetDownload.length >= GRAPH_MAX_LABELS) {
            chartDatasetDownload.pop(); // Remove the last element
            chartDatasetDownload.unshift([currentTime,data]); // Add data at the beginning of to the Array
            chartDatasetDownload.unshift(["x", "Download rate"]);
        } else {
            chartDatasetDownload.unshift([currentTime,data]); // Add data at the beginning of to the Array
            chartDatasetDownload.unshift(["x", "Download rate"]); // Add data at the beginning of to the Array
        }
              
        // Remove element index 1 of the Array but without effet
        // Also permit to refresh the chart
        setDataChartDownload([
            ...chartDatasetDownload.slice(0, 1),
            ...chartDatasetDownload.slice(1, chartDatasetDownload.length)
          ]);
        // Push element at end of array
        console.log(chartDatasetDownload);
        setDataChartDownload(chartDatasetDownload);
    }

    function addDataToUploadChart(data) {
        // Get current time
        let currentTime = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
        chartDatasetUpload = dataChartUpload;
        chartDatasetUpload.shift();// Remove the first element
        if (chartDatasetUpload.length >= GRAPH_MAX_LABELS) {
            chartDatasetUpload.pop(); // Remove the last element
            chartDatasetUpload.unshift([currentTime,data]); // Add data at the beginning of to the Array
            chartDatasetUpload.unshift(["x", "Upload rate"]);
        } else {
            chartDatasetUpload.unshift([currentTime,data]); // Add data at the beginning of to the Array
            chartDatasetUpload.unshift(["x", "Upload rate"]); // Add data at the beginning of to the Array
        }
              
        // Remove element index 1 of the Array but without effet
        // Also permit to refresh the chart
        setDataChartUpload([
            ...chartDatasetUpload.slice(0, 1),
            ...chartDatasetUpload.slice(1, chartDatasetUpload.length)
          ]);
        // Push element at end of array
        console.log(chartDatasetUpload);
        setDataChartUpload(chartDatasetUpload);
    }

    const optionsDownload = {
        title: "Download performances",
        //curveType: "function",
        legend: { position: "top" },
        backgroundColor: "#eef1ff",
        // animation: {
        //     easing: 'linear',
        //     duration: 1000,
        //   },
        colors: ["#112258"],
        hAxis: {title: "Time"},
        vAxis: {title: "Bytes per seconds"}
      };     

      const optionsUpload = {
        title: "Upload performances",
        //curveType: "function",
        legend: { position: "top" },
        backgroundColor: "#eef1ff",
        // animation: {
        //     easing: 'linear',
        //     duration: 1000,
        //   },
        colors: ["#112258"],
        hAxis: {title: "Time"},
        vAxis: {title: "Bytes per seconds"}
      };     
      

    return (
        <div>
            <div>
                <button onClick={onDownloadNotifyButtonClick} id="notifyButtonDownload" className='DTButton'>Download Notify OFF</button>
                <button onClick={onUploadNotifyButtonClick} id="notifyButtonUpload" className='DTButton'>Upload Notify OFF</button>
            </div>
            <div id='uploadDiv' style={{"display": displayUploadDiv}}>
                <button onClick={onUploadButtonClick} id="UploadButton" className='defaultButton'>Start Upload</button>
                <Chart
                    chartType="LineChart"
                    width="800px"
                    height="400px"
                    data={dataChartUpload}
                    options={optionsUpload}
                />
                <div id='AveragebytesReceivedDownloadUpload' className='ChartInfoDiv'>{"Average : 0 Bytes/sec"}</div>
                <div id='MaxbytesReceivedDownloadUpload' className='ChartInfoDiv'>{"Max : 0 Bytes/sec"}</div>
                <div id='PacketSizeUpload' className='ChartInfoDiv'>{"Packet size : 0 Bytes"}</div>
            </div>
           <div id='downloadDiv' style={{"display": displayDownloadDiv}}>
                <Chart
                    chartType="LineChart"
                    width="800px"
                    height="400px"
                    data={dataChartDownload}
                    options={optionsDownload}
                />
                <div id='AveragebytesReceivedDownloadDownload' className='ChartInfoDiv'>{"Average : 0 Bytes/sec"}</div>
                <div id='MaxbytesReceivedDownloadDownload' className='ChartInfoDiv'>{"Max : 0 Bytes/sec"}</div>
                <div id='PacketSizeDownload' className='ChartInfoDiv'>{"Packet size : 0 Bytes"}</div>
           </div>
            
            

        </div>
    );
};

export default DataThroughput;