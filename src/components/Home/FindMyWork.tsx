import { lazy, Suspense, useState } from "react";
import { work } from "../../constants/work";
import Tabs from "./Tabs";
import WorkCard from "./WorkCard";

const Terminal = lazy(() => import("../Terminal/Terminal"));

function FindMyWork() {
  const tabs = ["Ventures", "Social Impact", "Achievements", "Terminal"];
  const [activeTab, setActiveTab] = useState<number>(0);
  return (
    <div className="find-my-work" id="work">
      <h1 className="heading" data-color-inverted={"true"}>
        <span data-fun="ctrl+F my work">Find My Work</span>
      </h1>
      <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} badges={{ 3: "New" }} />
      {activeTab === 3 ? (
        <Suspense fallback={null}>
          <Terminal onClose={() => setActiveTab(0)} />
        </Suspense>
      ) : (
        <div className="work-content" id="work-content-scroll-div">
          {work[activeTab]?.map((data, i) => (
            <WorkCard key={i} data={data} cardIndex={activeTab * 100 + i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FindMyWork;
