import styles from './Members.module.css';
import Member from './Member';

export default function Members(props){
    return (
        <div id={`${styles.members__container}`}>
            <div id={`${styles.members__header}`}>
                <p className={`${styles.text}`}>Participants</p>
                <strong id={`${styles.members__count}`}>{props.peers.length+1}</strong>
            </div>

            <div id={`${styles.member__list}`}>
                <Member name="You"></Member>
                {props.peers.map((peer)=>{
                    return (<Member name={peer.peerData.displayName}/>)
                })}
            </div>
        </div>
    );
}