import VideoEditorOnboarding from "../components/video-editor/VideoEditorOnboarding";
import { VideoEditorProvider } from "../engine/video-editor/VideoEditorContext";
import VideoEditorInner from "../components/video-editor/VideoEditorInner";

export default function VideoEditor() {
    return (
        <VideoEditorOnboarding>
            <VideoEditorProvider>
                <VideoEditorInner />
            </VideoEditorProvider>
        </VideoEditorOnboarding>
    );
}