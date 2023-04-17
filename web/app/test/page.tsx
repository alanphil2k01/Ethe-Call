'use client';

import { useEffect, useRef, useState } from "react";

export default function Test() {
    const [x, setX] = useState(0);
    let y = 1000;
    const ref = useRef(1000);
    useEffect(() => {
        setX(100);
    }, []);
    function click() {
        setX(x+1);
        console.log(y);
        y = y+1;
        ref.current += 1;
        console.log(y);
        console.log(ref.current);
    }
    return (
        <div>
            <h3>x: {x}</h3>
            <h3>y: {y}</h3>
            <h3>ref.current: {ref.current}</h3>
            <button onClick={click}>asdf</button>
        </div>
    )
}
