# Personal Introduction Page (Spectacular Edition)

## Overview

A high-end, visually stunning personal introduction page. This version leverages cutting-edge web technologies (Baseline 2024/2025) to create a premium, interactive, and immersive user experience.

## Features

*   **Premium Visuals:**
    *   **Glassmorphism:** Enhanced transparency and backdrop blur for a modern, layered feel.
    *   **Vibrant Palette:** Utilizing `oklch()` color space for perceptually uniform and vivid colors.
    *   **Dynamic Background:** An upgraded Three.js interactive background with particle effects.
    *   **Glow & Depth:** Multi-layered shadows and glowing interactive elements using `:has()` and CSS custom properties.
*   **Modern Layout & Components:**
    *   **Web Components:** Modular UI using custom elements for the header, widgets, and social links.
    *   **Container Queries:** Widgets that adapt seamlessly to their parent container's size.
    *   **Logical Properties:** Future-proof layout using `margin-inline`, `padding-block`, etc.
*   **Localized Content:** Fully localized in Korean (KO) with appropriate typography (Noto Sans KR).
*   **Interactive Widgets:**
    *   **Weather Widget:** Real-time localized weather updates.
    *   **News Widget:** Category-based RSS feed reader with a polished UI.

## Current Plan: Visual Overhaul

1.  **Refine Color Palette:** Transition to `oklch` for all primary and secondary colors.
2.  **Enhance Glassmorphism:** Update `.profile-card` with better `backdrop-filter` and semi-transparent borders.
3.  **Add Entry Animations:** Implement intersection observer or CSS animations for staggered content reveal.
4.  **Improve Typography:** Use fluid typography and better weight distribution for headlines.
5.  **Interactive Glows:** Add subtle glowing effects to buttons and list items on hover.
6.  **Background Sparkle:** Modify `background.js` to add more "sparkle" or interactivity to the Three.js scene.