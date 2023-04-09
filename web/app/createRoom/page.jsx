'use client';
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
          <div class="flex justify-center">
            <label htmlFor={`text-${i}`} class="relative mb-3 xl:w-96">User nickname {i}:</label>
            {/*<input id={`text-${i}`} type="text" />  exampleFormControlInput1*/}
            <div className="relative mb-3 xl:w-96" dataTeInputWrapperInit>
              <input type="text" className="peer block min-h-[auto] w-full rounded border-0 bg-transparent py-[0.32rem] px-3 leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 data-[te-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-neutral-200 dark:placeholder:text-neutral-200 [&:not([data-te-input-placeholder-active])]:placeholder:opacity-0" id={`text-${i}`} placeholder="Username" />
              <label for={`text-${i}`} class="pointer-events-none absolute top-0 left-3 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[0.9rem] peer-focus:scale-[0.8] peer-focus:text-primary peer-data-[te-input-state-active]:-translate-y-[0.9rem] peer-data-[te-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-200 dark:peer-focus:text-neutral-200">
                Username
              </label>
            </div>
          </div>
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
        <div style={{display: `flex`, justifyContent: `center`, alignItems: `center`}}>
          <label htmlFor="number">Select number of users in the call :</label>
          <select id="number" value={selectedNumber} onChange={handleChange}>
            {options}
          </select>
        </div>
        <div style={{textAlign: `center`}}>
          {createTextFields()}
        </div>
      </div>
  );
}