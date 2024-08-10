import { motion } from "framer-motion";

export interface TabsInterface {
  tabs: string[];
  activeTab: number;
  setActiveTab: (index: number) => void;
}
const Tabs = ({ tabs, activeTab, setActiveTab }: TabsInterface) => {
  return (
    <div className={"tabs"}>
      {tabs.map((tab, index) => (
        <div
          key={index}
          className={`${"tab"} ${activeTab === index ? "active" : ""}`}
          onClick={() => {
            setActiveTab(index);
            document.getElementById("work-content-scroll-div")?.scrollTo({
              left: 0,
              behavior: "smooth",
            });
          }}
        >
          {tab}
          {activeTab === index && (
            <motion.div
              layoutId="active-tab-indicator"
              className={"active-tab-indicator"}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default Tabs;
