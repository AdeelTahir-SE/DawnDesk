# DawnDesk Workflow Builder Features

## Overview

The Workflow Builder is a visual node-based automation surface for connecting DawnDesk tools, inputs, outputs, and routing logic. It supports drag-and-drop node creation, canvas panning and zooming, route-based connections, a configurable inspector, and execution feedback through node status icons and a terminal panel.

## Canvas

- Drag nodes around the canvas.
- Pan the canvas by dragging empty space.
- Zoom with mouse wheel or touchpad.
- Zoom buttons are available in the top toolbar.
- Connections are drawn between node output ports and compatible input ports.
- Selected nodes and selected connections open the right inspector.
- Clicking empty canvas clears the inspector selection.

## Layout

- Left node palette is collapsible.
- Left node palette is resizable.
- Right inspector sidebar is resizable.
- Bottom terminal is resizable.
- Fullscreen mode keeps the full workflow surface visible.

## Node Palette

### Input And Output

- `Input`
  - Single configurable input node.
  - Supports output kinds: `text`, `file`, `image`, `video`, `boolean`.
  - File-backed input kinds allow selecting a local source file.

- `Output`
  - Single configurable output node.
  - Supports output kinds: `text`, `file`, `image`, `video`, `boolean`.
  - Saves a DawnDesk workflow output artifact to a selected path when the workflow runs.

### Tool / Function Nodes

- `Photo Editor`
  - Selectable functions include image export, resize, and filter operations.
  - Function-specific parameter fields appear after selection.

- `Video Editor`
  - Selectable functions include `ve_check_ffmpeg`, `ve_probe_media`, `ve_generate_thumbnail`, and `ve_generate_waveform`.
  - Function-specific parameter fields appear after selection.

- `Dev Tool`
  - Selectable tool actions include font extraction, color extraction, regex testing, and Base64/URL encode-decode.
  - Function-specific parameter fields appear after selection.

- `API Request`
  - Configures method, URL, headers, and body.

- `Transform Data`
  - Supports field mapping and JSON path extraction style configuration.

- `Code Function`
  - Configures a function-style transform body.

- `File Operation`
  - Supports read/write-style file workflow steps.

## Logic And Routing Nodes

- `If / Else`
  - Has two output routes: `true` and `false`.
  - The condition is configured in the inspector.

- `Switch`
  - Supports multiple editable case routes.
  - Always includes a `default` route.
  - Routes can be added, removed, and renamed in the inspector.

- `For Each`
  - Has two output routes: `item` and `done`.
  - Supports item source and batch size configuration.

- `Try / Catch`
  - Has two output routes: `success` and `error`.

- `Merge`
  - Accepts multiple incoming branches.
  - Emits a single merged output route.

## Inspector

- Opens when a node or connection is selected.
- Scrollable for larger node configurations.
- Shows node-specific controls instead of generic text boxes.
- Tool nodes use direct function selection instead of vague operation text.
- Function parameters are rendered as text, number, or select fields depending on the selected function.
- Connection inspector shows source node, output route, and target node.

## Terminal And Execution Feedback

- Bottom terminal shows workflow execution output.
- Successful executions are shown in green.
- Failed executions are shown in red.
- Each node shows a green tick after successful execution.
- Each node shows a red cross after failed execution.
- Missing required input paths or output save paths fail the specific node.

## Persistence

- Workflows can be saved to local storage.
- Saved workflows can be loaded back into the builder.
- Connections preserve output route information through `fromPort`.

## Current Limitations

- Workflow execution is still mostly simulated.
- Function nodes configure selected APIs and parameters, but most functions are not yet invoked end-to-end during workflow execution.
- Output nodes currently save a DawnDesk workflow artifact rather than the real transformed media/data result.
- Some Dev Tool entries represent available or planned DawnDesk tool actions rather than backend Tauri commands.
- Full-project TypeScript currently has an unrelated missing import for `src/components/dev-tools/DevToolsHub.tsx`.
