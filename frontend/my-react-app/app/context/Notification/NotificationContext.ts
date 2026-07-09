import { createContext } from "react";
import { type Dispatch, type SetStateAction } from "react";

import { type Notifications } from "~/components/NotificationBox/NotificationBox";

const NotificationContext = createContext<{
  notifications: Notifications[];
  notificationsSetter: Dispatch<SetStateAction<any>>;
} | null>(null);

const addNotification = (
  notificationContext: any,
  notification: Notifications,
  duration: number
) => {
  notificationContext?.notificationsSetter([
    ...notificationContext.notifications,
    {
      notificationId: notification.notificationId,
      notificationMessage: notification.notificationMessage,
      notificationType: notification.notificationType,
    },
  ]);

  setTimeout(() => {
    notificationContext?.notificationsSetter(
      (prevNotifications: Notifications[]) => {
        return prevNotifications.filter(
          (ele) => ele.notificationId !== notification.notificationId
        );
      }
    );
  }, duration);
};

export default NotificationContext;
export { addNotification };
