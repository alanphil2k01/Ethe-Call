import { ReactNode } from 'react';
import styles from './myNewNavbar.module.css';
import WalletButton from '@/components/WalletButton';
import Image from 'next/image';
import Link from 'next/link';
import logo from "@/images/logo.png";

export default function MyNewNavbar({ }: { children: ReactNode }){
    return (
        <main className={`${styles.main}`}>
            <header id={`${styles.nav}`}>
                <div className={`${styles.nav__list}`}>
                        <Link href="/">
                            <h3 id={`${styles.logo}`}>
                                <Image style={{
                                    maxHeight: "3rem",
                                    maxWidth: "3rem"
                                }} src={logo} alt="Site Logo"/>
                                <span>Ethe-Call</span>
                            </h3>
                        </Link>
                </div>

                <div id={`${styles.nav__links}`}>
                    <Link className={`${styles.nav__link}`} href="/">
                        Lobby
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ede0e0" viewBox="0 0 24 24"><path d="M20 7.093v-5.093h-3v2.093l3 3zm4 5.907l-12-12-12 12h3v10h7v-5h4v5h7v-10h3zm-5 8h-3v-5h-8v5h-3v-10.26l7-6.912 7 6.99v10.182z"/></svg>
                    </Link>
                    {/* <a className={`${styles.nav__link}`} id={`${styles.create__room__btn}`} href="lobby.html">
                        Create Room
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#ede0e0" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 13h-5v5h-2v-5h-5v-2h5v-5h2v5h5v2z"/></svg>
                    </a> */}
                    <WalletButton></WalletButton>
                </div>
            </header>
        </main>
    );
}
