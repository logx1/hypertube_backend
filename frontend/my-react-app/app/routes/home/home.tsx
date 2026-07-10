import type { Route } from "./+types/home";
import styles from "./home.module.css";
import { v4 as uuidv4 } from "uuid";
import { useContext, useState } from "react";
import NotificationContext, {
  addNotification,
} from "~/context/Notification/NotificationContext";
import { useEffect } from "react";
import Slider from "~/components/Slider/Slider";
import { Link } from "react-router";
import { getCookie } from "~/tools/getCookie";
import { useNavigate } from "react-router";
import LanguagesContext from "~/context/Languages/Languages";
import langs from "../../../lang.json";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

interface PopularMoviesResponse {
  name?: string;
  production_year?: string;
  cover_image?: string;
  rating?: number;
}

export default function Home() {
  const [trendingVideos, setTrendingVideos] = useState(
    new Array(10).fill(null)
  );
  const [popularMovies, setPopularMovies] = useState<PopularMoviesResponse[]>(
    []
  );
  const notificationContext = useContext(NotificationContext);
  const langContext = useContext(LanguagesContext);
  let navigate = useNavigate();

  const handle = () => {
    console.log("fuck");

    addNotification(
      notificationContext,
      {
        notificationId: uuidv4(),
        notificationMessage: "fuffufuck",
        notificationType: "error",
      },
      3000
    );
  };

  const pushNotification = (type: "error" | "success", msg: string) => {
    addNotification(
      notificationContext,
      {
        notificationId: uuidv4(),
        notificationMessage: msg,
        notificationType: type,
      },
      3000
    );
  };

  useEffect(() => {
    // console.log(import.meta.env.VITE_BACKEND_URL);
    const authToken: string | undefined = getCookie(document.cookie, "token");
    if (!authToken) {
      navigate("/login");
      return;
    }

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/search/popular`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then(async (res) => {
        if (res.status !== 200) {
          pushNotification(
            "error",
            "Something went wrong. couldn't fetch popular movies"
          );
          return;
        }
        res
          .json()
          .then((jres) => {
            console.log(jres);
            setPopularMovies(jres.results);
          })
          .catch((err) => {
            pushNotification("error", "Couldn't parse the server response");
          });
      })
      .catch((err) => {
        alert("Couldn't react the server");
        pushNotification("error", "Couldn't reach the server");
      });
  }, []);

  return (
    <div className={`${styles.homeContainer}`}>
      {popularMovies.length === 0 && (
        <div className={styles.moviesLoading}></div>
      )}
      {popularMovies.length > 0 && (
        <>
          <Slider items={popularMovies} />
          <section className={styles.pageSection}>
            <div className={styles.sectionTitle}>
              <h2>{langContext?.data.data.homePage.alsoPopular}</h2>
              <div className={`${styles.sectionButtons} `}></div>
            </div>
            <div className={styles.alsoPopularContainer}>
              {/* <div className={styles.movieContainer}> */}
              {popularMovies.map((ele: any) => {
                return (
                  <Link
                    className={styles.movieHolder}
                    to={`/movieInfos/${ele.movie_id}/${ele.name}/${ele.production_year}`}
                    // onMouseMove={mouseEnter}
                    key={uuidv4()}
                  >
                    <img src={ele.cover_image} alt="" />
                    <div className={styles.descriptionContainer}>
                      <p className={styles.movieName}>{ele.name}</p>

                      <p>{ele.production_year}</p>
                    </div>
                  </Link>
                );
              })}

              {/* </div> */}
            </div>
          </section>
        </>
      )}

      {/* <button onClick={handle}>Click click</button> */}
      {/* {x.map((ele) => {
        return <h1 key={uuidv4()}>hi</h1>;
      })} */}
    </div>
  );
}
