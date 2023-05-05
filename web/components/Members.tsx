import styles from './Members.module.css';
import Member from './Member';

export default function Members(props){
    return (
        <div id={`${styles.members__container}`}>
            <div id={`${styles.members__header}`}>
                <p className={`${styles.text}`}>Participants</p>
                <strong id={`${styles.members__count}`}>27</strong>
            </div>

            <div id={`${styles.member__list}`}>
                <Member name="Sulammita"></Member>
                <Member name="Dennis Ivy"></Member>
                <Member name="Shahriar P. Shuvo 👋:"></Member>
                <Member name="Sulammita"></Member>
                <Member name="Dennis Ivy"></Member>
                <Member name="Shahriar P. Shuvo 👋:"></Member>
                <Member name="Sulammita"></Member>
                <Member name="Dennis Ivy"></Member>
                <Member name="Shahriar P. Shuvo 👋:"></Member>
                <Member name="Sulammita"></Member>
                <Member name="Dennis Ivy"></Member>
                <Member name="Shahriar P. Shuvo 👋:"></Member>
                <Member name="Sulammita"></Member>
                <Member name="Dennis Ivy"></Member>
                <Member name="Shahriar P. Shuvo 👋:"></Member>
                <Member name="Sulammita"></Member>
                <Member name="Dennis Ivy"></Member>
                <Member name="Shahriar P. Shuvo 👋:"></Member>
                <Member name="Sulammita"></Member>
                <Member name="Dennis Ivy"></Member>
                <Member name="Shahriar P. Shuvo 👋:"></Member>
            </div>
        </div>
    );
}