import React, { useState } from 'react';
import '../styles/Header.css';
import { createLogElement } from "./Header";

const Reboot = (props) => {
  let rebootCharacteristic = props.rebootCharacteristic;
  let fileContent;

  function showFile(e) {
    fileContent = e.target.files[0];
    console.log(fileContent);
    createLogElement(fileContent, 3, "P2Pserver FILE INFORMATION");
  }


  // Handle the OTA application reboot procedure 
  function onRebootButtonClick(){

    //0x7000
    let sectorInput = document.getElementById("sectorInput").value;
    sectorInput = sectorInput.substring(0,1);
    let fileSize = fileContent.size;
    let sectorLenght;

    // Determine the lenght of sectors
    let selectedBoardOption = document.getElementsByName("selectBoard");
    for (let i = 0; i < selectedBoardOption.length; i++){
      if(selectedBoardOption[i].checked){
        selectedBoardOption = selectedBoardOption[i].value;
      }
    }
    switch (selectedBoardOption){
      case "WB5x":
        sectorLenght = 4096;
        break;
      case "WB3x":
        sectorLenght = 4096;
        break;
      case "WB1x":
        sectorLenght = 2048;
        break;
      default:
        sectorLenght = 4096;
    }

    // Determine the number of sectors to erase
    let numberOfsectorsToErase = (Math.floor(fileSize/sectorLenght) + 1).toString(16);

    let rebootRequest = new Uint8Array(3);
    rebootRequest[0] = parseInt('01', 8); // Boot mode
    console.log(sectorInput)
    rebootRequest[1] = sectorInput.toString(16); // Sector index
    console.log(sectorInput.toString(16))
    console.log(rebootRequest[1])
    rebootRequest[2] = numberOfsectorsToErase; // Number of sectors to erase
    rebootCharacteristic.characteristic.writeValue(rebootRequest);
    console.log(rebootRequest);
    createLogElement(rebootRequest, 2, "P2Pserver REBOOT");
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
                  fileContent = data;
                  console.log(fileContent);
                })
                .catch(error => console.error(error))
            break;
        case "HR":
            console.log("Heart rate is selected");
            fetch("https://api.github.com/repos/STMicroelectronics/STM32CubeWB/contents/Projects/P-NUCLEO-WB55.Nucleo/Applications/BLE/BLE_HeartRate_ota/Binary/BLE_HeartRate_ota_reference.bin")
                .then(response => response.json())
                .then(data => {
                  fileContent = data;
                  console.log(fileContent);
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
      <div className="accordion" id="accordionRebootPanel">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingOne">
            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
              Show reboot panel
            </button>
          </h2>
          <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionRebootPanel">
            <div className="accordion-body">
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
                <h3>Select the first sector to delete</h3>
                <div className="input-group">
                  <span className="input-group-text" id="sectorChoise">0x</span>
                  <input type="text" className="form-control" placeholder="..." aria-describedby="sectorChoise" maxLength="4" id="sectorInput" defaultValue={"7000"}></input>
                </div>
                <button className="btn btn-secondary w-100 mt-3" type="button" onClick={onRebootButtonClick} id="rebootButton">Reboot</button>
              </div>
            </div>
          </div>
        </div>
      </div>         
  );
};

export default Reboot;