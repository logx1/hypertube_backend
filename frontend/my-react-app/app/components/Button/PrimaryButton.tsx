import styles from "./PrimaryButton.module.css";

export interface PrimaryButtonProps {
  text?: string;
  padding?: string;
  onClick?: () => void;
  width?: string;
  isLoading?: Boolean;
}

const PrimaryButton = ({
  text = "Click!",
  padding = "15px 100px",
  onClick,
  width = "100%",
  isLoading = false,
}: PrimaryButtonProps) => {
  return (
    <button
      className={`${styles.primaryButton}`}
      style={{ padding: padding, width: width }}
      onClick={onClick}
      disabled={isLoading ? true : false}
    >
      {isLoading && <div className={styles.loadingBox}></div>}
      {!isLoading && text}
    </button>
  );
};

export default PrimaryButton;
