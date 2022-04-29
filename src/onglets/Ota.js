import React from 'react';
import '../styles/Header.css';
import { Buffer } from 'buffer';
import { createLogElement } from "../components/Header";

const CHUNK_LENGTH = 248;
let writeAddressCharacteristic;
let indicateCharacteristic;
let writeWithoutResponseCharacteristic;
let fileContent;

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
        let address = document.getElementById("sectorInput").value
        let hexString = address.substring(0,2);
        hexString = parseInt(hexString, 16);
        console.log(hexString);
        // dec : 002 000 112 000
        // hex : 02 00 70 00
        let myWord = new Uint8Array(4);
        myWord[0] = "002"; // Action 
        myWord[1] = "000"; // Address
        myWord[2] = hexString; // Address
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

    async function onUploadButtonClick() {
        let progressUploadBar = document.getElementById('progressUploadBar');
        document.getElementById('FileStatus').innerHTML = "Uploading...";
        let start = 0;
        let end = CHUNK_LENGTH;
        let sub;
        let totalBytes = 0;
        // Send to device the base memory address (sector 7)
        writeAddress();
        // Slice the fileContent (the binary file) into small chucks of CHUNK_LENGTH
        // And send them to the device
        // Start the timer
        var startTime = performance.now()
        for (let i = 0; i < (fileContent.length) / CHUNK_LENGTH; i++) {
            sub = fileContent.slice(start, end);
            console.log(sub);
            start = end;
            end += CHUNK_LENGTH;
            await writeWithoutResponseCharacteristic.characteristic.writeValue(sub)
            // createLogElement(sub, 2, "OTA WRITE");
            totalBytes += sub.byteLength
            console.log("progressUploadBar");
            console.log(progressUploadBar);
            progressUploadBar.setAttribute('style','width:'+Number((totalBytes * 100) / fileContent.length)+'%');
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
        fileContent = input.target.files[0];
        let reader = new FileReader();
        reader.readAsArrayBuffer(fileContent);
        reader.onload = async function () {
            let uint8View = new Uint8Array(reader.result);
            fileContent = uint8View;
        }
    }
    async function onBinaryRadioButtonClick() {
        let selectedOption = document.getElementsByName("selectBinary");
        for (let i = 0; i < selectedOption.length; i++){
            if(selectedOption[i].checked){
                selectedOption = selectedOption[i].value;
            }
        }
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
                        fileContent = uint8View;
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
                        fileContent = uint8View;
                        console.log("Heart rate is uploading");
                    })
                    .catch(error => console.error(error))
                break;
            default:
                console.log("Selected option not found..")
        }
    }

    function handlerRadioSector(){
        let selectedBoardOption = document.getElementsByName("selectSector");
        document.getElementById("rebootSelectFilePart").style="display:''";
        for (let i = 0; i < selectedBoardOption.length; i++){
          if(selectedBoardOption[i].checked){
            switch (selectedBoardOption[i].value){
              case "application":
                document.getElementById("wirelessBinaryList").style="display:none";
                document.getElementById("applicationBinaryList").style="display:''";
                break;
              case "wireless":
                document.getElementById("applicationBinaryList").style="display:none";
                document.getElementById("wirelessBinaryList").style="display:''";
                break;
            }
          }
        }
      }

    return (
        // <div>
        //     <div>
        //         <button onClick={onFetchButtonClick} className='defaultButton'>Fetch file p2pserver ota on github</button>
        //         <select id='selectFetch'>
        //             <option>Select</option>
        //             <option value="P2P">P2P</option>
        //             <option value="HR">HR</option>
        //         </select>
        //     </div>
        //     <div>
        //         <input type="file" onChange={(e) => showFile(e)} className='fileInput' />
        //         <progress value="0" max="100" id="progressUploadBar" className='progressBar'></progress>
        //         <h1 id='FileStatus'></h1>
        //     </div>
        //    </div>
    <div className="container-fluid">
        <div className="container">
            <h3>Select the board type</h3>
              <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="WB5x" name='selectBoard'></input>
                </div>
                <input type="text" disabled={true} className="form-control" aria-label="Text input with radio button" value="STM32WB5x"></input>
                </div>
              <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="WB3x" name='selectBoard'></input>
                </div>
                <input type="text" disabled={true} className="form-control" aria-label="Text input with radio button" value="STM32WB3x"></input>
                </div>
              <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="WB1x" name='selectBoard'></input>
                </div>
                <input type="text" disabled={true} className="form-control" aria-label="Text input with radio button" value="STM32WB1x"></input>
              </div>

              <h3>Select sector to delete during the reboot</h3>
              <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="application" name='selectSector' onClick={handlerRadioSector}></input>
                </div>
                <input type="text" disabled={true} className="form-control"  value="Application Coprocessor Binary"></input>
              </div>
              <div className="input-group">
                <div className="input-group-text">
                  <input className="form-check-input mt-0" type="radio" value="wireless" name='selectSector' onClick={handlerRadioSector}></input>
                </div>
                <input type="text" disabled={true} className="form-control"  value="Wireless Coprocessor Binary"></input>
              </div>
              <div id='rebootSelectFilePart' style={{"display": "none"}}>
                <div id='applicationBinaryList' style={{"display": "none"}}>
                  <h3>Select binary file</h3>
                  <div className="input-group">
                    <div className="input-group-text">
                      <input className="form-check-input mt-0" type="radio" value="P2P" name='selectBinary' onClick={onBinaryRadioButtonClick}></input>
                    </div>
                    <input type="text" disabled={true} className="form-control"  value="BLE_p2pServer_ota_reference.bin"></input>
                  </div>
                  <div className="input-group">
                    <div className="input-group-text">
                      <input className="form-check-input mt-0" type="radio" value="HR" name='selectBinary' onClick={onBinaryRadioButtonClick}></input>
                    </div>
                    <input type="text" disabled={true} className="form-control"  value="BLE_HeartRate_ota_reference.bin"></input>
                  </div>
                </div>

                <div id='wirelessBinaryList' style={{"display": "none"}}>
                  <h3>Select binary file</h3>
                    <div className="input-group">
                      <div className="input-group-text">
                        <input className="form-check-input mt-0" type="radio" value="?" name='selectBinary' onClick={onBinaryRadioButtonClick}></input>
                      </div>
                      <input type="text" disabled={true} className="form-control"  value="?_reference.bin"></input>
                    </div>
                    <div className="input-group">
                      <div className="input-group-text">
                        <input className="form-check-input mt-0" type="radio" value="??" name='selectBinary' onClick={onBinaryRadioButtonClick}></input>
                      </div>
                      <input type="text" disabled={true} className="form-control"  value="??_reference.bin"></input>
                    </div>
                </div>
                <div className="mt-3 mb-3">
                  <input className="form-control fileInput" type="file" onChange={(e) => showFile(e)}></input>
                </div> 
                <div className="input-group mb-3">
                  <span className="input-group-text" id="sectorChoise">Address 0x</span>
                  <input type="text" className="form-control" placeholder="..." aria-describedby="sectorChoise" maxLength="4" id="sectorInput" defaultValue={"7000"}></input>
                </div>            
                <button className="btn btn-secondary w-100 mb-3 has-spinner" type="button" onClick={onUploadButtonClick} id="uploadButton">Upload</button>
                <div class="progress">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" id='progressUploadBar' aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style={{width: "0%"}}></div>
                </div>
                <h5 id='FileStatus'></h5>
              </div>
            </div>
        </div>

    );
};

export default Ota;