import React from 'react';
import '../styles/Read.css';



const Read = (props) => {

    const onReadButtonClick = () => {
        return console.log('FROM Read.js : ' + props.allServices);
    }


    


    return (
        <div>
            <button onClick={onReadButtonClick}>Read</button>
            <label id="readLabel"></label>         
        </div>
    );
};

export default Read;