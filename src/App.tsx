import React from 'react'
import { generateUUID } from "@/lib/utils";
import Chat from './components/Chat';
import { Navbar } from './components/custom/navbar';


const Popup: React.FC = () => {
  const id = generateUUID();
  return <>
  <Navbar />
  <Chat key={id} id={id} initialMessages={[]} />
  </>
}

export default Popup
