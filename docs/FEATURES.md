# Features

This file tracks current user-facing DawnDesk capabilities. Update the relevant section when a feature changes.

## Dashboard

The dashboard is the workspace entry point inside the app shell. It should summarize the user's available modules and recent activity as those systems mature.

## Project Manager

Project Manager is available at `/project-manager` and is protected by Google authentication. The frontend includes project lists, dashboards, boards, backlog, roadmap, reports, strategies, settings, search/filtering, issue detail modals, and project section comments.

Supabase migrations include project and workspace-related schema.

## Finance Manager

Finance Manager is available at `/finance` and is protected by Google authentication. It includes views for dashboard, accounts, transactions, budgets, reporting, accounts payable, accounts receivable, cash and treasury, compliance, debts, fixed assets, goals, procurement, subscriptions, tax management, settings, and integrations.

Finance comments and Supabase invocation helpers are handled in frontend shared modules.

## Notes

Notes is available at `/notes`. It includes note editing, notebook navigation, search, tags, templates, tasks, daily notes, archive, trash, backlinks, graph view, version history, and rich content blocks such as callouts, checklists, code blocks, tables, and toggles.

The native layer exposes note, notebook, tag, link, version, and template commands.

## Prompt Manager

Prompt Manager is available at `/prompts`. It supports storing, organizing, searching, and reusing prompt templates. Prompt-related Supabase migrations live in `supabase/migrations/`.

## Photo Editor

Photo Editor is available at `/photo-editor`, with help at `/photo-editor/help`. It includes canvas editing, layers, histogram, adjustments, toolbar/menu/options UI, color picking, swatches, film strip, import/export helpers, filters, drawing tools, and project-file support.

The native layer currently exposes photo export support.

## Video Editor

Video Editor is available at `/video-editor`. It includes onboarding, media bin, timeline, preview, transport controls, properties, masks, effects, transitions, color grading, audio tools, text tools, export dialog, and status bar.

The native layer uses FFmpeg and FFprobe sidecars for probing, thumbnails, waveforms, imports, exports, project save/load, export progress, cancellation, and availability checks.

## Workflow Builder

Workflow Builder is available at `/workflow`. It models local automations through typed nodes, compatible connections, local tool steps, and flow control.

## Developer Tools

Developer Tools is available at `/dev-tools`. It includes practical utilities for code, data, and local development workflows.

## Settings

Settings is available at `/settings`. Current native settings include auto-launch and hardware acceleration support.
