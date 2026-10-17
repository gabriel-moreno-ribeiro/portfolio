import { FaMinus, FaPlus } from "react-icons/fa6";
import { RiContractLeftRightFill, RiExpandUpDownFill } from "react-icons/ri";

interface PropsInterface {
  onClose: () => void;
  onExpand: () => void;
  onMinimise: () => void;
  isExpanded: boolean;
}

// The three window lights, as real buttons so they have names and take focus.
function MacButtons({
  onClose,
  onExpand,
  onMinimise,
  isExpanded,
}: PropsInterface) {
  const buttons = [
    {
      color: "#FF6057",
      label: "Close window",
      icon: <FaPlus className="icon expand-icon" aria-hidden="true" />,
      onClick: onClose,
    },
    {
      color: "#FEBB30",
      label: "Minimize window",
      icon: <FaMinus className="icon" aria-hidden="true" />,
      onClick: onMinimise,
    },
    {
      color: "#2ED158",
      label: isExpanded ? "Restore window size" : "Maximize window",
      icon: isExpanded ? (
        <RiContractLeftRightFill className="icon expand-icon" aria-hidden="true" />
      ) : (
        <RiExpandUpDownFill className="icon expand-icon" aria-hidden="true" />
      ),
      onClick: onExpand,
    },
  ];

  return (
    <div className="mac-buttons-flex">
      {buttons.map((button) => (
        <button
          type="button"
          key={button.label}
          className="mac-button"
          aria-label={button.label}
          onClick={button.onClick}
          style={{ backgroundColor: button.color, color: button.color }}
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
}

export default MacButtons;
