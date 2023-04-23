'use client';
import './globals.css'
import  BlockchainProvider from "./blockchain";
import Navbar from '@/components/navbar';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body>
        <BlockchainProvider>
            <Navbar>         
            </Navbar>
            { children }
        </BlockchainProvider>
    </body>
  </html>
  )
}
