import type { Route } from "./+types/forgot";
import styles from "./forgot.module.css";
import PrimaryInput from "~/components/Input/PrimaryInput";
import PrimaryButton from "~/components/Button/PrimaryButton";
import React, { useState } from "react";
import { Link } from "react-router";
import PopupBox from "~/components/PopupBox/PopupBox";
import { useContext } from "react";
import LanguagesContext from "~/context/Languages/Languages";

export default function Forgot() {
  const [emailInput, setEmailInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const langsContext = useContext(LanguagesContext);

  const [responseBox, setResponseBox] = useState<{
    showBox: boolean;
    boxConfig: any;
  }>({
    showBox: false,
    boxConfig: {
      title: "",
      description: "",
      icon: null,
      color: "",
    },
  });

  const submit = (e: React.SubmitEvent) => {
    e.preventDefault();
    console.log(emailInput);
    if (isLoading) return;

    setIsLoading(true);

    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/forgot_password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailInput,
      }),
    })
      .then((res) => {
        if (res.status != 200) {
          console.log("Somthing wehnt wong");
          setIsLoading(false);
          setResponseBox((currentState) => {
            const newState = { ...currentState };
            newState.showBox = true;
            const newConfigBox = { ...newState.boxConfig };
            newConfigBox.title = langsContext?.data.data.editProfile.errorTitle;
            newConfigBox.description =
              langsContext?.data.data.editProfile.errorDesc;
            newConfigBox.icon = (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={30}
                height={30}
                viewBox="0 0 1024 1024"
              >
                <path
                  fill="currentColor"
                  d="M1017.06 186.064L917.364 74.721a31.96 31.96 0 0 0-23.937-10.752H543.171V30.001c0-16.56-14.336-30-32-30s-32 13.44-32 30V63.97H223.363c-17.68 0-32 14.32-32 32v223.664c0 17.68 14.32 32 32 32h255.808v64.096H130.58a31.96 31.96 0 0 0-23.936 10.752L6.963 539.793c-10.752 12.128-10.752 30.368 0 42.496l99.68 112.288c6.112 6.847 14.784 9.744 23.936 9.744h348.592V994c0 16.56 14.336 30 32 30s32-13.44 32-30V704.32h256.464c17.68 0 32-14.32 32-32V447.713c0-17.68-14.32-32-32-32H543.171v-64.096h350.256a31.96 31.96 0 0 0 23.937-10.752l99.696-112.32c10.736-12.112 10.736-30.352 0-42.48zM767.647 640.321H144.959l-71.28-79.28l71.28-81.312h622.688zm111.392-352.688h-623.68V127.969h623.68l71.28 79.344z"
                ></path>
              </svg>
            );
            newConfigBox.color = "rgba(128, 0, 0, 0.303)";
            newState.boxConfig = newConfigBox;
            return newState;
          });
          return;
        }
        res
          .json()
          .then((jres) => {
            console.log(jres);
            setIsLoading(false);
            setResponseBox((currentState) => {
              const newState = { ...currentState };
              newState.showBox = true;
              const newConfigBox = { ...newState.boxConfig };
              newConfigBox.title =
                langsContext?.data.data.editProfile.successTitle;
              newConfigBox.description =
                langsContext?.data.data.editProfile.successDescription;
              newConfigBox.icon = (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={30}
                  height={30}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="m9 20.42l-6.21-6.21l2.83-2.83L9 14.77l9.88-9.89l2.83 2.83z"
                  ></path>
                </svg>
              );
              newConfigBox.color = "rgba(0, 128, 0, 0.307)";
              newState.boxConfig = newConfigBox;
              return newState;
            });
          })
          .catch((err) => {
            console.log("Unexpected response format");
            setIsLoading(false);
            setResponseBox((currentState) => {
              const newState = { ...currentState };
              newState.showBox = true;
              const newConfigBox = { ...newState.boxConfig };
              newConfigBox.title =
                langsContext?.data.data.editProfile.errorTitle;
              newConfigBox.description =
                langsContext?.data.data.editProfile.errorDesc;
              newConfigBox.icon = (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={30}
                  height={30}
                  viewBox="0 0 1024 1024"
                >
                  <path
                    fill="currentColor"
                    d="M1017.06 186.064L917.364 74.721a31.96 31.96 0 0 0-23.937-10.752H543.171V30.001c0-16.56-14.336-30-32-30s-32 13.44-32 30V63.97H223.363c-17.68 0-32 14.32-32 32v223.664c0 17.68 14.32 32 32 32h255.808v64.096H130.58a31.96 31.96 0 0 0-23.936 10.752L6.963 539.793c-10.752 12.128-10.752 30.368 0 42.496l99.68 112.288c6.112 6.847 14.784 9.744 23.936 9.744h348.592V994c0 16.56 14.336 30 32 30s32-13.44 32-30V704.32h256.464c17.68 0 32-14.32 32-32V447.713c0-17.68-14.32-32-32-32H543.171v-64.096h350.256a31.96 31.96 0 0 0 23.937-10.752l99.696-112.32c10.736-12.112 10.736-30.352 0-42.48zM767.647 640.321H144.959l-71.28-79.28l71.28-81.312h622.688zm111.392-352.688h-623.68V127.969h623.68l71.28 79.344z"
                  ></path>
                </svg>
              );
              newConfigBox.color = "rgba(128, 0, 0, 0.303)";
              newState.boxConfig = newConfigBox;
              return newState;
            });
          });
      })
      .catch((err) => {
        console.log("Couldn't reach server");
        setIsLoading(false);
        setResponseBox((currentState) => {
          const newState = { ...currentState };
          newState.showBox = true;
          const newConfigBox = { ...newState.boxConfig };
          newConfigBox.title = langsContext?.data.data.editProfile.errorTitle;
          newConfigBox.description =
            langsContext?.data.data.editProfile.errorDesc;
          newConfigBox.icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={30}
              height={30}
              viewBox="0 0 1024 1024"
            >
              <path
                fill="currentColor"
                d="M1017.06 186.064L917.364 74.721a31.96 31.96 0 0 0-23.937-10.752H543.171V30.001c0-16.56-14.336-30-32-30s-32 13.44-32 30V63.97H223.363c-17.68 0-32 14.32-32 32v223.664c0 17.68 14.32 32 32 32h255.808v64.096H130.58a31.96 31.96 0 0 0-23.936 10.752L6.963 539.793c-10.752 12.128-10.752 30.368 0 42.496l99.68 112.288c6.112 6.847 14.784 9.744 23.936 9.744h348.592V994c0 16.56 14.336 30 32 30s32-13.44 32-30V704.32h256.464c17.68 0 32-14.32 32-32V447.713c0-17.68-14.32-32-32-32H543.171v-64.096h350.256a31.96 31.96 0 0 0 23.937-10.752l99.696-112.32c10.736-12.112 10.736-30.352 0-42.48zM767.647 640.321H144.959l-71.28-79.28l71.28-81.312h622.688zm111.392-352.688h-623.68V127.969h623.68l71.28 79.344z"
              ></path>
            </svg>
          );
          newConfigBox.color = "rgba(128, 0, 0, 0.303)";
          newState.boxConfig = newConfigBox;
          return newState;
        });
      });
  };

  return (
    <div className={styles.forgotContainer}>
      {responseBox.showBox && (
        <PopupBox
          title={responseBox.boxConfig.title}
          description={responseBox.boxConfig.description}
          icon={responseBox.boxConfig.icon}
          color={responseBox.boxConfig.color}
          closeBox={() => {
            setResponseBox({ ...responseBox, showBox: false });
          }}
        />
      )}

      <div className={styles.forgotHolder}>
        <div className={styles.header}>
          <div className={styles.iconBox}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="2em"
              height="2em"
              viewBox="0 0 24 24"
            >
              <path
                fill="var(--primaryColor)"
                d="M12.63 2c5.53 0 10.01 4.5 10.01 10s-4.48 10-10.01 10c-3.51 0-6.58-1.82-8.37-4.57l1.58-1.25C7.25 18.47 9.76 20 12.64 20a8 8 0 0 0 8-8a8 8 0 0 0-8-8C8.56 4 5.2 7.06 4.71 11h2.76l-3.74 3.73L0 11h2.69c.5-5.05 4.76-9 9.94-9m2.96 8.24c.5.01.91.41.91.92v4.61c0 .5-.41.92-.92.92h-5.53c-.51 0-.92-.42-.92-.92v-4.61c0-.51.41-.91.91-.92V9.23c0-1.53 1.25-2.77 2.77-2.77c1.53 0 2.78 1.24 2.78 2.77zm-2.78-2.38c-.75 0-1.37.61-1.37 1.37v1.01h2.75V9.23c0-.76-.62-1.37-1.38-1.37"
              ></path>
            </svg>
          </div>
          <h1>Reset your password</h1>
          <p>
            Enter the email address associated with your account and we'll send
            you a link to reset your password.
          </p>
        </div>

        <form className={styles.boxBody} onSubmit={submit}>
          <PrimaryInput
            width="100%"
            placeHolder="Email"
            type="email"
            value={emailInput}
            onChange={(e) => {
              setEmailInput(e.currentTarget.value);
            }}
            leftIcon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1.4em"
                height="1.4em"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M18.75 12a6.75 6.75 0 1 0-3.375 5.846a.75.75 0 0 1 .75 1.299A8.251 8.251 0 1 1 20.25 12a.75.75 0 0 1-1.5 0"
                ></path>
                <path
                  fill="currentColor"
                  d="M15.75 13a1.5 1.5 0 0 0 3 0h1.5a3 3 0 0 1-6 0z"
                ></path>
                <path
                  fill="currentColor"
                  d="M14.25 12a2.25 2.25 0 1 0-4.5 0a2.25 2.25 0 0 0 4.5 0m1.5 0a3.75 3.75 0 1 1-7.5 0a3.75 3.75 0 0 1 7.5 0m4.5-.75V13h-1.5v-1.75z"
                ></path>
                <path
                  fill="currentColor"
                  d="M14.25 14V9a.75.75 0 0 1 1.5 0v5a.75.75 0 0 1-1.5 0"
                ></path>
              </svg>
            }
            name="email"
          />
          <PrimaryButton text="Send reset link" isLoading={isLoading} />
          <Link to="/login">Back to sign in</Link>
        </form>
      </div>
    </div>
  );
}
