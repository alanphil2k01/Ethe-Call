import useFileUpload from '@/hooks/FileUpload';
import styles from './Message.module.css';
import { MessageType, MessageContent } from "@/types/message";

export default function Message({ message }: { message: MessageContent }){
    const {  retrieveFiles, downloadLink } = useFileUpload();
    return (
        <div className={`${styles.message__wrapper}`}>
            <div className={`${styles.message__body}`}>
                <strong className={`${styles.message__author}`}>{message.author}</strong>
                { message.type === MessageType.CHAT && (
                    <p className={`${styles.message__text}`}>{message.data}</p>
                )}
                { message.type === MessageType.FILE && (
                    <div>
                        <p className={`${styles.message__text}`} onClick={() => retrieveFiles(message.data)}>Files uploaded to CID: {message.data} Click to Download</p>
                        <a ref={downloadLink} style={{ display: "none" }}></a>
                    </div>
                )}
            </div>
        </div>
    );
}
