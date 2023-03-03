import React, { useState } from 'react';

export default function users() {
  const [selectedNumber, setSelectedNumber] = useState(1);

  const handleChange = (event) => {
    setSelectedNumber(event.target.value);
  };

  const createTextFields = () => {
    const textFields = [];
    for (let i = 1; i <= selectedNumber; i++) {
      textFields.push(
        <div key={i}>
          <label htmlFor={`text-${i}`}>Text field {i}:</label>
          <input id={`text-${i}`} type="text" />
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
    <div>
      <label htmlFor="number">Select a number:</label>
      <select id="number" value={selectedNumber} onChange={handleChange}>
        {options}
      </select>
      {createTextFields()}
    </div>
  );
}

