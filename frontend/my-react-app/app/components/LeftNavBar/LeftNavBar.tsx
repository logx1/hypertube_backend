import styles from "./LeftNavBar.module.css";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { useContext, useState } from "react";
import LanguagesContext from "~/context/Languages/Languages";
import langs from "../../../lang.json";

interface NavItem {
  icon: any;
  text: string;
  link: string;
}

function IconWrapper({ icon }: { icon: any }) {
  return icon;
}

function NavBarItem({ icon, text, link }: NavItem) {
  return (
    <li>
      <Link to={link}>
        <IconWrapper icon={icon} />
        <span>{text}</span>
      </Link>
    </li>
  );
}

export default function LeftNavBar({
  navBarStyle,
  changeLang,
}: {
  navBarStyle: "full" | "collaps";
  changeLang: (lang: "en" | "fr") => void;
}) {
  const navigate = useNavigate();
  const langContext = useContext(LanguagesContext);
  const [languagesVisibility, setLanguagesVisibility] =
    useState<boolean>(false);
  console.log(langContext);
  return (
    <nav
      className={`${styles.leftNavBar} ${navBarStyle === "full" ? styles.expandLeftNavBar : ""}`}
    >
      <ul>
        <NavBarItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20.71 18.65v-7.622a3 3 0 0 0-1.151-2.362l-6.326-4.951a2 2 0 0 0-2.466 0l-6.326 4.95a3 3 0 0 0-1.15 2.363v7.622c0 1.16.94 2.1 2.1 2.1h3.97v-7.965h5.278v7.965h3.97a2.1 2.1 0 0 0 2.1-2.1"
              ></path>
            </svg>
          }
          text={langContext?.data.data.homePage.home}
          link="/"
        />

        <NavBarItem
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
            >
              <g fill="none" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinejoin="round"
                  d="M4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
                ></path>
                <circle cx={12} cy={7} r={3}></circle>
              </g>
            </svg>
          }
          text={langContext?.data.data.homePage.profile}
          link="/profile"
        />
        <li>
          <button
            onClick={() => {
              setLanguagesVisibility((currentState) => !currentState);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M363 176L246 464h47.24l24.49-58h90.54l24.49 58H480Zm-26.69 186L363 279.85L389.69 362ZM272 320c-.25-.19-20.59-15.77-45.42-42.67c39.58-53.64 62-114.61 71.15-143.33H352V90H214V48h-44v42H32v44h219.25c-9.52 26.95-27.05 69.5-53.79 108.36c-32.68-43.44-47.14-75.88-47.33-76.22L143 152l-38 22l6.87 13.86c.89 1.56 17.19 37.9 54.71 86.57c.92 1.21 1.85 2.39 2.78 3.57c-49.72 56.86-89.15 79.09-89.66 79.47L64 368l23 36l19.3-11.47c2.2-1.67 41.33-24 92-80.78c24.52 26.28 43.22 40.83 44.3 41.67L255 362Z"
              ></path>
            </svg>
            {/* Languages */}
            {langContext?.data.data.homePage.languages}
          </button>
          {languagesVisibility && (
            <ul style={{ paddingTop: "0" }}>
              <li>
                <button
                  onClick={() => {
                    changeLang("en");
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 36 36"
                  >
                    <path
                      fill="#b22334"
                      d="M35.445 7C34.752 5.809 33.477 5 32 5H18v2zM0 25h36v2H0zm18-8h18v2H18zm0-4h18v2H18zM0 21h36v2H0zm4 10h28c1.477 0 2.752-.809 3.445-2H.555c.693 1.191 1.968 2 3.445 2M18 9h18v2H18z"
                    ></path>
                    <path
                      fill="#eee"
                      d="M.068 27.679q.025.14.059.277q.04.15.092.296c.089.259.197.509.333.743L.555 29h34.89l.002-.004a4 4 0 0 0 .332-.741a4 4 0 0 0 .152-.576c.041-.22.069-.446.069-.679H0c0 .233.028.458.068.679M0 23h36v2H0zm0-4v2h36v-2H18zm18-4h18v2H18zm0-4h18v2H18zM.555 7l-.003.005zM.128 8.044c.025-.102.06-.199.092-.297a4 4 0 0 0-.092.297M18 9h18c0-.233-.028-.459-.069-.68a3.6 3.6 0 0 0-.153-.576A4 4 0 0 0 35.445 7H18z"
                    ></path>
                    <path
                      fill="#3c3b6e"
                      d="M18 5H4a4 4 0 0 0-4 4v10h18z"
                    ></path>
                    <path
                      fill="#fff"
                      d="m2.001 7.726l.618.449l-.236.725L3 8.452l.618.448l-.236-.725L4 7.726h-.764L3 7l-.235.726zm2 2l.618.449l-.236.725l.617-.448l.618.448l-.236-.725L6 9.726h-.764L5 9l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L9 9l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L13 9l-.235.726zm-8 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L5 13l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L9 13l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L13 13l-.235.726zm-6-6l.618.449l-.236.725L7 8.452l.618.448l-.236-.725L8 7.726h-.764L7 7l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 7l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 7l-.235.726zm-12 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L3 11l-.235.726zM6.383 12.9L7 12.452l.618.448l-.236-.725l.618-.449h-.764L7 11l-.235.726h-.764l.618.449zm3.618-1.174l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 11l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 11l-.235.726zm-12 4l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L3 15l-.235.726zM6.383 16.9L7 16.452l.618.448l-.236-.725l.618-.449h-.764L7 15l-.235.726h-.764l.618.449zm3.618-1.174l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L11 15l-.235.726zm4 0l.618.449l-.236.725l.617-.448l.618.448l-.236-.725l.618-.449h-.764L15 15l-.235.726z"
                    ></path>
                  </svg>
                  English
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    changeLang("fr");
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 36 36"
                  >
                    <path
                      fill="#ed2939"
                      d="M36 27a4 4 0 0 1-4 4h-8V5h8a4 4 0 0 1 4 4z"
                    ></path>
                    <path
                      fill="#002495"
                      d="M4 5a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h8V5z"
                    ></path>
                    <path fill="#eee" d="M12 5h12v26H12z"></path>
                  </svg>
                  French
                </button>
              </li>
            </ul>
          )}
        </li>
        <li>
          <button
            onClick={() => {
              const today = new Date();
              const tomorrow = new Date(today.getTime() - 24 * 60 * 60 * 1000);
              const expirationString = tomorrow.toUTCString();
              document.cookie = `token=; path=/;expires=${expirationString}`;
              window.location.href = "/";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h7v2zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"
              ></path>
            </svg>{" "}
            {langContext?.data.data.homePage.logout}
          </button>
        </li>
      </ul>
    </nav>
  );
}
