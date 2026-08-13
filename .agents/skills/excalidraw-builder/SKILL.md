---
name: excalidraw-builder
description: Skill for parsing, creating, editing, and generating Excalidraw (.excalidraw) diagram files, wireframes, and flowcharts directly in the workspace. Use when creating or modifying Excalidraw diagrams.
---

# Excalidraw Builder Skill

## When to Use
- Creating visual flowcharts, architecture diagrams, or UI wireframes in `.excalidraw` format.
- Modifying or adding elements to an existing `.excalidraw` file in the workspace.

## Excalidraw File Structure (.excalidraw)

Excalidraw files are JSON objects with the following schema:

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "id": "element_unique_id",
      "type": "rectangle | ellipse | arrow | text | line",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100,
      "angle": 0,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffc9c9",
      "fillStyle": "solid | hachure",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "roundness": { "type": 3 },
      "seed": 12345678,
      "version": 1,
      "versionNonce": 87654321,
      "isDeleted": false,
      "boundElements": [],
      "updated": 1785724620506,
      "link": null,
      "locked": false
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}
```

## Workflows

### 1. Parsing an Existing Canvas
Read the `.excalidraw` JSON file, filter non-deleted elements (`isDeleted: false`), and inspect element labels/texts.

### 2. Adding / Updating Elements
Append new shape or text elements into the `elements` array, setting appropriate `x`, `y`, `width`, `height`, and text parameters.
