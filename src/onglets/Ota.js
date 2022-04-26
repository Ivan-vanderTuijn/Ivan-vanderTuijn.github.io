import React from 'react';
import '../styles/Header.css';
import { Buffer } from 'buffer';
import { createLogElement } from "../components/Header";
import { scryRenderedComponentsWithType } from 'react-dom/test-utils';

const CHUNK_LENGTH = 248;
let writeAddressCharacteristic;
let indicateCharacteristic;
let notifyCharacteristic;
let writeWithoutResponseCharacteristic;

const Ota = (props) => {

    // Filtering the different datathroughput characteristics
    props.allCharacteristics.map(element => {
        switch (element.characteristic.uuid) {
            case "0000fe22-8e22-4541-9d4c-21edae82ed19":
                writeAddressCharacteristic = element;
                break;
            case "0000fe23-8e22-4541-9d4c-21edae82ed19":
                indicateCharacteristic = element;
                console.log(indicateCharacteristic);
                break;
            case "0000fe24-8e22-4541-9d4c-21edae82ed19":
                writeWithoutResponseCharacteristic = element;
                break;
            default:
                console.log("# No characteristics find..");
        }
    });

    // Authorize the reception of indications / notifications
    console.log('Indications ON');
    indicateCharacteristic.characteristic.startNotifications();
    indicateCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
    createLogElement(indicateCharacteristic, 3, "OTA ENABLE NOTIFICATION");


    // Notification / indications handler
    function notifHandler(event) {
        console.log("Notification / Indication :> received");
        var buf = new Uint8Array(event.target.value.buffer);
        console.log(buf);
        createLogElement(buf, 2, "OTA NOTIFICATION");
    }

    // Send to device the action to be ready for the update of the firmware
    async function writeAddress() {
        // dec : 002 000 112 000
        // hex : 02 00 70 00
        let myWord = new Uint8Array(4);
        myWord[0] = "002"; // Action 
        myWord[1] = "000"; // Address
        myWord[2] = "112"; // Address
        myWord[3] = "000"; // Address
        try {
            await writeAddressCharacteristic.characteristic.writeValue(myWord);
            console.log("Writing >> " + myWord);
            createLogElement(myWord, 2, "OTA WRITE");
        }
        catch (error) {
            console.log('2 : Argh! ' + error);
        }
    }

    async function uploadData(uint8View) {
        let progressUploadBar = document.getElementById('progressUploadBar');
        document.getElementById('FileStatus').innerHTML = "Uploading...";
        let start = 0;
        let end = CHUNK_LENGTH;
        let sub;
        let totalBytes = 0;
        // Send to device the base memory address (sector 7)
        writeAddress();
        // Slice the uint8View (the binary file) into small chucks of CHUNK_LENGTH
        // And send them to the device
        // Start the timer
        var startTime = performance.now()
        for (let i = 0; i < (uint8View.length) / CHUNK_LENGTH; i++) {
            sub = uint8View.slice(start, end);
            console.log(sub);
            start = end;
            end += CHUNK_LENGTH;
            await writeWithoutResponseCharacteristic.characteristic.writeValue(sub)
            createLogElement(sub, 2, "OTA WRITE");
            totalBytes += sub.byteLength
            progressUploadBar.value = (totalBytes * 100) / uint8View.length;
            console.log(i + "> (" + totalBytes + ") writing " + sub.byteLength + ' bytes..');

        }

        // Send to device the action : file is finish to upload
        let FileUploadFinished = new Uint8Array(1);
        FileUploadFinished[0] = "007";
        await writeAddressCharacteristic.characteristic.writeValue(FileUploadFinished);
        createLogElement(FileUploadFinished, 2, "OTA WRITE");
        // Stop the timer
        var endTime = performance.now()
        console.log(`The firmware update took : ${endTime - startTime} milliseconds`);
        document.getElementById('FileStatus').innerHTML = "Wait for the disconnection...";
    }

    // Read the file selected from the file input and upload it
    async function showFile(input) {
        let fileContent = input.target.files[0];
        let reader = new FileReader();
        reader.readAsArrayBuffer(fileContent);
        reader.onload = async function () {
            let uint8View = new Uint8Array(reader.result);
            uploadData(uint8View);
        }
    }

    async function onFetchButtonClick() {
        let selectedOption = document.getElementById("selectFetch").value;
        switch (selectedOption) {
            case "P2P":
                console.log("P2P server is selected");
                fetch("https://api.github.com/repos/STMicroelectronics/STM32CubeWB/contents/Projects/P-NUCLEO-WB55.Nucleo/Applications/BLE/BLE_p2pServer_ota/Binary/BLE_p2pServer_ota_reference.bin")
                    .then(response => response.json())
                    .then(data => {
                        // Raw data encoded in base64
                        let raw = data.content;
                        let buff = Buffer.from(raw, 'base64');
                        // convert base64 raw data into hex string
                        let buffStr = buff.toString('hex');
                        console.log(buffStr);
                        let uint8View = Uint8Array.from(Buffer.from(buffStr, 'hex'));
                        console.log(uint8View);
                        uploadData(uint8View);
                        console.log("P2P server is uploading");
                    })
                    .catch(error => console.error(error))
                break;
            case "HR":
                console.log("Heart rate is selected");
                fetch("https://api.github.com/repos/STMicroelectronics/STM32CubeWB/contents/Projects/P-NUCLEO-WB55.Nucleo/Applications/BLE/BLE_HeartRate_ota/Binary/BLE_HeartRate_ota_reference.bin")
                    .then(response => response.json())
                    .then(data => {
                        // Raw data encoded in base64
                        let raw = data.content;
                        let buff = Buffer.from(raw, 'base64');
                        // convert base64 raw data into hex string
                        let buffStr = buff.toString('hex');
                        console.log(buffStr);
                        let uint8View = Uint8Array.from(Buffer.from(buffStr, 'hex'));
                        console.log(uint8View);
                        uploadData(uint8View);
                        console.log("Heart rate is uploading");
                    })
                    .catch(error => console.error(error))
                break;
            default:
                console.log("Selected option not found..")
        }
    }

    return (
        <div>
            <div>
                <button onClick={onFetchButtonClick} className='defaultButton'>Fetch file p2pserver ota on github</button>
                <select id='selectFetch'>
                    <option>Select</option>
                    <option value="P2P">P2P</option>
                    <option value="HR">HR</option>
                </select>
            </div>
            <div>
                <input type="file" onChange={(e) => showFile(e)} className='fileInput' />
                <progress value="0" max="100" id="progressUploadBar" className='progressBar'></progress>
                <h1 id='FileStatus'></h1>
            </div>

        </div>
    );
};

export default Ota;