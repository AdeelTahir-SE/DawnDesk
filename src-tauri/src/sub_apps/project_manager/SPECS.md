# DawnDesk — Project Manager Sub-App
## Feature Specification Document

> **Max team size:** 5 members per project · **Auth:** Supabase · **Platform:** Desktop (DawnDesk)

---

## Version Roadmap Overview

| Version | Theme | Target Features |
|---------|-------|----------------|
| **v1** | Core Foundation — Auth, Projects, Kanban, Chat | #1 – #35 |
| **v2** | Collaboration & Productivity — Mentions, Files, Notifications | #36 – #70 |
| **v3** | Power Features — Analytics, Automation, AI, Advanced UX | #71 – #100 |

---

## Full Feature Table

| # | Feature Name | Feature Description | Version |
|---|-------------|---------------------|---------|
| 1 | User Signup | New users can register with email and password via Supabase Auth; account is persisted in the database with a profile row created on signup | v1 |
| 2 | User Login | Existing users authenticate with email and password; session is stored securely and auto-refreshed using Supabase session tokens | v1 |
| 3 | Forgot Password | Users can request a password reset link sent to their email; clicking the link opens a reset form inside DawnDesk | v1 |
| 4 | User Profile Setup | After first login, users complete a profile with display name, avatar upload, and optional bio; stored in a `profiles` table in Supabase | v1 |
| 5 | Avatar Upload | Users can upload a profile photo; image is stored in Supabase Storage and the public URL is saved to their profile | v1 |
| 6 | Create Project | Authenticated users can create a new project by providing a name, optional description, and color tag; creator is automatically assigned as Owner | v1 |
| 7 | Project Dashboard | After opening a project, users land on a dashboard showing a summary of active tasks, team members, recent activity, and upcoming deadlines | v1 |
| 8 | Invite Members by Email | Project Owner can invite up to 4 additional members by entering their email addresses; invitees receive an in-app notification and email invite link | v1 |
| 9 | Accept / Decline Invite | Invited users see a pending invite in their notifications panel and can accept or decline; accepting adds them to the project team | v1 |
| 10 | Member Roles | Three roles are supported per project — Owner, Editor, and Viewer; each role has defined permissions for editing tasks, inviting members, and deleting content | v1 |
| 11 | Remove Member | Project Owner can remove a member from the project; the removed user loses access to all project data immediately | v1 |
| 12 | Leave Project | Non-owner members can voluntarily leave a project; their tasks are unassigned and remain on the board | v1 |
| 13 | Kanban Board View | Projects include a Kanban board with drag-and-drop columns; default columns are To Do, In Progress, In Review, and Done | v1 |
| 14 | Create Task Card | Users can create a new task card on the Kanban board by clicking a column's add button; minimum required field is a task title | v1 |
| 15 | Edit Task Card | Any Editor or Owner can edit a task's title, description, priority, due date, and assignee from within the task detail panel | v1 |
| 16 | Delete Task Card | Owners and Editors can delete a task card; a confirmation dialog appears before permanent deletion | v1 |
| 17 | Drag and Drop Tasks | Task cards can be dragged between Kanban columns to update their status; position within a column is also reorderable | v1 |
| 18 | Task Priority Levels | Each task can be assigned a priority of Low, Medium, High, or Urgent; priority is shown as a color-coded badge on the card | v1 |
| 19 | Task Due Date | Tasks have an optional due date field; overdue tasks are visually flagged with a red indicator on the card | v1 |
| 20 | Assign Task to Member | A task can be assigned to one project member; the assignee's avatar is displayed on the card and they receive a notification | v1 |
| 21 | Task Description | Each task has a rich-text description field supporting basic formatting — bold, italic, bullet lists, and inline code | v1 |
| 22 | Task Status Badge | Each task displays its current Kanban column status as a badge inside the task detail panel for quick reference | v1 |
| 23 | Custom Kanban Columns | Owners and Editors can add, rename, or delete custom columns on the board beyond the four defaults | v1 |
| 24 | Column Task Count | Each Kanban column header shows the number of task cards currently in that column, updated in real time | v1 |
| 25 | Group Chat — Send Message | All project members share a persistent group chat; any member can send text messages visible to the entire team in real time | v1 |
| 26 | Chat Real-Time Updates | Chat messages appear instantly for all online members using Supabase Realtime subscriptions without needing a page refresh | v1 |
| 27 | Chat Message Timestamps | Each message displays a relative timestamp (e.g. "2 minutes ago") and shows the full date-time on hover | v1 |
| 28 | Chat Sender Avatar | Each chat message shows the sender's avatar and display name to the left of the message bubble | v1 |
| 29 | Chat Scroll to Latest | The chat panel automatically scrolls to the most recent message when a new message arrives if the user is near the bottom | v1 |
| 30 | Persistent Chat History | All messages are stored in Supabase and loaded when the user opens the project, preserving full conversation history | v1 |
| 31 | Delete Own Message | Users can delete their own chat messages; a "deleted" placeholder is shown in place of the message for continuity | v1 |
| 32 | Project List Sidebar | A left sidebar within the Project Manager sub-app lists all projects the user is a member of, with color tags and unread indicators | v1 |
| 33 | Archive Project | Owners can archive a completed project; archived projects are hidden from the main list but accessible from an "Archived" filter | v1 |
| 34 | Delete Project | Owners can permanently delete a project including all tasks and messages; requires typing the project name to confirm | v1 |
| 35 | Solo Mode (Work Alone) | Users can create a project without inviting anyone and use the full Kanban board and task system as a personal project manager | v1 |
| 36 | @Mention a Member in Chat | Users can type `@` followed by a member's name in the chat to mention them; the mention is highlighted and the mentioned user receives a notification | v2 |
| 37 | #Mention a Task in Chat | Users can type `#` followed by a task title or ID in the chat to create a clickable task reference; clicking it opens that task's detail panel | v2 |
| 38 | Task Comment Thread | Each task card has an internal comment thread separate from the group chat; members can leave focused comments directly on a task | v2 |
| 39 | @Mention in Task Comments | Members can `@mention` teammates inside task comments to notify them and direct their attention to a specific task | v2 |
| 40 | Mention Notifications Panel | A dedicated notifications panel lists all incoming mentions from both chat and task comments, with links to the relevant message or task | v2 |
| 41 | Mark Notification as Read | Users can mark individual notifications as read or use a "Mark all as read" button to clear the unread count | v2 |
| 42 | Unread Message Badge | The project entry in the sidebar shows a badge with the count of unread chat messages since the user last viewed the chat | v2 |
| 43 | Task Labels / Tags | Tasks can have one or more custom color labels (e.g. Bug, Feature, Design); labels are filterable on the board | v2 |
| 44 | Task Label Management | Owners and Editors can create, rename, and delete project-wide labels from a label management panel in project settings | v2 |
| 45 | Filter Tasks by Label | A filter bar above the Kanban board lets users filter visible cards by one or more labels | v2 |
| 46 | Filter Tasks by Assignee | The board filter bar includes an assignee filter so users can view only tasks assigned to a specific team member | v2 |
| 47 | Filter Tasks by Priority | Users can filter the Kanban board to show only tasks matching a selected priority level | v2 |
| 48 | Search Tasks | A search bar lets users search tasks by title keyword across all columns; matching cards are highlighted | v2 |
| 49 | Task Checklist | Tasks can contain an internal checklist of sub-items; each item has a checkbox and the completion ratio is shown on the card (e.g. 3/5) | v2 |
| 50 | File Attachment on Task | Users can attach files to a task card; files are uploaded to Supabase Storage and listed in the task detail panel with download links | v2 |
| 51 | File Attachment in Chat | Members can send file attachments in the group chat; images render as inline previews while other files show as downloadable links | v2 |
| 52 | Image Preview in Chat | Images sent in chat are displayed as inline thumbnails; clicking them opens a full-size lightbox viewer | v2 |
| 53 | Edit Own Chat Message | Users can edit their own previously sent messages; edited messages show an "edited" indicator | v2 |
| 54 | Message Reactions | Members can react to chat messages with emoji reactions; reaction counts are displayed and update in real time | v2 |
| 55 | Reply to Message (Thread) | Users can reply to a specific chat message to create a threaded reply; the original message is quoted in the reply bubble | v2 |
| 56 | Pin Important Message | Owners and Editors can pin up to 5 messages in the chat; pinned messages are accessible via a pinned messages panel at the top of the chat | v2 |
| 57 | Task Due Date Reminders | Members assigned to a task receive an in-app reminder notification 24 hours before and on the day of the task's due date | v2 |
| 58 | Activity Feed per Task | Each task detail panel shows a chronological activity log of all changes made to the task — status updates, edits, comments, and file uploads | v2 |
| 59 | Project Activity Log | A project-level activity feed shows a timeline of all significant events across all tasks, including who made each change | v2 |
| 60 | Task Created By | The task detail panel shows which member created the task and when, in addition to the currently assigned member | v2 |
| 61 | Duplicate Task | Users can duplicate an existing task card, creating a copy with the same title, description, labels, and checklist in the same column | v2 |
| 62 | Move Task to Another Column | In addition to drag and drop, a context menu on the task card allows selecting a target column to move the task | v2 |
| 63 | Board Collapse Columns | Users can collapse individual Kanban columns to save horizontal space while keeping other columns fully visible | v2 |
| 64 | List View for Tasks | An alternative List View displays all tasks in a flat, sortable table grouped by status, replacing the visual Kanban layout | v2 |
| 65 | Sort Tasks in List View | In List View, users can sort tasks by due date, priority, assignee, or creation date in ascending or descending order | v2 |
| 66 | Member Online Presence | A green dot indicator on member avatars in the sidebar and chat shows who is currently online in the project | v2 |
| 67 | Typing Indicator in Chat | When a member is composing a message, a "Name is typing…" indicator appears at the bottom of the chat panel | v2 |
| 68 | Project Color & Icon | Owners can set a custom accent color and icon for the project; these are displayed in the sidebar and on the dashboard header | v2 |
| 69 | Project Rename | Owners can rename a project at any time from the project settings panel; the new name reflects across all views immediately | v2 |
| 70 | Pending Tasks Widget | A personal "My Tasks" widget shows all tasks assigned to the current user across all their projects, sorted by due date | v2 |
| 71 | AI Task Description Generator | Users can click "Generate with AI" on a blank task description field; the AI suggests a description based on the task title and project context | v3 |
| 72 | AI Chat Summarizer | A "Summarize Chat" button in the group chat uses AI to generate a bullet-point summary of the last N messages, useful for catching up | v3 |
| 73 | AI Task Breakdown | Users can input a high-level task title and ask the AI to break it into a checklist of sub-tasks automatically | v3 |
| 74 | AI Project Status Report | Owners can generate an AI-written project status report based on current task completion, overdue items, and recent activity | v3 |
| 75 | Recurring Tasks | Tasks can be set to recur on a daily, weekly, or custom interval; a new copy of the task is auto-created when the current one is marked Done | v3 |
| 76 | Task Dependencies | Tasks can be linked as blocked-by dependencies; a dependent task is visually flagged and cannot be moved to In Progress until blockers are resolved | v3 |
| 77 | Gantt Chart View | A Gantt-style timeline view shows all tasks with due dates plotted on a horizontal date axis, with drag-to-reschedule support | v3 |
| 78 | Sprint / Milestone Grouping | Owners can create named sprints or milestones and assign tasks to them; a sprint view shows tasks grouped by sprint with start and end dates | v3 |
| 79 | Project Progress Bar | A visual progress bar on the project dashboard shows the percentage of tasks marked as Done out of the total task count | v3 |
| 80 | Member Workload View | A workload panel shows each member's assigned task count and estimated effort, flagging overloaded members in amber or red | v3 |
| 81 | Time Tracking on Tasks | Members can start and stop a timer on a task to log time spent; total logged time is shown on the task card | v3 |
| 82 | Time Report per Member | A time report page shows total hours logged per member across the project, exportable as CSV | v3 |
| 83 | Task Export to CSV | Owners can export all project tasks as a CSV file including title, status, assignee, priority, due date, and labels | v3 |
| 84 | Keyboard Shortcuts | A comprehensive set of keyboard shortcuts covers common actions — new task, open chat, navigate between columns, and mark task done | v3 |
| 85 | Command Palette | A `Cmd/Ctrl + K` command palette lets users jump to any project, task, or chat, and trigger actions without leaving the keyboard | v3 |
| 86 | Global Search Across Projects | A search bar at the top of the Project Manager searches tasks, messages, and files across all projects the user belongs to | v3 |
| 87 | Notification Preferences | Users can configure which events trigger notifications per project — mentions, task assignments, due date reminders, and new messages | v3 |
| 88 | Dark Mode Support | The Project Manager sub-app fully supports DawnDesk's global dark mode toggle, adapting all UI colors and contrasts accordingly | v3 |
| 89 | Emoji Picker in Chat | A full emoji picker button in the chat input lets users browse and insert emoji without relying on OS shortcuts | v3 |
| 90 | Drag Files into Chat | Users can drag and drop files directly onto the chat panel to upload and send them without using the attachment button | v3 |
| 91 | Task Board Zoom / Scale | A zoom control on the Kanban board lets users scale card sizes up or down to fit more cards on screen at once | v3 |
| 92 | Saved Filters | Users can save a combination of label, assignee, and priority filters as a named preset and restore it with one click | v3 |
| 93 | Custom Task Fields | Owners can define custom fields for tasks (e.g. Story Points, Environment, Client Name) that appear in the task detail panel | v3 |
| 94 | Webhook Integration | Owners can configure an outgoing webhook URL; the system sends a JSON payload to that URL on events like task status change or new message | v3 |
| 95 | Project Templates | Owners can save a project's column structure and label set as a reusable template, available when creating future projects | v3 |
| 96 | Two-Factor Authentication | Users can enable 2FA on their account using a TOTP authenticator app; required on login after enabling | v3 |
| 97 | Session Management | Users can view all active login sessions for their account and remotely revoke any session from the security settings panel | v3 |
| 98 | Audit Log for Owners | Owners can access a full audit log showing every sensitive action in the project — member additions, deletions, permission changes, and file uploads — with timestamps | v3 |
| 99 | Onboarding Tour | First-time users see a guided onboarding tour highlighting key areas — creating a task, inviting a member, and using the chat — with skip support | v3 |
| 100 | Offline Queue for Messages | If a user loses internet connectivity, chat messages they compose are queued locally and automatically sent when the connection is restored | v3 |

---

## Version Summary

### v1 — Core Foundation (Features 1–35)
Auth (signup, login, password reset, profile), project creation and management, Kanban board with full CRUD, task assignment and priorities, real-time group chat, solo mode, and project archiving. This version delivers a fully usable standalone project manager.

### v2 — Collaboration & Productivity (Features 36–70)
`@mention` teammates, `#mention` tasks in chat, task comment threads, file attachments, message reactions and replies, label and filter system, list view, presence indicators, typing indicators, activity feeds, due date reminders, and the personal My Tasks widget. This version makes team collaboration rich and contextual.

### v3 — Power Features (Features 71–100)
AI-assisted writing and summaries, recurring tasks, task dependencies, Gantt chart, sprint grouping, time tracking, workload view, command palette, global search, webhooks, project templates, 2FA, audit logs, custom fields, and offline queuing. This version positions DawnDesk Project Manager as a professional-grade tool.

---

*Document generated for DawnDesk — Project Manager Sub-App · Stack: Next.js · Supabase · TypeScript · Realtime*