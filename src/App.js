import React, { useState } from 'react';
import Header from './components/Header';
import DataThroughput from './onglets/DataThroughput';
import HeartRate from './onglets/HeartRate';
import P2Pserver from './onglets/P2Pserver';
import Ota from './onglets/Ota';
import { BrowserRouter, Route, Link, Routes } from "react-router-dom";


const App = () => {
  const [allServices, setAllServices] = useState([]);
  const [allCharacteristics, setAllCharacteristics] = useState([]);
  const [isDisconnected, setIsDisconnected] = useState(true);
  // let onglets = [];
  let listItems = [];
  listItems = [];
  
allServices.map(service => {

  if(service.service.uuid === "0000fe80-8e22-4541-9d4c-21edae82ed19"){
      // Data Throughput
      // onglets.push(<DataThroughput allCharacteristics={allCharacteristics}></DataThroughput>);

      listItems.push(<li><Link to="/DT">DATA THROUGHPUT</Link></li>);
      // console.log("DataThroughput service found");
  }
  if(service.service.uuid === "0000180d-0000-1000-8000-00805f9b34fb"){
      // Heart rate
      // onglets.push(<HeartRate allCharacteristics={allCharacteristics}></HeartRate>);
      listItems.push(<li><Link to="/HR">HEART RATE</Link></li>);
      // console.log("HeartRate service found");
  }
  if(service.service.uuid === "0000fe40-cc7a-482a-984a-7f2ed5b3e58f"){
      // P2P server
      // onglets.push(<P2Pserver allCharacteristics={allCharacteristics}></P2Pserver>);
      listItems.push(<li><Link to="/P2P">P2P SERVER</Link></li>);
      // console.log("P2Pserver service found");
  }
  if(service.service.uuid === "0000fe20-cc7a-482a-984a-7f2ed5b3e58f"){
      // OTA
      // onglets.push(<Ota allCharacteristics={allCharacteristics}></Ota>)
      listItems.push(<li><Link to="/OTA">OTA</Link></li>);
      // console.log("Ota service found");
  }
  // console.log("App>js Onglets : ");
  // console.log(onglets);
  // console.log(allServices);
});


  return (
    <BrowserRouter>
      <div>
        <Header setIsDisconnected={setIsDisconnected} setAllServices={setAllServices} setAllCharacteristics={setAllCharacteristics}></Header>
          <ul>{listItems}</ul>
        {/* if device isDisconnected do render nothing more, else render component services contain in onglets[] */}
        {/* {isDisconnected ? null : onglets} */}
        <div className="main-route-place">
          <Routes>
            <Route path="/"/>
            <Route path="*"/>
            <Route path="/HR" element={isDisconnected ? null : <HeartRate allCharacteristics={allCharacteristics}></HeartRate>} />
            <Route path="/P2P" element={isDisconnected ? null : <P2Pserver allCharacteristics={allCharacteristics}></P2Pserver>} />
            <Route path="/OTA" element={isDisconnected ? null : <Ota allCharacteristics={allCharacteristics}></Ota>} />
            <Route path="/DT" element={isDisconnected ? null : <DataThroughput allCharacteristics={allCharacteristics}></DataThroughput>} />
          </Routes>
          </div>
      </div>
    </BrowserRouter>
    

  );
}

export default App;
