import { MutableRefObject, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Web3Storage } from "web3.storage";

interface FileUpload {
    uploadFiles:(files: File[]) => Promise<string>;
    retrieveFiles:(cid: string) => Promise<void>;
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
        return cid;
    }

    async function retrieveFiles(cid: string): Promise<void> {
        let files: File[];
        await toast.promise(async () => {
            const res = await storage.get(cid);
            files = await res.files();
        }, {
            pending: "Downloading Files",
            success: "Downloaded Files",
            error: "Failed to Download Files",
        });
        for (const file of (files as File[])) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                if (downloadLink.current) {
                    downloadLink.current.href = reader.result as string;
                    downloadLink.current.download = file.name;
                    downloadLink.current.click();
                    console.log(file.name);
                }
            };
        }
    }

    return { uploadFiles, retrieveFiles, downloadLink };
}
