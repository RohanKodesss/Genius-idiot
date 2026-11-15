---
name: Genius Idiot
description: "Nordic Minimalist study tracker — monastic clarity, arctic fjord blue accent, and copper highlights"
colors:
  primary: "#2B5876"
  primary-hover: "#396E93"
  copper: "#C36437"
  pine: "#3D7864"
  danger: "#C04A45"
  neutral-bg: "#F7F7F4"
  surface: "#FFFFFF"
  border: "#E3E5DF"
  text-ink: "#151917"
  text-slate: "#4B534E"
  text-mist: "#6B736E"
  accent-dark: "#18252C"
typography:
  display:
    fontFamily: '"Instrument Serif", Georgia, serif'
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  sans:
    fontFamily: '"DM Sans", system-ui, sans-serif'
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  mono:
    fontFamily: '"Space Mono", ui-monospace, monospace'
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "9999px"
---

# Design System: Genius Idiot

## Overview
A Nordic Minimalist study tracker designed for sustained, quiet focus. Warm alabaster canvas, crisp obsidian text, Arctic Fjord Blue primary action, and Scandinavian copper streaks. High-contrast luxury editorial typography (`Instrument Serif`) paired with functional geometric sans (`DM Sans`) and technical monospace (`Space Mono`).

## Colors

### Light Palette (Default)
- **Canvas (`--ivory`)**: `#F7F7F4` (RGB `247 247 244`) — Soft warm alabaster vellum.
- **Card Surface (`--parchment`)**: `#FFFFFF` (RGB `255 255 255`) — Clean card stock.
- **Hairlines & Borders (`--sand`)**: `#E3E5DF` (RGB `227 229 223`) — Glacial stone lines.
- **Primary Ink (`--ink`)**: `#151917` (RGB `21 25 23`) — Crisp obsidian (16.5:1 contrast).
- **Secondary Slate (`--slate`)**: `#4B534E` (RGB `75 83 78`) — Basalt slate (6.2:1 contrast).
- **Helper Mist (`--mist`)**: `#6B736E` (RGB `107 115 110`) — Lichen stone (4.7:1 contrast, WCAG AA).
- **Primary Action (`--champagne`)**: `#2B5876` (RGB `43 88 118`) — Arctic Fjord Blue.
- **Copper Streak (`--terracotta`)**: `#C36437` (RGB `195 100 55`) — Warm copper highlights.
- **Done / Pine (`--sage`)**: `#3D7864` (RGB `61 120 100`) — Arctic Pine sage.
- **Warning / Alert (`--bordeaux`)**: `#C04A45` (RGB `192 74 69`) — Lingonberry red.
- **Dark Accent Tile (`--obsidian`)**: `#18252C` (RGB `24 37 44`) — Midnight Nordic sea.

### Dark Palette (Obsidian Black & White)
- **Canvas (`--ivory`)**: `#0A0A0A` (RGB `10 10 10`) — Pitch Obsidian Black.
- **Card Surface (`--parchment`)**: `#121212` (RGB `18 18 18`) — Elevated Obsidian Slate.
- **Hairlines (`--sand`)**: `#262626` (RGB `38 38 38`) — Crisp Charcoal Rim.
- **Primary Ink (`--ink`)**: `#FFFFFF` (RGB `255 255 255`) — Pure Crisp White (21:1 contrast).
- **Secondary Slate (`--slate`)**: `#A3A3A3` (RGB `163 163 163`) — Neutral Silver (8:1 contrast).
- **Helper Mist (`--mist`)**: `#737373` (RGB `115 115 115`) — Medium Gray (4.8:1 contrast).
- **Primary Action (`--champagne`)**: `#F5F5F5` (RGB `245 245 245`) — Pure Polar White button / text.
- **Copper Streak (`--terracotta`)**: `#FB923C` (RGB `251 146 60`) — Vibrant Amber Copper.
- **Done / Mint (`--sage`)**: `#4ADE80` (RGB `74 222 128`) — Crisp Emerald Pine.

## Typography
- **Display Headings**: `Instrument Serif`, 400 weight, `text-wrap: balance`, `-0.02em` tracking. Used on major page titles, goal names, and hero statements.
- **Body & UI**: `DM Sans`, 400/500/600 weight, `text-wrap: pretty`. Clean, neutral legibility.
- **Timer, Tabular Data & Dates**: `Space Mono`, 400/700 weight, tabular figures (`font-mono`). Used for session clocks, countdowns, timestamps, and roadmap order numbers.

## Elevation & Depth
- Elevation is declared via subtle border hairlines (`border border-sand`) and gentle, multi-stop diffuse shadows:
  - `box-shadow: 0 1px 3px rgba(21, 25, 23, 0.04), 0 16px 36px -24px rgba(21, 25, 23, 0.16)`.
- Interactive cards elevate smoothly (`transform: translateY(-2px)` with expanded shadow).

## Components
- **Primary Button**: Arctic Fjord Blue background, white text, 12px radius (`rounded-xl`), tactile scale on press (`active:scale-[0.98]`).
- **Streak Badges**: Scandinavian copper tint (`bg-terracotta/10 text-terracotta border border-terracotta/25`) with flame icon.
- **Countdown Clock**: Crisp Space Mono display, tabular numerals, with smooth progress track.
- **Themed Surfaces**: Custom thin scrollbars and colored form carets.

## Do's and Don'ts
- **DO**: Keep daily load constant. 1 task per goal per day.
- **DO**: Ensure all helper text passes WCAG AA contrast (≥4.5:1).
- **DO**: Use Space Mono for all time and numerical figures.
- **DON'T**: Add kicker/eyebrow labels above headings. Let the heading carry its own weight.
- **DON'T**: Use gradient text, glassmorphic clutter, or harsh block shadows.
- **DON'T**: Re-introduce overdue debt or punitive backlog alerts.
