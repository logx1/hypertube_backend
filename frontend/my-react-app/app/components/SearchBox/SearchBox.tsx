import styles from "./SearchBox.module.css";
import PrimaryInput from "../Input/PrimaryInput";
import { useState, type ChangeEvent, useContext } from "react";
import { Link } from "react-router";
import NotificationContext, {
  addNotification,
} from "~/context/Notification/NotificationContext";
import { v4 as uuid } from "uuid";
import { getCookie } from "~/tools/getCookie";
import { useNavigate } from "react-router";
import LanguagesContext from "~/context/Languages/Languages";
import langs from "../../../lang.json";

export default function SearchBox({
  searchBoxVisibility,
}: {
  searchBoxVisibility: (visibility: boolean) => void;
}) {
  const [userInput, setUserInput] = useState<string>("");
  const [searchResult, setSearchResult] = useState<any>([]);
  const notificationContext = useContext(NotificationContext);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  let navigate = useNavigate();
  const langsContext = useContext(LanguagesContext);

  const pushNotification = (type: "error" | "success", msg: string) => {
    addNotification(
      notificationContext,
      {
        notificationId: uuid(),
        notificationMessage: msg,
        notificationType: type,
      },
      3000
    );
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const authToken = getCookie(document.cookie, "token");

    console.log(authToken);

    setUserInput(e.currentTarget.value);
    if (!authToken) {
      navigate("/login");
      searchBoxVisibility(false);
      return;
    }
    setSearchResult([]);
    setIsSearchLoading(true);
    fetch(
      `${import.meta.env.VITE_BACKEND_URL}/search/?q="${e.currentTarget.value}"`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    )
      .then((res) => {
        if (res.status != 200) {
          pushNotification("error", "Something went wrong");
          return;
        }
        res
          .json()
          .then((jres) => {
            console.log(jres);
            setSearchResult(jres.results);
            setIsSearchLoading(false);
          })
          .catch((err) => {
            pushNotification("error", "Couldn't parse the json response");
          });
      })
      .catch((err) => {
        pushNotification("error", "Couldn't reach the server");
      });
  };
  return (
    <div
      className={styles.searchBoxContainer}
      onClick={(e) => {
        const target = e.target as HTMLDivElement;
        if (target.className === styles.searchBoxContainer) {
          searchBoxVisibility(false);
        }
      }}
    >
      <div className={styles.searchBoxHolder}>
        <div className={styles.inputContainer}>
          <PrimaryInput
            width="100%"
            type="text"
            placeHolder="Search for a movie"
            name="searchInput"
            value={userInput}
            onChange={handleInputChange}
            leftIcon={
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
                  d="M19 11.5a7.5 7.5 0 1 1-15 0a7.5 7.5 0 0 1 15 0m-2.107 5.42l3.08 3.08"
                ></path>
              </svg>
            }
            leftIconClick={null}
          />
        </div>
        <div className={styles.searchResultContainer}>
          {isSearchLoading === true && (
            <div className={styles.loadingContainer}>
              <div className={styles.loading}></div>
            </div>
          )}

          {searchResult.map((ele: any) => {
            return (
              <Link
                to={`/movieInfos/${ele.movie_id}/${ele.name}/${ele.production_year}`}
                className={styles.searchBoxItemContainer}
                key={uuid()}
                onClick={() => {
                  searchBoxVisibility(false);
                }}
              >
                <img className={styles.searchBoxImg} src={ele.cover_image} />
                <p className={styles.movieName}>{ele.name}</p>
                <p className={styles.productionYear}>{ele.production_year}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
