import { useState } from "react";
import { work } from "../../constants/work";
import Tabs from "./Tabs";
import WorkCard from "./WorkCard";

function FindMyWork() {
  const tabs = ["Projects", "Youtube", "Published"];
  const [activeTab, setActiveTab] = useState<number>(0);
  return (
    <div className="find-my-work" data-lenis-prevent id="work">
      <h1 className="heading">Find My Work</h1>
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="work-content" id="work-content-scroll-div">
        {work[activeTab]?.map((data, i) => (
          <WorkCard key={i} data={data} />
        ))}
      </div>
    </div>
  );
}

export default FindMyWork;
