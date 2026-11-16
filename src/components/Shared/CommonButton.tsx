import { ReactElement } from "react";

function CommonButton({
  Icon,
  text,
  onClick = () => {},
  variant = "primary",
  disabled = false,
  iconPosition = "left",
  customClass = "",
}: {
  Icon?: ReactElement;
  iconPosition?: "left" | "right";
  text?: string;
  onClick?: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  customClass?: string;
}) {
  return (
    <button
      className={`btn ${variant} ${customClass}`}
      onClick={onClick}
      style={{
        flexDirection: iconPosition === "right" ? "row-reverse" : "row",
      }}
    >
      {Icon && <div className="icon">{Icon}</div>}
      {text && <p className="text">{text}</p>}
    </button>
  );
}

export default CommonButton;
