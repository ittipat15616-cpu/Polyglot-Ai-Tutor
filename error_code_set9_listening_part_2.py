import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.path import Path
import matplotlib.patheffects as patheffects
import os
import numpy as np

# --- Configuration ---
# This is a standalone script. The JSON description is used as a reference for the drawing logic.

# File path for saving the image
output_path = r"C:\Users\USER\Desktop\IELTS_Mock_Test_9\listen_part_2_map.png"

# Create the directory if it doesn't exist to prevent FileNotFoundError
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Colors and styles for a professional look
BG_COLOR = '#EBF2E4'          # Light, natural green for the ground
ROAD_OUTER_COLOR = '#707070'   # Dark grey for road border
ROAD_INNER_COLOR = '#A0A0A0'   # Lighter grey for road surface
BUILDING_COLOR = '#CDB7B5'     # Muted pinkish-brown for the site office
CONTAINER_COLOR = '#B0C4DE'    # Light steel blue for recycling containers
TEXT_COLOR = '#333333'        # Dark grey for text for readability

# --- Create Figure and Axes ---
fig, ax = plt.subplots(figsize=(12, 9))
ax.set_facecolor(BG_COLOR)

# Set axes limits for a 100x100 grid and remove distracting ticks
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# --- Title ---
ax.set_title(
    "Map of Millfield Recycling Centre",
    fontsize=20,
    fontweight='bold',
    pad=30,  # Add padding to prevent overlap with the map
    color=TEXT_COLOR
)

# --- Draw the One-Way Road ---
# A Bezier curve is used for the top to create a smooth, rounded path
road_path_data = [
    (Path.MOVETO, (30, -2)),   # Start at Entrance (below the visible area)
    (Path.LINETO, (30, 75)),   # Straight up the left side
    (Path.CURVE4, (30, 92)),   # Control point 1 for the top curve
    (Path.CURVE4, (70, 92)),   # Control point 2 for the top curve
    (Path.CURVE4, (70, 75)),   # Endpoint of the curve
    (Path.LINETO, (70, -2)),   # Straight down the right side to the Exit
]
road_codes, road_verts = zip(*road_path_data)
road_path = Path(road_verts, road_codes)

# Draw the road using PathPatches for a clean, two-tone effect
# Outer edge (darker)
ax.add_patch(patches.PathPatch(
    road_path, facecolor='none', edgecolor=ROAD_OUTER_COLOR, lw=16,
    capstyle='round'
))
# Inner road surface (lighter)
ax.add_patch(patches.PathPatch(
    road_path, facecolor='none', edgecolor=ROAD_INNER_COLOR, lw=14,
    capstyle='round'
))
# Dashed centerline to indicate direction
ax.add_patch(patches.PathPatch(
    road_path, facecolor='none', edgecolor='white', lw=1.5, linestyle='--'
))

# Add white one-way arrows to indicate traffic flow
arrow_style = dict(
    facecolor='white', edgecolor='none',
    arrowstyle='->, head_width=0.6, head_length=0.8'
)
ax.add_patch(patches.FancyArrowPatch((30, 20), (30, 21), **arrow_style))
ax.add_patch(patches.FancyArrowPatch((30, 50), (30, 51), **arrow_style))
ax.add_patch(patches.FancyArrowPatch((45, 87.6), (46, 87.9), **arrow_style, connectionstyle="arc3,rad=.2"))
ax.add_patch(patches.FancyArrowPatch((70, 51), (70, 50), **arrow_style))
ax.add_patch(patches.FancyArrowPatch((70, 21), (70, 20), **arrow_style))

# --- Draw Landmarks and Facilities ---
# Use a dictionary to store locations for clarity and easy access
locations = {
    "Site Office": {'pos': (8, 5), 'size': (16, 12)},
    "A": {'pos': (8, 30), 'size': (16, 12)},
    "B": {'pos': (8, 55), 'size': (16, 12)},
    "C": {'pos': (42, 92), 'size': (16, 10)},
    "D": {'pos': (76, 55), 'size': (16, 12)},
    "E": {'pos': (76, 30), 'size': (16, 12)},
}

# Draw Site Office (a landmark, not a target, so it gets a unique color)
office = locations["Site Office"]
ax.add_patch(patches.Rectangle(
    office['pos'], *office['size'],
    facecolor=BUILDING_COLOR, edgecolor=TEXT_COLOR, lw=1
))

# Draw Containers (these are the target facilities for the listening test)
for label in ["A", "B", "C", "D", "E"]:
    loc = locations[label]
    ax.add_patch(patches.Rectangle(
        loc['pos'], *loc['size'],
        facecolor=CONTAINER_COLOR, edgecolor=TEXT_COLOR, lw=1
    ))

# --- Add Labels ---
# Use PathEffects to add a white stroke to text, making it stand out
text_outline = [patheffects.withStroke(linewidth=3, foreground='white')]

# Landmark labels (fully named as they are for orientation)
# Entrance
ax.text(30, 2, "Entrance", ha='center', va='bottom', fontsize=12, color=TEXT_COLOR, path_effects=text_outline)
ax.add_patch(patches.FancyArrowPatch((30, 8), (30, 4), color=TEXT_COLOR, arrowstyle='-|>, head_width=5, head_length=8', lw=2))

# Exit
ax.text(70, 2, "Exit", ha='center', va='bottom', fontsize=12, color=TEXT_COLOR, path_effects=text_outline)
ax.add_patch(patches.FancyArrowPatch((70, 4), (70, 8), color=TEXT_COLOR, arrowstyle='-|>, head_width=5, head_length=8', lw=2))

# Site Office
office_center_x = office['pos'][0] + office['size'][0] / 2
office_center_y = office['pos'][1] + office['size'][1] / 2
ax.text(
    office_center_x, office_center_y, "Site\nOffice",
    ha='center', va='center', fontsize=11, color=TEXT_COLOR, fontweight='bold',
    path_effects=text_outline
)

# Target labels (letters only, in prominent circles, as per requirements)
label_style = dict(
    ha='center', va='center', fontsize=16, fontweight='bold', color='black',
    bbox=dict(boxstyle='circle,pad=0.4', fc='white', ec='black', lw=2)
)
for label in ["A", "B", "C", "D", "E"]:
    loc = locations[label]
    center_x = loc['pos'][0] + loc['size'][0] / 2
    center_y = loc['pos'][1] + loc['size'][1] / 2
    ax.text(center_x, center_y, label, **label_style)

# --- Draw Compass ---
compass_center = (92, 92)
ax.add_patch(patches.Circle(compass_center, radius=5, color='white', ec=TEXT_COLOR, zorder=10))
# Lines
ax.plot([92, 92], [88, 97], color=TEXT_COLOR, lw=1, zorder=11) # N-S
ax.plot([87, 97], [92, 92], color=TEXT_COLOR, lw=1, zorder=11) # E-W
# North arrow head
ax.plot(92, 97, '^', color=TEXT_COLOR, markersize=10, zorder=11)
# Text labels
ax.text(92, 97.5, 'N', ha='center', va='bottom', fontsize=12, fontweight='bold', color=TEXT_COLOR, zorder=12)
ax.text(92, 86.5, 'S', ha='center', va='top', fontsize=10, color=TEXT_COLOR, zorder=12)
ax.text(97.5, 92, 'E', ha='left', va='center', fontsize=10, color=TEXT_COLOR, zorder=12)
ax.text(86.5, 92, 'W', ha='right', va='center', fontsize=10, color=TEXT_COLOR, zorder=12)

# --- Save the Figure ---
# The script saves the file directly without showing a window, as required.
plt.savefig(output_path, bbox_inches='tight', dpi=150)
plt.close(fig) # Close the figure to free up system memory