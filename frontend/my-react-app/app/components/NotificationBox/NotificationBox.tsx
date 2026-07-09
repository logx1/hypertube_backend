import styles from "./NotificationBox.module.css";
import { useContext } from "react";
import NotificationContext from "~/context/Notification/NotificationContext";

export interface Notifications {
  notificationId: string;
  notificationMessage: string;
  notificationType: "success" | "error";
}

export function SuccessFeedBack({
  notificationMsg,
  notificationId,
}: {
  notificationMsg: string;
  notificationId: string;
}) {
  return (
    <div
      className={
        "" + styles.notificationContainer + " " + styles.successNotification
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={20}
        height={20}
        viewBox="0 0 48 48"
      >
        <defs>
          <mask id="SVG4IxzvcIZ">
            <g
              fill="none"
              stroke="#fff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={4}
            >
              <path
                fill="#555555"
                d="m24 4l5.253 3.832l6.503-.012l1.997 6.188l5.268 3.812L41 24l2.021 6.18l-5.268 3.812l-1.997 6.188l-6.503-.012L24 44l-5.253-3.832l-6.503.012l-1.997-6.188l-5.268-3.812L7 24l-2.021-6.18l5.268-3.812l1.997-6.188l6.503.012z"
              ></path>
              <path d="m17 24l5 5l10-10"></path>
            </g>
          </mask>
        </defs>
        <path
          fill="currentColor"
          d="M0 0h48v48H0z"
          mask="url(#SVG4IxzvcIZ)"
        ></path>
      </svg>

      <p>{notificationMsg}</p>

      <button>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
          ></path>
        </svg>
      </button>
    </div>
  );
}

export function ErrorFeedBack({
  notificationMsg,
}: {
  notificationMsg: string;
}) {
  return (
    <div
      className={
        "" + styles.notificationContainer + " " + styles.errorNotification
      }
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 18a8 8 0 0 1-8-8a8 8 0 0 1 8-8a8 8 0 0 1 8 8a8 8 0 0 1-8 8"
        ></path>
      </svg>

      <p>{notificationMsg}</p>

      <button>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
          ></path>
        </svg>
      </button>
    </div>
  );
}

export default function NotificationBox() {
  const notificationContext = useContext(NotificationContext);

  return (
    <div className={"" + styles.notificationsContainer}>
      {/* <SuccessFeedBack /> */}
      {notificationContext?.notifications.map((ele) => {
        if (ele.notificationType === "error")
          return (
            <ErrorFeedBack
              key={ele.notificationId}
              notificationMsg={ele.notificationMessage}
            />
          );
        else
          return (
            <SuccessFeedBack
              key={ele.notificationId}
              notificationMsg={ele.notificationMessage}
              notificationId={ele.notificationId}
            />
          );
      })}

      {/* <button
        onClick={() => {
          console.log(notificationContext);
        }}
      >
        Click
      </button> */}
    </div>
  );
}
