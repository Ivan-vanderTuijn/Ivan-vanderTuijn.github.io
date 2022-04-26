import React, { useState } from "react";
import '../styles/Header.css';
import logoST from '../images/st-logo.svg';
var myDevice;

const Header = (props) => {
const [style, setStyle] = useState("defaultButton");



    function connection() {
        console.log('Requesting Bluetooth Device...');
        myDevice = navigator.bluetooth.requestDevice({
            filters: 
            [{
                name: 'P2PSRV1'
            }, {
                name: "HRSTM"
            }, {
                name: "DT_SERVER"
            }, {
                name: "STM_OTA"
            }, {
                name: "MyCST"
            }],
            optionalServices: ['0000fe40-cc7a-482a-984a-7f2ed5b3e58f', '0000180d-0000-1000-8000-00805f9b34fb','0000fe80-8e22-4541-9d4c-21edae82ed19','0000fe20-cc7a-482a-984a-7f2ed5b3e58f'] // service uuid of [P2P service, Heart Rate service, DataThroughput, Ota]
        })
            .then(device => { 
                myDevice = device;
                myDevice.addEventListener('gattserverdisconnected', onDisconnected);
                return device.gatt.connect();
            })
            .then(server => {
                return server.getPrimaryServices();
            })
            .then(services => {
                console.log('HEADER - Getting Characteristics...');
                let queue = Promise.resolve();
                services.forEach(service => {
                    console.log(service);
                    createLogElement(service, 3, 'SERVICE')
                    console.log(service.Prototype);
                    props.setAllServices((prevService) => [
                        ...prevService,
                        {
                            service
                        },
                    ]);
                    queue = queue.then(_ => service.getCharacteristics()
                        .then(characteristics => {
                            console.log(characteristics);
                            console.log('HEADER - > Service: ' + service.device.name + ' - ' + service.uuid);
                            characteristics.forEach(characteristic => {
                                props.setAllCharacteristics((prevChar) => [
                                    ...prevChar,
                                    {
                                        characteristic
                                    },
                                ]);
                                console.log('HEADER - >> Characteristic: ' + characteristic.uuid + ' ' + getSupportedProperties(characteristic));
                                createLogElement(characteristic, 4 , 'CHARACTERISTIC')
                            });
                        }));
                });
                setStyle("connectedStyleButton");
                document.getElementById('connectButton').innerHTML = "Connected";
                props.setIsDisconnected(false);
                return queue;
            })
            .catch(error => {
                console.error(error);
            });
        
    }
    
    function getSupportedProperties(characteristic) {
    let supportedProperties = [];
    for (const p in characteristic.properties) {
        if (characteristic.properties[p] === true) {
            supportedProperties.push(p.toUpperCase());
            }
        }
    return supportedProperties.join(', ');
    }

    function disconnection() {
        console.log('HEADER - Disconnecting from Bluetooth Device...');
        myDevice.gatt.disconnect();
        setStyle("defaultButton");
        props.setIsDisconnected(true);
        props.setAllServices([]);
        document.location.href="/";
    }

    function onDisconnected() {
        console.log('HEADER - > Bluetooth Device disconnected');
        setStyle("defaultButton");
        props.setIsDisconnected(true);
        props.setAllServices([]);
        document.location.href="/";
      }

    function showPanel(){
        let panelElement = document.getElementById("logPanel");
        if ( panelElement.style.display === "none"){
            panelElement.style.display = "block";
        }else{
            panelElement.style.display = "none";
        }
    }
    
    return (
        <div className="header">
            <div>
                <img src={logoST} alt="logo st"></img>
            </div>
            <div>
                <button onClick={connection} className={style} id="connectButton">Connect</button>
                <button onClick={disconnection} className='defaultButton'>Disconnect</button>
                <button onClick={showPanel} className='defaultButton'>Info</button>
            </div>      
            <div id="logPanel" style={{display:"none"}}></div>
        </div>
        
    );
};

// Create a new element in the log panel
export function createLogElement(logText, maxLevel, description) {
    // Format and beautify (like JSON) the object (interface) content give in parameter 
    // maxLevel set the number of recursivity loops, because interfaces have references to themselves and are infinite
    function formatInterface(object, maxLevel, currentLevel){
        var str = '';
        var levelStr = '';
        if ( typeof currentLevel == "undefined" ) {
            currentLevel = 0;
        }

        // Text in a pre element is displayed in a fixed-width font, and it preserves both spaces and line breaks;
        if ( currentLevel == 0 ) {
            str = '<pre>';
        }

        for ( var x = 0; x < currentLevel; x++ ) {
            levelStr += '    ';
        }

        if ( maxLevel != 0 && currentLevel >= maxLevel ) {
            str += levelStr + '...</br>';
            return str;
        }

        if (currentLevel <= maxLevel ){
            for ( var property in object ) { 
                if (typeof object[property] != "function") { // if value is not type function
                    if ( typeof object[property] != "object" ) { // if value is not type object
                        str += levelStr + property + ': ' + object[property] + ' </br>';
                    } else if ( object[property] == null){
                        str += levelStr + property + ': null </br>';
                    } else {
                        str += levelStr + property + ': { </br>' + formatInterface( object[property], maxLevel, currentLevel + 1 ) + levelStr + '}</br>';
                    }
                }                
            }
        }
        if ( currentLevel == 0 ) {
            str += '</pre>';
        }
        return str;
    }

    // Get current time
    let currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
    
    let formatedString = formatInterface(logText, maxLevel);
    let logPanel = document.getElementById('logPanel');
    let logElememt = document.createElement('div');
    logElememt.setAttribute("class", "logElememt");
    logElememt.innerHTML = currentTime + " : " + description + '</br>' + formatedString;
    logPanel.appendChild(logElememt);
}

export default Header;
