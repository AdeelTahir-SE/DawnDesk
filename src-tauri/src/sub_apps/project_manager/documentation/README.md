# Solo Project Management Features
> Features of tools like Jira that you can use independently — no team, no assignees required.

---

## 1. Issue & Task Management

The core of any PM tool. Create and structure work at any granularity.

- Create issues, tasks, stories, bugs, and subtasks
- Set **issue type** (task, bug, epic, story, subtask)
- Write rich descriptions using markdown / rich text
- Set **priority** levels: critical, high, medium, low
- Add **labels & tags** for categorization
- **Link issues**: blocks, is blocked by, duplicates, relates to
- Create **subtasks** nested under a parent task
- Clone / duplicate issues
- Archive or delete issues

---

## 2. Boards & Workflows

Visualize your work and define how tasks move through states.

- **Kanban board** view: To Do → In Progress → Done
- Define **custom workflow statuses** and transitions
- Drag-and-drop cards between columns
- Set **WIP limits** per column
- **Scrum board** with sprints
- **Backlog management** and ordering
- Board-level filters by status, label, or priority

---

## 3. Planning & Scheduling

Map out work over time — sprints, roadmaps, releases.

- Create sprints with start and end dates
- **Story point** and time-based estimation
- Due dates on individual tasks
- **Epics** for grouping related work
- **Roadmap / timeline view** (Gantt-style)
- Milestones and release markers
- **Versions / fix versions** tracking

---

## 4. Filtering & Search

Find exactly what you need, fast.

- Quick filters by status, label, and issue type
- **Advanced search / JQL** (query language)
- Save custom filter views for reuse
- Full-text search across all issues
- Sort by priority, due date, status, creation date
- Filter by epic, sprint, or version

---

## 5. Reports & Insights

Understand progress and patterns over time.

- **Burndown chart** — sprint progress vs. ideal
- **Velocity chart** — story points completed per sprint
- **Cumulative flow diagram** — work in each status over time
- **Cycle time & lead time** reports
- Issues created vs. resolved over time
- Time tracking reports
- Sprint retrospective summary

---

## 6. Time Tracking

Log how long work actually takes vs. estimates.

- Log work / time spent on individual issues
- **Remaining estimate** vs. original estimate
- Work log history per issue
- Time spent summaries rolled up to sprints and epics

---

## 7. Content & Attachments

Keep all context attached to the work itself.

- Attach files, images, and screenshots
- Add comments on issues (notes to yourself)
- Embed links — PRs, docs, external URLs
- **Issue history & audit log** — see every change
- Inline code blocks and technical notes
- Pin important issues to the top of a board

---

## 8. Project Configuration

Set up your workspace the way you think.

- Create and name multiple projects
- Choose project type: **Scrum** or **Kanban**
- Add **custom fields** to issue types (e.g. client name, contract ID)
- Define **custom issue types** beyond defaults
- Configure **workflow schemes** per project
- Screen and field scheme setup
- Project-level visibility and settings

---

## 9. Integrations & Automation

Let the tool do repetitive work for you.

- **Webhook triggers** on status changes
- **Automation rules**: if X then Y (e.g. auto-close subtasks when parent is done)
- **Git / GitHub integration**: auto-link commits and PRs to issues
- CI/CD pipeline status surfaced on issues
- API access for custom tooling and scripts
- Import / export issues as CSV or JSON

---

*All features above are usable as a solo developer with no team members or assignees involved.*

---

## Out of Scope — Multi-People Features

Features that require more than one person and are not applicable for solo use.

- **Assigning issues** to team members
- **Mentioning / notifying** specific users (`@username`)
- **Team workload view** — capacity planning across members
- **Shared sprints** — planning and committing as a team
- **Review & approval workflows** — routing issues for sign-off
- **Role-based permissions** — admin, developer, viewer access per person
- **Watching issues** to receive others' updates
- **Group / team management** — creating squads or departments
- **Collaborative commenting** — threaded discussion between members
- **Reporter vs. Assignee separation** — tracking who filed vs. who owns
- **Delegation** — reassigning tasks between team members
- **Shared dashboards** — team-wide visibility boards
- **On-call / escalation routing** — assigning issues by availability
- **Organization-level user management** — inviting, removing, deactivating accounts
- **Audit logs of user actions** — who changed what across the team