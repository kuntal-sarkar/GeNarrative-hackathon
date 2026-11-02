
import HomeHero from "../components/home/HomeHero";
import QuickStart from "../components/home/QuickStart";
import RecentProjects from "../components/home/RecentProjects";
import HomeAssistant from "../components/home/HomeAssistant";

import "./Home.css";

export default function Home() {
  return (
    <div className="home-page">
      <HomeHero />
      <QuickStart />
      <RecentProjects />
      <HomeAssistant />
    </div>
  );
}
