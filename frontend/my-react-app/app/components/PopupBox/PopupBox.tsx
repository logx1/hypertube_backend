import styles from "./popupBox.module.css";
import PrimaryButton from "../Button/PrimaryButton";

export interface PopupBoxConfig {
  title: string;
  description: string;
  icon: any;
  color: string;
  position?: "fixed" | "absolute" | "relative";
  backgroundColor?: string;
  showAction?: boolean;
  closeBox: () => void;
}

const PopupBox = ({
  title,
  description,
  icon,
  color,
  closeBox,
  position = "fixed",
  backgroundColor = "background-color: rgba(0, 0, 0, 0.5)",
  showAction = true,
}: PopupBoxConfig) => {
  return (
    <div
      className={styles.popupContainer}
      id="popUpBox"
      onClick={(e) => {
        const div = e.target as HTMLElement;
        // console.log(div.id);
        if (div.id == "popUpBox") {
          closeBox();
        }
      }}
      style={{ position: position, backgroundColor: backgroundColor }}
    >
      <div className={styles.popupHolder}>
        <div className={styles.titleContainer}>
          <div
            className={styles.iconContainer}
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>
          <p>{title}</p>
        </div>
        <div className={styles.descriptionContainer}>
          <p>{description}</p>
        </div>
        {showAction && (
          <div className={styles.actionsContainer}>
            <PrimaryButton
              text="okay"
              onClick={() => {
                closeBox();
              }}
              width="40%"
              padding="10px 0px"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupBox;
