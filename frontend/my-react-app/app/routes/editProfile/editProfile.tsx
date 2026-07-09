import {
  useState,
  useContext,
  useCallback,
  useRef,
  type ChangeEvent,
} from "react";
import styles from "./editProfile.module.css";
import PrimaryInput from "~/components/Input/PrimaryInput";
import PrimaryButton from "~/components/Button/PrimaryButton";
import NotificationContext, {
  addNotification,
} from "~/context/Notification/NotificationContext";
import { v4 as uuidv4 } from "uuid";
import { getCookie } from "~/tools/getCookie";
import type { Route } from "./+types/editProfile";
import { redirect } from "react-router";
import PopupBox, { type PopupBoxConfig } from "~/components/PopupBox/PopupBox";
import LanguagesContext from "~/context/Languages/Languages";
import langs from "../../../lang.json";

interface editProfileInfos {
  fullName: string;
  firstName: string;
  lastName: string;
  username: string;
  emailAddress: string;
  currentPassword: string;
  newPassword: string;
  imageUrl: string;
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const authToken: string | undefined = getCookie(document.cookie, "token");
  if (!authToken) {
    return redirect("/login");
  }

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/api/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  if (res.status !== 200) {
    return null;
  }
  const info = await res.json();
  return info;
}

export default function EditProfile({ loaderData }: Route.ComponentProps) {
  console.log("render");
  const userInfo = loaderData;
  console.log(userInfo);

  const [formInfos, setFormInfos] = useState<editProfileInfos>({
    fullName: "",
    firstName: userInfo?.json.first_name || "",
    lastName: userInfo?.json.last_name || "",
    username: userInfo?.json.username || "not found",
    emailAddress: userInfo?.json.email || "",
    currentPassword: "",
    newPassword: "",
    imageUrl: userInfo.json.imageUrl || "http://localhost:3000/public/ff.avif",
  });
  const fileInput = useRef<HTMLInputElement | null>(null);

  const [updateEmailForm, setUpdateEmailForm] = useState<{
    email: string;
    password: string;
    confirmPassword: string;
  }>({
    email: userInfo.json.email,
    password: "",
    confirmPassword: "",
  });
  // console.log(formInfos);

  const [newProfilePic, setNewProfilePic] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmailIsLoading, setIsEmailIsLoading] = useState<boolean>(false);
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

  const langsContext = useContext(LanguagesContext);

  const closeBox = useCallback(() => {
    setResponseBox({ ...responseBox, showBox: false });
  }, []);

  const notificationContext = useContext(NotificationContext);

  // console.log(userInfo);

  const handleInputChange = (e: any) => {
    setFormInfos({ ...formInfos, [e.target.name]: e.target.value });
  };

  function fileToBase64(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // includes data:URL prefix
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }

  const saveChanges = () => {
    if (isLoading) return;
    const cookie = getCookie(document.cookie, "token");
    if (!cookie) {
      console.log("No auth cookie");
      return;
    }
    setIsLoading(true);

    // console.log(userInfo);

    const reqBody: any = {
      username: formInfos.username,
      first_name: formInfos.firstName,
      last_name: formInfos.lastName,
      email: formInfos.emailAddress,
    };

    if (newProfilePic) reqBody.imageUrl = newProfilePic;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/user/update`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${cookie}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth: reqBody,
      }),
    })
      .then(async (res) => {
        setIsLoading(false);

        if (res.status === 404) {
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
        }

        if (res.status === 200) {
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
        }

        console.log(res);
        console.log(await res.json());
      })
      .catch((err) => {
        console.log("Fucking catch");
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
    <div className={styles.editProfileContainer}>
      {responseBox.showBox && (
        <PopupBox
          title={responseBox.boxConfig.title}
          description={responseBox.boxConfig.description}
          icon={responseBox.boxConfig.icon}
          color={responseBox.boxConfig.color}
          closeBox={closeBox}
        />
      )}

      <div className={styles.pageHeader}>
        <h1>{langsContext?.data.data.editProfile.title}</h1>

        <p>{langsContext?.data.data.editProfile.desc}</p>
      </div>
      <div className={styles.personalInformationsContainer}>
        <h2>
          {/* <span> */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
              clipRule="evenodd"
            />
          </svg>
          {/* </span>{" "} */}
          {langsContext?.data.data.editProfile.boxTitle}
        </h2>

        <div className={styles.personalInformationsEditor}>
          <div className={styles.avatarContainer}>
            <button
              style={{ borderRadius: "50%" }}
              onClick={() => {
                if (fileInput.current === null) return;
                fileInput.current.click();
              }}
            >
              <img
                src={newProfilePic || formInfos.imageUrl}
                alt="profile picture"
                onError={(e) => {
                  console.log(e);
                }}
              />
            </button>
            <p>JPG or PNG. Max 2 MB</p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              max={1}
              onChange={async (e) => {
                const input = e.target as HTMLInputElement;
                if (!input || !input.files || input.files.length === 0) return;
                const file = input.files[0];
                // const imgUrl = URL.createObjectURL(file);
                const image64: any = await fileToBase64(file);
                setNewProfilePic(image64);
              }}
              style={{ display: "none" }}
            />
          </div>
          <form className={styles.infosContainer} action={saveChanges}>
            <div className={styles.inputsWrapper}>
              <div className={styles.inputHolder}>
                <label htmlFor="">
                  {langsContext?.data.data.editProfile.firstName}
                </label>
                <PrimaryInput
                  type="text"
                  placeHolder="First name"
                  value={formInfos.firstName}
                  onChange={handleInputChange}
                  width="100%"
                  name="firstName"
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>
              <div className={styles.inputHolder}>
                <label htmlFor="">
                  {langsContext?.data.data.editProfile.lastName}
                </label>
                <PrimaryInput
                  type="text"
                  placeHolder="Last name"
                  value={formInfos.lastName}
                  name="lastName"
                  leftIcon={<span></span>}
                  onChange={handleInputChange}
                  width="100%"
                />
              </div>
            </div>
            <div
              className={styles.inputsWrapper}
              style={{ gridTemplateColumns: "1fr" }}
            >
              <div className={styles.inputHolder}>
                <label htmlFor="">
                  {langsContext?.data.data.editProfile.username}
                </label>
                <PrimaryInput
                  type="text"
                  placeHolder="username"
                  value={formInfos.username}
                  name="username"
                  onChange={handleInputChange}
                  width="100%"
                  leftIcon={<span></span>}
                />
              </div>
            </div>

            <div className={styles.submitContainer}>
              <PrimaryButton
                text={`${langsContext?.data.data.editProfile.submit}`}
                padding="10px 20px"
                width="30%"
                isLoading={isLoading}
              />
            </div>
          </form>

          {/* 00............................................................... */}
          <form
            className={styles.infosContainer}
            action={() => {
              const accessToken = getCookie(document.cookie, "token");
              if (!accessToken) return;
              setIsEmailIsLoading(true);
              fetch(
                `${import.meta.env.VITE_BACKEND_URL}/auth/user/email_update`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    auth: {
                      email: updateEmailForm.email,
                      password: updateEmailForm.password,
                      password_confirmation: updateEmailForm.confirmPassword,
                    },
                  }),
                }
              )
                .then((res) => {
                  console.log(res);
                  setIsEmailIsLoading(false);
                  if (res.status === 200) {
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
                  } else {
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
                  }
                })
                .catch((err) => {
                  console.log("Somethign went wrong");
                  setIsEmailIsLoading(false);
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
            }}
          >
            <h2>
              {/* <span> */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={30}
                height={30}
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M6 22q-.825 0-1.412-.587T4 20V10q0-.825.588-1.412T6 8h1V6q0-2.075 1.463-3.537T12 1t3.538 1.463T17 6v2h1q.825 0 1.413.588T20 10v10q0 .825-.587 1.413T18 22zm0-2h12V10H6zm7.413-3.588Q14 15.826 14 15t-.587-1.412T12 13t-1.412.588T10 15t.588 1.413T12 17t1.413-.587M9 8h6V6q0-1.25-.875-2.125T12 3t-2.125.875T9 6zM6 20V10z"
                ></path>
              </svg>
              {/* </span>{" "} */}
              {langsContext?.data.data.editProfile.editEmail}
            </h2>
            <div
              className={styles.inputsWrapper}
              style={{ gridTemplateColumns: "1fr" }}
            >
              <div className={styles.inputHolder}>
                <label htmlFor="">
                  {langsContext?.data.data.editProfile.email}
                </label>
                <PrimaryInput
                  type="text"
                  placeHolder="New email"
                  value={updateEmailForm.email}
                  onChange={(e: ChangeEvent) => {
                    const input = e.currentTarget as HTMLInputElement;
                    setUpdateEmailForm({
                      ...updateEmailForm,
                      email: input.value,
                    });
                  }}
                  width="100%"
                  name="firstName"
                  leftIcon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="25"
                      height="25"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        fillRule="evenodd"
                        d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>
            </div>
            <div
              className={styles.inputsWrapper}
              // style={{ gridTemplateColumns: "1fr" }}
            >
              <div className={styles.inputHolder}>
                <label htmlFor="">
                  {langsContext?.data.data.editProfile.password}
                </label>
                <PrimaryInput
                  type="text"
                  placeHolder="Password"
                  value={updateEmailForm.password}
                  name="password"
                  onChange={(e: ChangeEvent) => {
                    const input = e.currentTarget as HTMLInputElement;
                    setUpdateEmailForm({
                      ...updateEmailForm,
                      password: input.value,
                    });
                  }}
                  width="100%"
                  leftIcon={<span></span>}
                />
              </div>
              <div className={styles.inputHolder}>
                <label htmlFor="">
                  {langsContext?.data.data.editProfile.confirmPassword}
                </label>
                <PrimaryInput
                  type="text"
                  placeHolder="Confirm password"
                  value={updateEmailForm.confirmPassword}
                  name="username"
                  onChange={(e: ChangeEvent) => {
                    const input = e.currentTarget as HTMLInputElement;
                    setUpdateEmailForm({
                      ...updateEmailForm,
                      confirmPassword: input.value,
                    });
                  }}
                  width="100%"
                  leftIcon={<span></span>}
                />
              </div>
            </div>

            <div className={styles.submitContainer}>
              <PrimaryButton
                text={`${langsContext?.data.data.editProfile.submit}`}
                padding="10px 20px"
                width="30%"
                isLoading={isEmailIsLoading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
