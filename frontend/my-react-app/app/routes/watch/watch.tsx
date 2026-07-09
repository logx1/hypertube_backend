import { useState, useEffect } from "react";
import styles from "./watch.module.css";
import { useParams } from "react-router";
import { getCookie } from "~/tools/getCookie";
import PopupBox, { type PopupBoxConfig } from "~/components/PopupBox/PopupBox";
import { useNavigate } from "react-router";
import { memo } from "react";
import CommentsSection from "~/components/Comments/Comments";
import PrimaryButton from "~/components/Button/PrimaryButton";

const VideoBox = memo(({ url }: { url: string }) => {
  console.log(url);
  return <video src={url} controls></video>;
});

const Watch = () => {
  console.log("Render");
  let { identifier, name, year, identifier144, quality } = useParams();
  console.log(identifier, name);
  const [isMovieDownloaded, setIsMovieDownloaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [progress, setProgress] = useState<number>(0);

  const [showStreamOptions, setShowStreamOptions] = useState<boolean>(false);
  const navigate = useNavigate();

  const [responseBox, setResponseBox] = useState<{
    boxConfig: any;
  }>({
    boxConfig: {
      title: "",
      description: "",
      icon: null,
      color: "",
    },
  });

  const [isMovieNotAvailable, setIsMovieNotAvailable] =
    useState<boolean>(false);

  useEffect(() => {
    const accessToken = getCookie(document.cookie, "token");
    if (!accessToken) return;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/user/save_watched`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: name,
        year: year,
      }),
    })
      .then((res) => {
        console.log(res.status);
      })
      .catch((err) => {
        console.log("Couldn't serve it");
      });
  }, []);

  useEffect(() => {
    let count = 0;
    let exit = false;
    let progress = 0;
    const intervalId = setInterval(() => {
      if (count === 5) {
        setIsMovieNotAvailable(true);
        clearInterval(intervalId);
        return;
      }
      if (exit == true) {
        setIsMovieDownloaded(true);
        clearInterval(intervalId);
        return;
      }
      const accessToken = getCookie(document.cookie, "token");
      if (!accessToken) {
        console.log("NO TOKEN");
        return;
      }
      fetch(
        `${import.meta.env.VITE_BACKEND_URL}/stream/download_status?identifier="${identifier}"`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
        .then(async (res) => {
          console.log(count);
          console.log(res.status);
          if (res.status === 200) {
            res.json().then((jres) => {
              console.log(jres);
              console.log(jres.progress);
              if (jres.progress != progress) {
                progress = jres.progress;
                setProgress(jres.progress);
                count = 0;
              }
              if (jres.completed === true || jres.progress > 3) {
                // TODO show movie
                // setShowStreamOptions(jres.completed);
                setProgress(jres.progress);
                exit = true;
                return;
              } else {
                // TODO check the progress
                // if the progress is more than 3%
                // render the movies
              }
            });
          }
        })
        .catch((err) => {
          console.log(count);
          console.log("Coulnd't reach server");
        });
      count++;
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const accessToken = getCookie(document.cookie, "token");
    fetch(
      `${import.meta.env.VITE_BACKEND_URL}//stream/download_status?identifier=${identifier144}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
      .then((res) => {
        console.log(res.status);
        res
          .json()
          .then((jres) => {
            console.log(jres);
            setShowStreamOptions(jres.completed);
          })
          .catch((err) => {
            console.log("Couldn't parse json response");
          });
      })
      .catch((err) => {
        console.log("something went wrong");
      });
  }, []);

  return (
    <div className={styles.watchPage}>
      {isMovieNotAvailable && (
        <div className={styles.notAvailableBox}>
          <PopupBox
            title="Not available"
            description="Movie not available at this time"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 16 16"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="m7.493.015l-.386.04c-1.873.187-3.76 1.153-5.036 2.579C.66 4.211-.057 6.168.009 8.253c.115 3.601 2.59 6.65 6.101 7.518a8.03 8.03 0 0 0 6.117-.98a8 8 0 0 0 3.544-4.904c.172-.701.212-1.058.212-1.887s-.04-1.186-.212-1.887C14.979 2.878 12.315.498 9 .064C8.716.027 7.683-.006 7.493.015m1.36 1.548a6.3 6.3 0 0 1 1.987.597c.698.34 1.18.686 1.747 1.253A6 6 0 0 1 13.84 5.16c.445.915.646 1.798.646 2.84a6.2 6.2 0 0 1-.66 2.867c-.172.351-.519.914-.681 1.105l-.055.065l-4.563-4.564L3.963 2.91l.065-.055c.191-.162.754-.509 1.105-.681a6.44 6.44 0 0 1 3.72-.611M7.48 8.534l4.56 4.561l-.067.053a7.7 7.7 0 0 1-1.106.68a6.8 6.8 0 0 1-1.987.616c-.424.065-1.336.065-1.76 0c-1.948-.296-3.592-1.359-4.627-2.993a7.5 7.5 0 0 1-.634-1.332a6.6 6.6 0 0 1-.189-3.584a6.8 6.8 0 0 1 1.096-2.388c.07-.095.133-.173.141-.173s2.065 2.052 4.573 4.56"
                ></path>
              </svg>
            }
            color="rgba(255, 0, 0, 0.318)"
            closeBox={() => {
              navigate("/");
            }}
          />
        </div>
      )}
      {!isMovieDownloaded && !isMovieNotAvailable && (
        <div className={styles.loading}>
          <div className={styles.loadingBox}></div>
          <p>{progress}%</p>
        </div>
      )}

      {isMovieDownloaded && (
        <>
          <div className={styles.videoBox}>
            <div className={styles.videoWrapper}>
              <h2>{name}</h2>
              <br />
              <VideoBox
                url={`https://localhost/stream/watch?identifier=${quality === "144" ? identifier144 : identifier}`}
              />
              <br />
              <br />
              {showStreamOptions && (
                <div
                  className={styles.moviesOptionsContainer}
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "center",
                    columnGap: "20px",
                  }}
                >
                  <PrimaryButton
                    text="Default"
                    width="unset"
                    padding="10px 10px"
                    onClick={() => {
                      navigate(
                        `/watch/${identifier}/${identifier144}/${name}/${year}/default`
                      );
                    }}
                  />
                  <PrimaryButton
                    text="144p"
                    width="unset"
                    padding="10px 10px"
                    onClick={() => {
                      navigate(
                        `/watch/${identifier}/${identifier144}/${name}/${year}/144`
                      );
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className={styles.commentsContainer}>
            <CommentsSection identifier={identifier || ""} />
          </div>
        </>
      )}
    </div>
  );
};

export default Watch;
