import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Web3Storage } from "web3.storage";

interface FileUpload {
    uploadFiles:(files: File[]) => Promise<string>;
    retrieveFiles:(cid: string) => void;
    downloadLink: MutableRefObject<HTMLAnchorElement>;
}

export default function useFileUpload(): FileUpload {
    const [storage, setStorage] = useState<Web3Storage>(null);
    const downloadLink = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        const storage = new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN });
        setStorage(storage);
    }, []);

    async function uploadFiles(files: File[]): Promise<string> {
        const cid = await storage.put(files);
        console.log(cid);
        return cid;
    }

    async function retrieveFiles(cid: string): Promise<File> {
        const res = await storage.get(cid);
        const files = await res.files();
        for (const file of (files as File[])) {
            console.log(file.name);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (downloadLink.current) {
                    downloadLink.current.href = reader.result as string;
                    downloadLink.current.download = file.name;
                    downloadLink.current.click();
                }
            };
        }
        return files[0];
    }

    return { uploadFiles, retrieveFiles, downloadLink };
}
