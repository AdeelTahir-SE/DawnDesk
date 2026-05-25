import { useState } from "react";
import WelcomeScreen from "../components/WelcomeScreen";
import DevToolsHub from "../components/dev-tools/DevToolsHub";
import ToolWorkspace from "../components/dev-tools/ToolWorkspace";
import { DevTool } from "../components/dev-tools/devToolsList";

// Import specific tool UIs
import FontExtractorUI from "../components/dev-tools/tools/FontExtractorUI";
import RegexTesterUI from "../components/dev-tools/tools/RegexTesterUI";
import ColorExtractorUI from "../components/dev-tools/tools/ColorExtractorUI";
import GenericToolUI from "../components/dev-tools/tools/GenericToolUI";

export default function DevTools() {
  const [activeTool, setActiveTool] = useState<DevTool | null>(null);

  const renderToolContent = () => {
    if (!activeTool) return null;

    switch (activeTool.id) {
      case "font-extractor":
        return <FontExtractorUI />;
      case "regex-tester":
        return <RegexTesterUI />;
      case "color-extractor":
        return <ColorExtractorUI />;
      default:
        return <GenericToolUI tool={activeTool} />;
    }
  };

  return (
    <WelcomeScreen appKey="devtools" title="Developer Tools" description="Experimental tools and testing environment.">
      <div className="flex h-full w-full bg-[#0a0a0a]">
        {!activeTool ? (
          <DevToolsHub onSelectTool={setActiveTool} />
        ) : (
          <ToolWorkspace tool={activeTool} onBack={() => setActiveTool(null)}>
            {renderToolContent()}
          </ToolWorkspace>
        )}
      </div>
    </WelcomeScreen>
  );
}
