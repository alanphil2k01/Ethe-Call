import './globals.css'
import  { BlockchainProvider } from "./blockchain";
import { FingerprintProvider } from './fingerprint';
import MyNewNavbar from '@/components/myNewNavbar';
import ToastWrapper from "@/components/toastWrapper";

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
      <body className='bg-[#1a1a1a]'>
        <ToastWrapper />
        <BlockchainProvider>
            <FingerprintProvider>
                <MyNewNavbar>
                </MyNewNavbar>
                { children }
            </FingerprintProvider>
        </BlockchainProvider>
    </body>
  </html>
  )
}
