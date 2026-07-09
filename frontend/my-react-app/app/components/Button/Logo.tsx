import { PlayCircle } from "lucide-react";
import styles from "./../../../app/routes/login/login.module.css";
export default function Logo() {
  return (
    <header className={styles.header}>
      <div className={styles.logoGroup}>
        <svg className={styles.logoIcon} viewBox="0 0 24 24" fill="#a8a5ff">
          <circle cx="12" cy="12" r="10" fill="white"></circle>
          <polygon points="10 8 16 12 10 16 10 8" fill="#a8a5ff"></polygon>
        </svg>
        <span className={styles.logoText}>HyperTube</span>
      </div>
      <a href="/" className={styles.backLink}>
        Home
      </a>
    </header>
  );
}
