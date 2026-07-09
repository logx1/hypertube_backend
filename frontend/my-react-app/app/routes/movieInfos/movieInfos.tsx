import type { Route } from "./+types/movieInfos";

import styles from "./movieInfos.module.css";
import { useParams } from "react-router";
import { useEffect, useContext, useState } from "react";
import NotificationContext, {
  addNotification,
} from "~/context/Notification/NotificationContext";
import { v4 as uuid } from "uuid";
import { getCookie } from "~/tools/getCookie";
import { redirect } from "react-router";
import PopupBox from "~/components/PopupBox/PopupBox";
import { Link, useNavigate } from "react-router";
import LanguagesContext from "~/context/Languages/Languages";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const authToken: string | undefined = getCookie(document.cookie, "token");
  if (!authToken) {
    return redirect("/login");
  }

  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/search/movie_detail?id=${params.movieId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  const product = await res.json();
  console.log(product);
  return product;
}

// export function HydrateFallback() {
//   return <div>Loading...</div>;
// }

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function movieInfos({ loaderData }: Route.ComponentProps) {
  let { movieId, movieName, year } = useParams();
  const [movieInfos, setMovieInfos] = useState<any>({});
  const [isMovieWatched, setIsMovieWatched] = useState<boolean>(false);
  const notificationContext = useContext(NotificationContext);
  const [isWatched, setIsWatched] = useState(false);
  const data = loaderData;
  const navigate = useNavigate();

  const [moviesList, setMoviesList] = useState<any>([]);
  const langsContext = useContext(LanguagesContext);
  useEffect(() => {
    const accessToken = getCookie(document.cookie, "token");
    if (!accessToken) {
      alert("No token");
      return;
    }

    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/user/check_watched`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: movieName,
        year: year,
      }),
    })
      .then((res) => {
        console.log(res);
        if (res.status === 200) {
          setIsMovieWatched(true);
        }
      })
      .catch((err) => {
        console.log("Something went wrong");
      });
  }, []);

  useEffect(() => {
    const accessToken = getCookie(document.cookie, "token");
    if (!accessToken) {
      alert("No token");
      return;
    }
    fetch(
      `${import.meta.env.VITE_BACKEND_URL}/stream/torrent_search?title="${movieName}"`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
      .then((res) => {
        // console.log(res);
        if (res.status !== 200) return;

        res
          .json()
          .then((jres) => {
            console.log(jres);
            setMoviesList(jres);
          })
          .catch((err) => {});
      })
      .catch((err) => {});
  }, [window.location.href]);

  const selectToWatch = (
    identifier: string,
    torrentUrl: string,
    title: string,
    year: string
  ) => {
    console.log(identifier, torrentUrl);
    const accessToken = getCookie(document.cookie, "token");
    if (!accessToken) {
      console.log("No accessToken");
      return;
    }
    fetch(`${import.meta.env.VITE_BACKEND_URL}/stream/downloadx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        torrent_url: torrentUrl,
        identifier: identifier,
      }),
    })
      .then(async (res) => {
        console.log(await res.text());
        navigate(
          `/watch/${identifier}/${identifier}144/${title}/${year}/default`
        );
      })
      .catch((err) => {
        console.log("Couldn reach to server");
      });
  };

  return (
    <div className={styles.moviesInfoContainer}>
      <div className={styles.movieCover}>
        <img src={data.backdrop_image || data.cover_image} alt="" />
      </div>
      {isMovieWatched && <span className={styles.watchedInfo}>Watched</span>}

      <div className={styles.titleContainer}>
        <h1>{data.name}</h1>
        <div className={styles.genresContainer}>
          {data.genres.map((ele: any) => {
            return <span key={uuid()}>{ele}</span>;
          })}
          <span className={styles.releaseDate}>{data.release_date}</span>
        </div>
      </div>
      <p>{data.overview}</p>
      <h2 className={styles.actorsTitle}>
        {langsContext?.data.data.movieInfos.actors}
      </h2>
      <div className={styles.actorsContainer}>
        {data.actors.map((ele: any) => {
          return (
            <div className={styles.actorContainer} key={uuid()}>
              <img src={ele.profile_image} alt="" />
              <p>{ele.name}</p>
              <p>{ele.character}</p>
            </div>
          );
        })}
      </div>

      <h2>Torrent results</h2>
      <div className={styles.torrentResultCards}>
        {moviesList.map((ele: any) => {
          return (
            <div
              key={uuid()}
              className={styles.movieHolder}
              onClick={() => {
                selectToWatch(
                  ele.identifier,
                  ele.torrent_url,
                  ele.title,
                  ele.year
                );
              }}
            >
              <img src={ele.verification_image} alt={ele.title} />
              <div className={styles.descriptionContainer}>
                <p className={styles.movieName}>{ele.title}</p>

                <p>{ele.year}</p>
              </div>
            </div>
          );
        })}
        {moviesList.length === 0 && (
          // <div className={styles.noTorrentResult}></div>
          <PopupBox
            title="Nothing found"
            description="Couldn't find any result on torrent"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={30}
                height={30}
                viewBox="0 0 24 24"
              >
                <g fill="none">
                  <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"></path>
                  <path
                    fill="currentColor"
                    d="M17 10.5a6.5 6.5 0 1 0-13 0a6.5 6.5 0 0 0 13 0m-4.732-3.182a1 1 0 1 1 1.414 1.414L11.914 10.5l1.768 1.768l.069.076a1 1 0 0 1-1.407 1.407l-.076-.07l-1.768-1.767l-1.768 1.768a1 1 0 1 1-1.414-1.414L9.086 10.5L7.318 8.732l-.069-.076A1 1 0 0 1 8.656 7.25l.076.07L10.5 9.085zM19 10.5a8.46 8.46 0 0 1-1.826 5.26l3.654 3.654a1.001 1.001 0 0 1-1.414 1.415l-3.654-3.655A8.46 8.46 0 0 1 10.5 19a8.5 8.5 0 1 1 8.5-8.5"
                  ></path>
                </g>
              </svg>
            }
            closeBox={() => {}}
            color="rgba(255, 162, 0, 0.8)"
            position="relative"
            backgroundColor="transparent"
            showAction={false}
          />
        )}
        {/* <div className={styles.cardHolder}></div> */}
        {/* <div className={styles.resultTableHeader}>
          <span>Poster</span>
          <span>Title</span>

          <span>Identifier</span>
          <span>Torrent url</span>
          <span>Description</span>
        </div>

        {moviesList.map((ele: any) => {
          return (
            <div key={uuid()} className={styles.resultTableContent}>
              <div className={styles.imageContainer}></div>
              <span>{ele.title}</span>
              <span>{ele.identifier}</span>
              <span>{ele.torrent_url}</span>
              <span>{ele.description}</span>
            </div>
          );
        })} */}
      </div>
    </div>
  );
}

// {
//   "movie_id": 1225215,
//   "name": "Proje Ladik: Extended Cut",
//   "production_year": "2023",
//   "rating": 0,
//   "cover_image": "https://image.tmdb.org/t/p/w1280/dcYjdbB4On5FVHhIATS7SLg3NCb.jpg",
//   "overview": "An ex special agent is settled in a small village called \"Ladik\" for his retirement. One day in here he gets a call from his old partner. He is not safe here anymore. Now, he has to face his past and meet with his new enemies."
// }
