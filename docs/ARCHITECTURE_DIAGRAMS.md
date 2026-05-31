# Architecture Diagrams

This document shows how each DawnDesk sub-app is wired: where data lives, which dependencies it uses, and how the major flows move through React, browser storage, Supabase, Tauri, Rust, SQLite, and sidecar binaries.

Use this alongside [ARCHITECTURE.md](ARCHITECTURE.md) and [FEATURE_AND_SUB_APP_FORMAT.md](FEATURE_AND_SUB_APP_FORMAT.md). When a sub-app changes storage, routing, native commands, Supabase tables, or file formats, update the diagrams here.

## Global Shell

### Runtime Map

```mermaid
flowchart LR
  main["src/main.tsx"] --> router["BrowserRouter"]
  router --> logger["LoggerProvider"]
  logger --> app["src/App.tsx"]
  app --> publicRoutes["Public routes: /, /auth"]
  app --> shell["AppShell"]
  shell --> navbar["Navbar"]
  shell --> sidebar["Sidebar"]
  shell --> workspaceRoutes["Workspace sub-app routes"]
  app --> theme["ThemeBootstrap: localStorage dawndesk_theme"]
  app --> navLogger["NavigationLogger"]
  app --> connectionBridge["ConnectionErrorToastBridge"]
```

### Shared Storage and Dependency Map

```mermaid
flowchart TB
  react["React + TypeScript UI"] --> localStorage["Browser localStorage"]
  react --> indexedDb["Browser IndexedDB"]
  react --> tauriApi["Tauri JS APIs"]
  react --> supabaseClient["Supabase client"]

  tauriApi --> dialog["plugin-dialog: open/save"]
  tauriApi --> fsPlugin["plugin-fs: read/write"]
  tauriApi --> rust["Rust command layer"]

  rust --> sqlite["SQLite files in app storage"]
  rust --> sidecars["FFmpeg / FFprobe sidecars"]
  rust --> nativeSettings["Native settings JSON"]
  rust --> filesystem["User-selected files and export paths"]

  supabaseClient --> supabase["Supabase Auth + Postgres"]
```

## Dashboard

Dashboard is the workspace overview. It reads summary data from local browser settings, prompt storage, Supabase configuration state, and the app log file.

### Data Flow

```mermaid
flowchart LR
  route["/dashboard"] --> page["src/Pages/Dashboard.tsx"]
  page --> localPrompts["localStorage: dawndesk_prompts"]
  page --> theme["localStorage: dawndesk_theme"]
  page --> settings["localStorage: dawndesk_global_settings"]
  page --> supabaseFlag["isSupabaseConfigured"]
  page --> logFile["dawndesk_activity.log"]
  logFile --> appLocalData["Tauri BaseDirectory.AppLocalData"]
```

### Dependencies and Storage

```mermaid
flowchart TB
  dashboard["Dashboard"] --> pluginFs["@tauri-apps/plugin-fs"]
  dashboard --> supabaseClient["src/lib/supabaseClient.ts"]
  dashboard --> browserStorage["Browser localStorage"]
  dashboard --> loggerData["Logger output file"]

  browserStorage --> promptCount["Prompt count"]
  browserStorage --> themeMode["Theme mode"]
  browserStorage --> globalPrefs["Global settings"]
  loggerData --> recentActivity["Recent activity list"]
```

## Project Manager

Project Manager is a Supabase-backed workspace for project planning, issues, comments, members, strategies, backlog, board, roadmap, reports, and settings.

### Data Flow

```mermaid
flowchart LR
  route["/project-manager"] --> auth["RequireGoogleAuth"]
  auth --> page["ProjectManager.tsx"]
  page --> listScreen["ProjectListScreen"]
  page --> tabs["Dashboard / Backlog / Board / Roadmap / Strategies / Search / Reports / Settings"]
  tabs --> workspaceSync["src/lib/workspaceSync.ts"]
  workspaceSync --> supabaseClient["src/lib/supabaseClient.ts"]
  supabaseClient --> supabase["Supabase Auth + Postgres"]
```

### Supabase Storage Model

```mermaid
erDiagram
  profiles ||--o{ project_members : user_id
  projects ||--o{ project_members : project_id
  projects ||--o{ project_issues : project_id
  projects ||--o{ project_sprints : project_id
  projects ||--o{ project_workflow_statuses : project_id
  projects ||--o{ project_versions : project_id
  projects ||--o{ project_strategies : project_id
  projects ||--o{ section_comments : project_id

  profiles {
    uuid id
    text email
    text display_name
  }
  projects {
    uuid id
    text name
    text key
    text color_tag
    uuid owner_id
  }
  project_members {
    uuid id
    uuid project_id
    uuid user_id
    text role
    text status
  }
  project_issues {
    uuid id
    uuid project_id
    text key
    text title
    text status
    text priority
  }
  section_comments {
    uuid id
    uuid project_id
    text sub_app
    text comment_section
    text actual_comment
  }
```

### Dependency Map

```mermaid
flowchart TB
  projectUi["Project components"] --> comments["ProjectSectionComments"]
  projectUi --> workspaceSync["workspaceSync project functions"]
  projectUi --> connectionErrors["connectionErrors event bridge"]
  projectUi --> welcome["WelcomeScreen appKey project-manager"]
  workspaceSync --> supabaseTables["projects, project_members, project_issues, project_sprints, project_versions, project_strategies, section_comments"]
  workspaceSync --> authProfile["getCurrentUser + ensureUserProfile"]
  connectionErrors --> modal["ConnectionErrorModal"]
```

## Finance Manager

Finance Manager is a Supabase-backed finance workspace. It uses a compatibility invoke wrapper so finance views can call command-like operations while data is stored in Supabase tables.

### Data Flow

```mermaid
flowchart LR
  route["/finance"] --> auth["RequireGoogleAuth"]
  auth --> page["FinanceManager.tsx"]
  page --> workspaceHub["Finance workspace hub"]
  page --> financeViews["Ledger / AR / AP / Cash / Budget / Reports / Assets / Tax / Procurement / Inventory / Compliance"]
  financeViews --> invokeAdapter["src/lib/financeSupabaseInvoke.ts"]
  invokeAdapter --> workspaceSync["src/lib/workspaceSync.ts"]
  workspaceSync --> supabaseClient["src/lib/supabaseClient.ts"]
  supabaseClient --> supabase["Supabase Auth + Postgres"]
```

### Supabase Storage Model

```mermaid
erDiagram
  profiles ||--o{ finance_workspace_members : user_id
  finance_workspaces ||--o{ finance_workspace_members : workspace_id
  finance_workspaces ||--o{ finance_accounts : workspace_id
  finance_workspaces ||--o{ finance_transactions : workspace_id
  finance_workspaces ||--o{ finance_budgets : workspace_id
  finance_workspaces ||--o{ finance_goals : workspace_id
  finance_workspaces ||--o{ finance_invoices : workspace_id
  finance_workspaces ||--o{ finance_journal_entries : workspace_id
  finance_workspaces ||--o{ finance_workspace_preferences : workspace_id
  finance_workspaces ||--o{ section_comments : finance_workspace_id

  finance_workspaces {
    uuid id
    text name
    uuid owner_id
  }
  finance_workspace_members {
    uuid id
    uuid workspace_id
    uuid user_id
    text role
    text status
  }
  finance_transactions {
    uuid id
    uuid workspace_id
    numeric amount
    text type
  }
  finance_workspace_preferences {
    uuid workspace_id
    text preference_key
    jsonb value_json
  }
```

### Command Compatibility Layer

```mermaid
flowchart TB
  view["Finance view component"] --> command["invoke(command, args)"]
  command --> getMap["get_* command table"]
  command --> createMap["create_* command table"]
  command --> deleteMap["delete_* command table"]
  command --> preference["get/save finance preference"]

  getMap --> listRows["listFinanceRows(table, workspaceId)"]
  createMap --> createRow["createFinanceRow(table, workspaceId, payload)"]
  deleteMap --> deleteRow["deleteFinanceRow(table, id)"]
  preference --> preferencesTable["finance_workspace_preferences"]

  listRows --> financeTables["Finance Supabase tables"]
  createRow --> financeTables
  deleteRow --> financeTables
```

## Notes

Notes is a local native sub-app backed by SQLite through Tauri commands. React invokes Rust commands, and Rust stores notes data under the app storage root.

### Data Flow

```mermaid
flowchart LR
  route["/notes"] --> page["NotesApp.tsx"]
  page --> noteComponents["Editor, Sidebar, Search, Tags, Tasks, Graph, Templates, Trash"]
  noteComponents --> invoke["@tauri-apps/api/core invoke"]
  invoke --> rustCommands["src-tauri/src/sub_apps/notes_taking/mod.rs"]
  rustCommands --> sqlite["notes.db"]
  sqlite --> appStorage["storage_root(app)"]
```

### SQLite Storage Model

```mermaid
erDiagram
  notebooks ||--o{ notes : notebook_id
  notes ||--o{ note_tags : note_id
  tags ||--o{ note_tags : tag_id
  notes ||--o{ note_links : source_note_id
  notes ||--o{ note_versions : note_id

  notebooks {
    integer id
    text name
    integer parent_id
    text color
    text icon
  }
  notes {
    integer id
    text title
    text content
    integer notebook_id
    boolean is_archived
    boolean is_deleted
    boolean is_daily_note
  }
  tags {
    integer id
    text name
    integer parent_id
    text color
  }
  note_versions {
    integer id
    integer note_id
    text title
    text content
  }
  note_templates {
    integer id
    text name
    text category
    text content
  }
```

### Command Dependencies

```mermaid
flowchart TB
  notesUi["Notes UI"] --> noteCrud["notes_create/get/update/delete_note"]
  notesUi --> notebookCrud["notes_create/get/update/delete_notebook"]
  notesUi --> tagCrud["notes_create/get/update/delete_tag"]
  notesUi --> links["notes_create/get/delete_link + backlinks"]
  notesUi --> versions["notes_create/get_versions"]
  notesUi --> templates["notes_create/get/delete_template"]

  noteCrud --> sqlite["SQLite notes.db"]
  notebookCrud --> sqlite
  tagCrud --> sqlite
  links --> sqlite
  versions --> sqlite
  templates --> sqlite
```

## Prompt Manager

Prompt Manager has two storage paths: local prompt library in browser localStorage, and Prompt Hub data in Supabase.

### Data Flow

```mermaid
flowchart LR
  route["/prompts"] --> page["PromptManager.tsx"]
  page --> library["Local prompt library"]
  page --> hub["Prompt Hub"]

  library --> localPrompts["localStorage: dawndesk_prompts"]
  hub --> cache["localStorage: dawndesk_prompt_hub_cache_v1"]
  hub --> workspaceSync["workspaceSync prompt hub functions"]
  workspaceSync --> supabase["Supabase prompt_hub_prompts + prompt_hub_saves"]
```

### Supabase and Cache Model

```mermaid
erDiagram
  profiles ||--o{ prompt_hub_prompts : author_id
  prompt_hub_prompts ||--o{ prompt_hub_saves : prompt_id
  profiles ||--o{ prompt_hub_saves : user_id

  prompt_hub_prompts {
    uuid id
    uuid author_id
    text title
    text category
    text content
    jsonb output_json
    text model
  }
  prompt_hub_saves {
    uuid prompt_id
    uuid user_id
  }
```

### Dependency Map

```mermaid
flowchart TB
  promptUi["PromptManager UI"] --> logger["useAppLogger"]
  promptUi --> localStorage["local prompt library + hub cache"]
  promptUi --> connectionModal["ConnectionErrorModal"]
  promptUi --> hubFunctions["listPromptHubPromptsPage, publishPromptToHub, recordPromptHubSave, deletePromptFromHub"]
  hubFunctions --> auth["getCurrentUser + ensureUserProfile"]
  hubFunctions --> supabaseClient["Supabase client"]
  supabaseClient --> promptTables["prompt_hub_prompts, prompt_hub_saves, profiles"]
```

## Photo Editor

Photo Editor is mostly browser-side editor state and canvas work, with IndexedDB project storage and one native export command.

### Data Flow

```mermaid
flowchart LR
  route["/photo-editor"] --> page["PhotoEditor.tsx"]
  page --> context["EditorContext"]
  context --> canvas["PhotoEditorCanvas"]
  context --> panels["Layers, Adjustments, Histogram, Toolbar, Menus"]
  context --> projectFile["src/engine/photo-editor/projectFile.ts"]
  projectFile --> indexedDb["IndexedDB: dawndesk.photoEditor/projects"]
  projectFile --> registry["localStorage: dawndesk.photoEditor.projects"]
  page --> presets["localStorage: dawndesk.photoEditor.exportPresets"]
```

### Project Storage Model

```mermaid
flowchart TB
  project["DawnDeskProject JSON"] --> document["document: size, dpi, zoom, pan"]
  project --> layers["layers: visibility, opacity, blendMode, imageDataUrl"]
  project --> colors["foreground/background colors"]
  project --> activeLayer["activeLayerId"]

  layers --> base64["Base64 PNG data URLs"]
  project --> indexedDb["IndexedDB object store: projects"]
  registry["ProjectEntry registry"] --> localStorage["localStorage project list + thumbnails"]
```

### Native Export Dependency

```mermaid
flowchart LR
  exportUi["Export action"] --> exportImage["src/engine/photo-editor/exportImage.ts"]
  exportImage --> invoke["invoke photo_export_file"]
  invoke --> rust["src-tauri/src/sub_apps/photo_editor/mod.rs"]
  rust --> exportDir["DAWNDESK_EXPORT_DIR or Downloads"]
  rust --> file["Exported image file"]
```

## Video Editor

Video Editor stores active project state in React context, saves `.ddvp` project files through Tauri, and uses FFmpeg/FFprobe sidecars for media probing, thumbnails, waveforms, and rendering.

### Data Flow

```mermaid
flowchart LR
  route["/video-editor"] --> page["VideoEditor.tsx"]
  page --> context["VideoEditorContext"]
  context --> ui["Timeline, MediaBin, Preview, Panels, ExportDialog"]
  ui --> hook["useFFmpeg.ts"]
  hook --> dialog["Tauri dialog open/save"]
  hook --> invoke["Tauri invoke ve_* commands"]
  invoke --> rust["src-tauri/src/sub_apps/video_editor/mod.rs"]
  rust --> sidecars["FFmpeg + FFprobe sidecars"]
  rust --> files["Media files, thumbnails, waveforms, .ddvp projects, exports"]
```

### Native Command Flow

```mermaid
flowchart TB
  useFFmpeg["useFFmpeg"] --> check["ve_check_ffmpeg"]
  useFFmpeg --> probe["ve_probe_media"]
  useFFmpeg --> thumbnail["ve_generate_thumbnail"]
  useFFmpeg --> waveform["ve_generate_waveform"]
  useFFmpeg --> import["ve_import_media"]
  useFFmpeg --> export["ve_export_project"]
  useFFmpeg --> cancel["ve_cancel_export"]
  useFFmpeg --> saveProject["ve_save_project"]
  useFFmpeg --> loadProject["ve_load_project"]

  check --> ffmpeg["FFmpeg sidecar"]
  probe --> ffprobe["FFprobe sidecar"]
  thumbnail --> ffmpeg
  waveform --> ffmpeg
  export --> ffmpeg
  export --> progressEvents["export-progress / export-complete / export-error"]
  saveProject --> ddvp[".ddvp JSON project file"]
  loadProject --> ddvp
```

### Storage and Event Model

```mermaid
flowchart LR
  projectState["Video project in React state"] --> saveDialog["save dialog"]
  saveDialog --> ddvp[".ddvp project file"]
  openDialog["open dialog"] --> mediaPaths["User media paths"]
  mediaPaths --> mediaItems["MediaItem records in React state"]
  mediaItems --> timeline["Timeline clips/tracks"]
  exportSettings["Export settings"] --> renderJob["Render job queue in React state"]
  renderJob --> tauriEvents["Tauri export progress events"]
  tauriEvents --> renderJob
```

## Workflow Builder

Workflow Builder is a browser/local-file sub-app. It stores the current workflow in localStorage and can import/export workflow JSON and output files through Tauri file APIs.

### Data Flow

```mermaid
flowchart LR
  route["/workflow"] --> page["WorkflowBuilder.tsx"]
  page --> graph["Nodes + connections + metadata"]
  graph --> autosave["localStorage current workflow"]
  graph --> clipboard["localStorage dawndesk_workflow_clipboard"]
  page --> fileDialogs["Tauri dialog open/save"]
  fileDialogs --> fsPlugin["Tauri fs readTextFile/writeTextFile"]
  fsPlugin --> workflowFile["Workflow JSON files"]
  fsPlugin --> artifacts["Workflow output/log files"]
```

### Workflow Object Model

```mermaid
classDiagram
  class WorkflowNode {
    id
    title
    description
    kind
    input[]
    output
    position
    value
    status
    breakpoint
    pinned
  }
  class Connection {
    id
    from
    to
    fromPort
  }
  class Metadata {
    name
    updatedAt
    version
  }
  Metadata --> WorkflowNode
  WorkflowNode --> Connection
```

### Dependency Map

```mermaid
flowchart TB
  workflowUi["Workflow Builder UI"] --> localStorage["Browser localStorage"]
  workflowUi --> tauriDialog["@tauri-apps/plugin-dialog"]
  workflowUi --> tauriFs["@tauri-apps/plugin-fs"]
  workflowUi --> devTools["Local tool node definitions"]
  workflowUi --> photoVideo["Output routes to Photo/Video/Dev utilities by node intent"]

  tauriDialog --> chooseInput["Select input file"]
  tauriDialog --> chooseOutput["Choose output path"]
  tauriFs --> readWorkflow["Read workflow JSON"]
  tauriFs --> writeWorkflow["Write workflow JSON/artifacts/logs"]
```

## Developer Tools

Developer Tools is a frontend utility hub. Most tools work in memory in the browser; file-based utilities use browser `File` objects and downloads.

### Data Flow

```mermaid
flowchart LR
  route["/dev-tools"] --> page["DevTools.tsx"]
  page --> hub["DevToolsHub.tsx"]
  hub --> toolState["React component state"]
  hub --> fileReader["Browser FileReader / File text reads"]
  hub --> downloads["Browser downloads"]
  hub --> newWindow["window.open preview output"]
```

### Utility Dependency Map

```mermaid
flowchart TB
  devTools["Developer Tools"] --> textTools["Text, JSON, diff, regex, JWT, URL tools"]
  devTools --> fileTools["File metadata and file text tools"]
  devTools --> generators["Password, UUID, sample data generators"]
  devTools --> downloads["Generated downloadable outputs"]

  textTools --> memory["Browser memory only"]
  fileTools --> browserFile["Browser File API"]
  generators --> memory
  downloads --> anchorDownload["a[download] blob/data URL"]
```

## Settings

Settings combines browser preferences, Supabase session management, and native Tauri commands for OS-level app settings.

### Data Flow

```mermaid
flowchart LR
  route["/settings"] --> page["Settings.tsx"]
  page --> browserPrefs["localStorage dawndesk_theme + dawndesk_global_settings"]
  page --> supabaseAuth["Supabase auth session/signOut"]
  page --> invoke["@tauri-apps/api/core invoke"]
  invoke --> nativeAutoLaunch["get/set_auto_launch"]
  invoke --> nativeGpu["get/set_hardware_acceleration"]
  nativeAutoLaunch --> startupScript["Windows Startup DawnDesk.cmd"]
  nativeGpu --> settingsJson["native-settings.json"]
```

### Preference Storage

```mermaid
flowchart TB
  settingsUi["Settings UI"] --> theme["Theme setting"]
  settingsUi --> globalSettings["Global app settings"]
  settingsUi --> account["Supabase account state"]
  settingsUi --> nativeSettings["Native settings"]

  theme --> themeStorage["localStorage: dawndesk_theme"]
  globalSettings --> globalStorage["localStorage: dawndesk_global_settings"]
  account --> supabaseAuth["Supabase auth"]
  nativeSettings --> appConfig["App config directory"]
  appConfig --> nativeJson["native-settings.json"]
  appConfig --> startup["Windows Startup script"]
```

## Auth and Public Entry Screens

Home and Auth are not sub-apps, but they sit before the workspace and feed Supabase-authenticated areas.

### Entry Flow

```mermaid
flowchart LR
  home["/ Home.tsx"] --> auth["/auth AuthChoice.tsx"]
  auth --> supabaseConfigured["isSupabaseConfigured"]
  supabaseConfigured --> oauth["supabase.auth.signInWithOAuth"]
  oauth --> google["Google OAuth provider"]
  google --> session["Supabase session"]
  session --> protectedRoutes["RequireGoogleAuth protected routes"]
```

### Public Asset Dependencies

```mermaid
flowchart TB
  home["Home"] --> logo["public/realistic_logo.png"]
  home --> video["public/sunflower_field_with_lake.mp4"]
  auth["AuthChoice"] --> logo
  auth --> video
  promptManager["PromptManager avatar/logo area"] --> logo
```

## Update Rules

When a sub-app changes:

1. Update the relevant diagrams in this file.
2. Update [ARCHITECTURE.md](ARCHITECTURE.md) if routes, modules, storage, or native commands changed.
3. Update [FEATURES.md](FEATURES.md) if user-facing behavior changed.
4. Update [ASSETS.md](ASSETS.md) if asset dependencies changed.
5. Update [TESTING.md](TESTING.md) if test coverage or test strategy changed.
