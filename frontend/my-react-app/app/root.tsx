import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import NavBar from "./components/NavBar/NavBar";
import LeftNavBar from "./components/LeftNavBar/LeftNavBar";
import NotificationBox from "./components/NotificationBox/NotificationBox";
import NotificationContext from "./context/Notification/NotificationContext";
import LanguagesContext from "./context/Languages/Languages";
import { useState } from "react";
import { type Notifications } from "./components/NotificationBox/NotificationBox";
import SearchBox from "./components/SearchBox/SearchBox";
import { type LangProps } from "./context/Languages/Languages";
import langs from "../lang.json";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [sideNavBarStyle, setSideNavBarStyle] = useState<"full" | "collaps">(
    "collaps"
  );

  const [selectedLanguage, setSelectedLanguage] = useState<{
    lang: "en" | "fr";
    data: any;
  }>({
    lang: "en",
    data: langs.en,
  });

  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  const [showSearchBox, setShowSearchBox] = useState<boolean>(false);

  const searchBoxVisibility = (visibility: boolean) => {
    setShowSearchBox(visibility);
  };

  const changeLang = (lang: "en" | "fr") => {
    setSelectedLanguage((currentValue) => {
      const newObj = { ...currentValue };
      ((newObj.lang = lang),
        (newObj.data = lang === "en" ? langs.en : langs.fr));

      return newObj;
    });
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <NotificationContext.Provider
          value={{
            notifications: notifications,
            notificationsSetter: setNotifications,
          }}
        >
          <LanguagesContext.Provider
            value={{
              data: selectedLanguage,
              change: changeLang,
            }}
          >
            {showSearchBox && (
              <SearchBox searchBoxVisibility={searchBoxVisibility} />
            )}
            <NotificationBox />

            {!isAuthPage && (
              <NavBar
                navBarStyle={sideNavBarStyle}
                setSideNavBarStyle={setSideNavBarStyle}
                openSearchBox={searchBoxVisibility}
              />
            )}

            {!isAuthPage ? (
              <div className={`appContainer`}>
                <LeftNavBar
                  navBarStyle={sideNavBarStyle}
                  changeLang={changeLang}
                />
                <div
                  className={`toHide ${sideNavBarStyle === "full" ? "hideToHide" : ""}`}
                ></div>
                <div
                  className={`contentContainer ${sideNavBarStyle === "full" ? "contentContainerFull" : ""}`}
                >
                  <div className="contentWrapper">{children}</div>
                </div>
              </div>
            ) : (
              children
            )}
          </LanguagesContext.Provider>
        </NotificationContext.Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
