import styles from "./PrimaryInput.module.css";

export interface PrimaryInputProps {
  width: string;
  placeHolder: string;
  type: "text" | "password" | "email";
  leftIcon: any;
  leftIconClick?: null | (() => void);
  rightIcon?: any;
  rightIconCLick?: null | (() => void);
  value: string;
  onChange: (e: any) => void;
  name: string;
  onBlur?: () => void;
}

export default function PrimaryInput({
  width = "100%",
  placeHolder = "Type what you want",
  type = "text",
  leftIcon = null,
  rightIcon = null,
  leftIconClick = null,
  rightIconCLick = null,
  onChange = (e) => {},
  value = "",
  name = "",
  onBlur = () => {},
}: PrimaryInputProps) {
  return (
    <div className={styles.primaryInputContainer} style={{ width }}>
      {leftIconClick === null && (
        <span className={`${styles.icon} ${styles.leftIcon}`}>{leftIcon}</span>
      )}
      {leftIconClick !== null && (
        <span
          className={`${styles.icon} ${styles.leftIcon}`}
          style={{ cursor: "pointer" }}
          onClick={leftIconClick}
        >
          {leftIcon}
        </span>
      )}
      <input
        className={styles.primaryInput}
        type={type}
        placeholder={placeHolder}
        value={value}
        onChange={onChange}
        name={name}
        onBlur={onBlur}
        autoComplete="off"
      />
      {rightIconCLick === null && (
        <span className={`${styles.icon} ${styles.rightIcon}`}>
          {rightIcon !== null && rightIcon}
        </span>
      )}
      {rightIconCLick !== null && (
        <span
          className={`${styles.icon} ${styles.rightIcon}`}
          onClick={rightIconCLick}
          style={{ cursor: "pointer" }}
        >
          {rightIcon !== null && rightIcon}
        </span>
      )}
    </div>
  );
}
