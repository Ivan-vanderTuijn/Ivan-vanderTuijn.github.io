import React, { useState } from 'react';
import imageLightOff from '../images/lightOff.png';
import imageLightOn from '../images/lightOn.png';
import '../styles/Header.css';
import { createLogElement } from "../components/Header";

const P2Pserver = (props) => {
  let notifyCharacteristic;
  let ReadWriteCharacteristic;
  let rebootCharacteristic;
  let fileContent;
  let displayRebootPanel = "none";  


  // Filtering the different datathroughput characteristics
  props.allCharacteristics.map(element => {
    switch (element.characteristic.uuid) {
      case "0000fe42-8e22-4541-9d4c-21edae82ed19":
        notifyCharacteristic = element;
        break;
      case "0000fe41-8e22-4541-9d4c-21edae82ed19":
        ReadWriteCharacteristic = element;
        break;
      case "0000fe11-8e22-4541-9d4c-21edae82ed19":
        rebootCharacteristic = element;
        displayRebootPanel = "block";
        break;
      default:
        console.log("# No characteristics found..");
    }
  });

  // Write button handler
  async function onWriteButtonClick() {
    let myInput = document.getElementById('writeInput').value;
    let myWord = new Uint8Array(2);
    myWord[0] = myInput.slice(0, 2);
    myWord[1] = myInput.slice(2, 4);
    try {
      await ReadWriteCharacteristic.characteristic.writeValue(myWord);
      createLogElement(myWord, 1, "P2Pserver WRITE");
    }
    catch (error) {
      console.log('2 : Argh! ' + error);
    }
  }
  // Read button handler
  async function onReadButtonClick() {
    var value = await ReadWriteCharacteristic.characteristic.readValue();
    let statusWord = new Uint8Array(value.buffer);
    console.log(statusWord);
    document.getElementById('readLabel').innerHTML = "0x" + statusWord.toString();
    createLogElement(statusWord, 1, "P2Pserver READ");

  }

  // Enable Light image handler
  async function onEnableLightClick() {
    let imgStatus = document.getElementById('imageLight').getAttribute('src')
    let myWord;
    try {
      if (imgStatus === imageLightOff) {
        myWord = new Uint8Array(2);
        myWord[0] = parseInt('01', 8);
        myWord[1] = parseInt('01', 8);
        await ReadWriteCharacteristic.characteristic.writeValue(myWord);
        createLogElement(myWord, 1, "P2Pserver WRITE");
        document.getElementById('enableLightButton').innerHTML = "Light ON";
        document.getElementById('imageLight').src = imageLightOn;
      } else {
        myWord = new Uint8Array(2);
        myWord[0] = parseInt('01', 8);
        myWord[1] = parseInt('00', 8);
        await ReadWriteCharacteristic.characteristic.writeValue(myWord);
        createLogElement(myWord, 1, "P2Pserver WRITE");
        document.getElementById('enableLightButton').innerHTML = "Light OFF";
        document.getElementById('imageLight').src = imageLightOff;
      }
    }
    catch (error) {
      console.log('2 : Argh! ' + error);
    }
  }

  // Notify button click handler
  async function onNotifyButtonClick() {
    let notifStatus = document.getElementById('notifyButton').innerHTML;
    if (notifStatus === "Notify OFF") {
      console.log('Notification ON');
      notifyCharacteristic.characteristic.startNotifications();
      notifyCharacteristic.characteristic.oncharacteristicvaluechanged = notifHandler;
      document.getElementById('notifyButton').innerHTML = "Notify ON"
      createLogElement(notifyCharacteristic, 3, "P2Pserver ENABLE NOTIFICATION ");
    } else {
      notifyCharacteristic.characteristic.stopNotifications();
      console.log('Notification OFF');
      document.getElementById('notifyButton').innerHTML = "Notify OFF"
      createLogElement(notifyCharacteristic, 3, "P2Pserver DISABLE NOTIFICATION ");
    }
  }

  // notification handler
  function notifHandler(event) {
    console.log("Notification received");
    var buf = new Uint8Array(event.target.value.buffer);
    console.log(buf);
    createLogElement(buf, 1, "P2Pserver NOTIFICATION RECEIVED");
    if (buf[1].toString() === "1") {
      document.getElementById('imageLight').src = imageLightOn;
    } else {
      document.getElementById('imageLight').src = imageLightOff;
    }
  }

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
    createLogElement(rebootRequest, 2, "P2Pserver REBOOT");
  }

  return (
    <div>
      <div>
        <button onClick={onNotifyButtonClick} id="notifyButton" className='defaultButton'>Notify OFF</button>
        <button onClick={onEnableLightClick} id="enableLightButton" className='defaultButton'>Light OFF</button>
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
      <img src={imageLightOff} onClick={onEnableLightClick} id='imageLight' alt='Light'></img>
    </div>
  );
};

export default P2Pserver;