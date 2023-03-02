'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Room ()  {

  return (
    <div class="card" style={{width: "18rem;"}}>
    <img class="card-img-top" src="https://media.istockphoto.com/id/148423909/photo/a-sunset-over-chinese-fishing-nets-by-a-canoe-in-cochin.jpg?s=612x612&w=0&k=20&c=76RtSZhX5iheTAyDuH6Uzl9JNWD5axbWlEWc2bXKChw=" alt="Card image cap"></img>
    <div class="card-body">
        <h5 class="card-title">Card title</h5>
        <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
        <a href="#" class="btn btn-primary">Go somewhere</a>
    </div>
    </div>

  );
};
