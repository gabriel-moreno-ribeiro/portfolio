import { useState } from "react";
import Tabs from "./Tabs";

function FindMyWork() {
  const tabs = ["Personal", "Professional", "Youtube", "Books"];
  const [activeTab, setActiveTab] = useState<number>(0);
  return (
    <div className="find-my-work">
      <h1 className="heading">Find My Work</h1>
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="content"></div>
    </div>
  );
}

export default FindMyWork;
