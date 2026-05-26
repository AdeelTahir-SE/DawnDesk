import WelcomeScreen from "../components/WelcomeScreen";
import DevToolsHub from "../components/dev-tools/DevToolsHub";

export default function DevTools() {
  return (
    <WelcomeScreen appKey="devtools" title="Developer Tools" description="Experimental tools and testing environment.">
      <div className="flex h-full w-full bg-[#0a0a0a]">
        <DevToolsHub />
      </div>
    </WelcomeScreen>
  );
}
