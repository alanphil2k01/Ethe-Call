'use client';
import React, { useState } from 'react';
import "./design.css";
export default function users() {
  const [selectedNumber, setSelectedNumber] = useState(1);

  const handleChange = (event) => {
    setSelectedNumber(event.target.value);
  };
  
  const createTextFields = () => {
    const textFields = [];
    for (let i = 1; i <= selectedNumber; i++) {
      textFields.push(
        <div className="div1" key={i}>
          <label className="label1" htmlFor={`text-${i}`}>User nickname {i}:</label>
          <input className="input1" id={`text-${i}`} type="text" />
        </div>
      );
    }
    return textFields;
  };

  const options = [];
  for (let i = 1; i <= 100; i++) {
    options.push(
      <option key={i} value={i}>
        {i}
      </option>
    );
  }

  return (
    <main className="main">
    <div className="div2">
      <label className="label2" htmlFor="number">Select number of users in the call :</label>
      <select className="select" id="number" value={selectedNumber} onChange={handleChange}>
        {options}
      </select>
      {createTextFields()}
    </div>
    </main>
  );

}