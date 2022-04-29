import React, { useState } from 'react';
import imageLightOff from '../images/lightOff.svg';
import imageLightOn from '../images/lightOn.svg';
import '../styles/Header.css';
import { createLogElement } from "../components/Header";
import Reboot from '../components/Reboot';


const P2Pserver = (props) => {
  let notifyCharacteristic;
  let ReadWriteCharacteristic;
  let rebootCharacteristic;

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

  return (
    
      <div className="container-fluid">
        <div className="container">
          {rebootCharacteristic === undefined ? null : <Reboot rebootCharacteristic={rebootCharacteristic}></Reboot>}    
          <div className='row justify-content-center mt-3'>
            <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2' >
              <button className="btn btn-primary" type="button" onClick={onNotifyButtonClick} id="notifyButton">Notify OFF</button>
            </div>
            <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <button className="btn btn-primary" type="button" onClick={onEnableLightClick} id="enableLightButton">Light OFF</button>
            </div>
          </div>
          <div className='row justify-content-center mt-3'>
            <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <div class="input-group">
                <span class="input-group-text" id="button-write">0x</span>
                <input type="text" class="form-control" placeholder="..." aria-describedby="button-write" maxLength="4" id="writeInput"></input>
                <button class="btn btn-primary" type="button" id="button-write" onClick={onWriteButtonClick}>Write</button>
              </div>
            </div>
            <div className='d-grid col-xs-6 col-sm-6 col-md-4 col-lg-4 m-2'>
              <div className="input-group">
                <button className="btn btn-primary w-50" type="button" onClick={onReadButtonClick} aria-describedby="readLabel">Read</button>
                <span className="input-group-text w-50 text-center" id="readLabel">0x....</span>
              </div>              
            </div>
          </div>
          
          <img src={imageLightOff} onClick={onEnableLightClick} id='imageLight' alt='Light'></img>
        </div>
      </div>
     
  );
};

export default P2Pserver;