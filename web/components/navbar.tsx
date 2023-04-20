import styles from './navbar.module.css';

export default function Navbar(props){
    return (
        <main className={styles.main}>
            <nav className={styles.navbar}>
                <ul className={styles.nav__links}>
                    <li><a href="#">Services</a></li>
                    <li><a href="#">Project</a></li>
                    <li><a href="#">About</a></li>
                </ul>
                <a href="#" className={styles.cta}><button>Contact Us</button></a>
                {props.children}
            </nav>
        </main>
    );
}