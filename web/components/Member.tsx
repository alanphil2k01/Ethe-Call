import styles from './MemberComponent.module.css';

export default function Member(props){
    return (
        <div className={`${styles.member__wrapper}`} id={`${styles.member__1__wrapper}`}>
            <span className={`${styles.green__icon}`}></span>
            <p className={`${styles.member_name} ${styles.text}`}>{props.name}</p>
        </div>
    );
}