"use client";

import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function ToastWrapper() {

    return <ToastContainer
              position="bottom-left"
              autoClose={1000}
              hideProgressBar={true}
              closeButton={false}
              newestOnTop={false}
              draggable={false}
              closeOnClick
              theme="dark"
              pauseOnHover
          />
}
