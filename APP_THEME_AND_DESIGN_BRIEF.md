# DawnDesk Theme and Design Brief (For Full Redesign)

## 1) Product Intent
DawnDesk is an all-in-one desktop workspace app built with Tauri + React.
It should feel:
- fast
- focused
- premium
- creative but not noisy

Core message: one command center for personal productivity and media tools.

## 2) Brand Personality
Use this brand personality as the north star:
- Confident, clean, modern
- Productivity-first, creator-friendly
- Calm dark surfaces with warm accent energy
- Practical over decorative

Avoid:
- generic dashboard templates
- overly playful UI
- flat/plain screens with no hierarchy

## 3) Visual Direction
### Overall look
- Primary mode: dark UI
- Surfaces should have layered depth (cards, elevated panels, subtle gradients)
- Rounded corners throughout for consistency
- Generous spacing and readable typography

### Color System
Define CSS variables/tokens and use them consistently.

Suggested palette:
- Background base: #0B0F14
- Background elevated: #121821
- Card: #171F2B
- Card hover: #1D2633
- Border subtle: #2A3647
- Text primary: #F3F7FF
- Text secondary: #A9B6C8
- Text muted: #7F8DA1
- Accent primary: #F7C948 (warm amber)
- Accent hover: #FFD86A
- Success: #2FBF71
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6

### Typography
Use purposeful fonts (not default system stacks).
Recommended pairing:
- Headings: Sora
- Body/UI: Manrope
- Mono/code: JetBrains Mono

Type scale:
- Display: 40/48
- H1: 32/40
- H2: 24/32
- H3: 20/28
- Body: 15/24
- Small: 13/20

### Shape and Effects
- Base radius: 12px
- Large panels: 16-20px
- Inputs/buttons: 10-12px
- Soft shadows, low blur glows only on key actions
- Borders should be visible but subtle

## 4) Layout System
### App shell
- Left sidebar (primary navigation)
- Top navbar (context, search, quick actions)
- Main content area (page-specific)

### Responsive behavior
- Desktop-first but fully usable at tablet width
- Sidebar collapses to icon-only mode
- Cards flow into responsive grid

Spacing scale:
- 4, 8, 12, 16, 24, 32

## 5) Motion and Interaction
Motion should be meaningful and minimal.

Use:
- page fade/slide in (180-260ms)
- card stagger reveal (40-70ms offsets)
- hover lift for actionable cards
- button press feedback

Avoid:
- constant looping animations
- heavy parallax
- excessive motion that hurts focus

## 6) Global Component Rules
### Buttons
- Primary: accent background + dark text
- Secondary: neutral elevated with subtle border
- Destructive: red-tinted
- Disabled: low contrast and no shadow

### Inputs
- Clear labels
- Visible focus ring (2px accent)
- Error/help text under field

### Cards
- Distinct header/content/action areas
- Optional icon badge at top-left
- Hover state must indicate clickability

### Lists/Tables
- Strong row separation
- Context actions on row hover
- Keep density moderate for readability

## 7) Page-Specific Design Notes
### Home
- Welcome hero with quick actions
- Recent activity panel
- Shortcut cards to major tools

### Dashboard
- KPI/summary cards
- Usage and storage widgets
- Activity timeline

### Storage
- File manager style view
- Breadcrumb navigation
- File type icons
- Row actions: rename/delete/open
- Upload CTA always visible

### PDF Tools
Flow must be:
1. Select file from Storage
2. Choose tool
3. Run convert/action

UI requirements:
- Show selected file clearly at top
- Tool cards include action button (Convert)
- Progress and success/error states visible

### AI, Photo Editor, Video Editor
- Tool-first workspace layout
- Left panel: options/settings
- Main panel: preview or editor area
- Bottom/right panel: output/actions

### Settings
- Group settings in clear sections
- Toggle/input consistency
- Add inline explanations for advanced options

## 8) Content Tone
- Short, clear, action-oriented labels
- Avoid technical jargon in user-facing text
- Empty states should guide next step

Examples:
- "Select a file to begin"
- "No files here yet. Upload your first file."

## 9) Accessibility Requirements
- Contrast ratio minimum AA
- Full keyboard navigation
- Visible focus states for all interactive controls
- Hit targets at least 40x40
- Do not rely on color only for status

## 10) Implementation Guidance for Claude
Ask Claude to deliver:
1. Complete design system tokens (colors, spacing, typography, radius, shadows)
2. Reusable UI components (button, input, card, modal, table/list rows)
3. Redesigned AppShell (sidebar + navbar + responsive behavior)
4. Full page redesign for all current routes
5. Motion presets and interaction states
6. Accessibility pass
7. Clean, maintainable React + Tailwind structure

Important constraints:
- Keep existing route/page architecture
- Keep Tauri compatibility
- Do not remove current core functionality
- Focus on visual and UX redesign, not business logic rewrites

## 11) Definition of Done
The redesign is complete when:
- all pages share one coherent visual language
- Storage and PDF flows are obvious and frictionless
- selected file + selected tool states are visually clear
- UI looks production-ready on desktop and laptop widths
- no page feels like a placeholder template
