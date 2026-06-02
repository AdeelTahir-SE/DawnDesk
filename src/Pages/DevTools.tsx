import DevToolsHub from "../components/dev-tools/DevToolsHub";
import WelcomeScreen from "../components/WelcomeScreen";

export default function DevTools() {
  return (
    <WelcomeScreen appKey="devtools" title="Developer Tools" description="Use practical utilities for code, data, network checks, and local development work.">
      <div className="flex h-full w-full bg-[#0a0a0a] overflow-hidden">
        <DevToolsHub />
      </div>
    </WelcomeScreen>
  );
}
