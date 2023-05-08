import { useEffect, useState } from "react";
import { Web3Storage } from "web3.storage";

export default function FileUpload() {
    const [storage, setStorage] = useState<Web3Storage>(null);

    useEffect(() => {
        const storage = new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3STORAGE_TOKEN });
        setStorage(storage);
    }, []);

    async function uploadFile(file: File): Promise<string> {
        const cid = await storage.put([file]);
        return cid;
    }

    async function retrieveFile(cid: string): Promise<File> {
        const res = await storage.get(cid);
        const files = await res.files();
        return files[0];
    }

    return { uploadFile, retrieveFile };
}
