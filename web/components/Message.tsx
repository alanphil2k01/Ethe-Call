import styles from './Message.module.css';

export default function Message(props){
    return (
        <div className={`${styles.message__wrapper}`}>
            <div className={`${styles.message__body}`}>
                <strong className={`${styles.message__author}`}>Dennis Ivy</strong>   
                <p className={`${styles.message__text}`}>{props.message}</p>
            </div>
        </div>
    );
}