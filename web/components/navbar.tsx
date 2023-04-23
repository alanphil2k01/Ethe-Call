import styles from './navbar.module.css';
import WalletButton from '@/components/WalletButton';

export default function Navbar(props){
    return (
        <main className={styles.main}>
            <header className={styles.header}>
                <img src="" alt="Logo" className={styles.logo}/>
                <nav className={styles.navbar}>
                    <ul className={styles.nav__links}>
                        <li className={styles.li}><a href="#" className={styles.a}>Services</a></li>
                        <li className={styles.li}><a href="#" className={styles.a}>Project</a></li>
                        <li className={styles.li}><a href="#" className={styles.a}>About</a></li>
                    </ul>
                    {props.children}
                </nav>
                <WalletButton></WalletButton>
            </header>
        </main>
    );
}