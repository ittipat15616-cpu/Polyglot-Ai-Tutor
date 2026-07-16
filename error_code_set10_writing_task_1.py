import matplotlib.pyplot as plt
import matplotlib.patches as patches
import matplotlib.patheffects as patheffects
import numpy as np
import os

# --- Setup ---
# Create the figure and axes for the map
fig, ax = plt.subplots(figsize=(12, 9))
fig.set_facecolor('#F0F8FF')  # AliceBlue background for a clean, professional look

# Set map boundaries and maintain aspect ratio
ax.set_xlim(0, 120)
ax.set_ylim(0, 90)
ax.set_aspect('equal', adjustable='box')
ax.axis('off')  # Hide the axes ticks and labels

# --- Title ---
ax.set_title("Plan of Town Centre Redevelopment", fontsize=20, fontweight='bold', pad=20, color='#333333')

# --- Roads ---
# Main horizontal road: King's Avenue
ax.add_patch(patches.Rectangle((0, 40), 120, 10, facecolor='#AAAAAA', edgecolor='none', zorder=1))
ax.text(60, 45, "KING'S AVENUE", color='white', fontsize=12, fontweight='bold', ha='center', va='center', zorder=2)

# Main vertical road: Queen's Street
ax.add_patch(patches.Rectangle((55, 0), 10, 90, facecolor='#AAAAAA', edgecolor='none', zorder=1))
ax.text(60, 45, "QUEEN'S STREET", color='white', fontsize=12, fontweight='bold', ha='center', va='center', rotation=90, zorder=2)

# --- Buildings and Areas ---
# Define a helper function for adding labeled buildings
def add_labeled_area(ax, xy, width, height, color, label_text, area_name):
    """Adds a rectangular area with a central letter label and a name label."""
    # Main shape
    rect = patches.Rectangle(xy, width, height, facecolor=color, edgecolor='#333333', linewidth=1.5, zorder=3)
    ax.add_patch(rect)
    
    # Central letter label (A, B, C, etc.)
    center_x = xy[0] + width / 2
    center_y = xy[1] + height / 2
    ax.text(center_x, center_y, label_text,
            fontsize=24, fontweight='bold', color='white',
            ha='center', va='center', zorder=4,
            path_effects=[patheffects.withStroke(linewidth=2, foreground='black')])
            
    # Area name label (e.g., "Library")
    ax.text(center_x, center_y - height * 0.35, area_name,
            fontsize=10, fontweight='bold', color='black',
            ha='center', va='center', zorder=4)

# A: Shopping Centre - Located in the northwest quadrant
add_labeled_area(ax, (5, 55), 45, 25, '#FFC300', 'A', 'Shopping Centre')

# B: Car Park - Located opposite the Shopping Centre (A) across Queen's Street
add_labeled_area(ax, (70, 55), 45, 25, '#DAF7A6', 'B', 'Car Park')

# C: Housing Estate - Located in the southwest quadrant
add_labeled_area(ax, (5, 10), 45, 25, '#FF5733', 'C', 'Housing Estate')

# D: Park - Located to the east of the Housing Estate (C), across Queen's Street
add_labeled_area(ax, (70, 10), 45, 25, '#90EE90', 'D', 'Park')

# Add some features to the Park (D) to make it look more like a park
park_x_start, park_y_start = 70, 10
for i in range(4):
    for j in range(2):
        tree_x = park_x_start + 10 + i * 10 + np.random.uniform(-2, 2)
        tree_y = park_y_start + 8 + j * 8 + np.random.uniform(-2, 2)
        # Tree trunk
        ax.add_patch(patches.Rectangle((tree_x - 0.5, tree_y-2), 1, 2, facecolor='#8B4513', zorder=4))
        # Tree canopy
        ax.add_patch(patches.Circle((tree_x, tree_y), 3, facecolor='#228B22', zorder=5))

# E: Bus Station - Positioned centrally, at the southwest corner of the main intersection
bus_station_area = patches.Rectangle((40, 25), 15, 15, facecolor='#337EFF', edgecolor='#333333', linewidth=1.5, zorder=3)
ax.add_patch(bus_station_area)
ax.text(47.5, 32.5, 'E', fontsize=24, fontweight='bold', color='white', ha='center', va='center', zorder=4, path_effects=[patheffects.withStroke(linewidth=2, foreground='black')])
ax.text(47.5, 28, "Bus Station", fontsize=10, fontweight='bold', color='white', ha='center', va='center', zorder=4)

# --- Compass ---
# Place the compass in the top-left corner
comp_x, comp_y = 10, 82
# Arrow for North
ax.arrow(comp_x, comp_y, 0, 5, head_width=1.5, head_length=2, fc='black', ec='black', zorder=10)
# Compass letters
ax.text(comp_x, comp_y + 6.5, 'N', fontsize=12, fontweight='bold', ha='center', va='center', zorder=10)
ax.text(comp_x, comp_y - 2.5, 'S', fontsize=10, ha='center', va='center', zorder=10)
ax.text(comp_x + 3.5, comp_y + 2, 'E', fontsize=10, ha='center', va='center', zorder=10)
ax.text(comp_x - 3.5, comp_y + 2, 'W', fontsize=10, ha='center', va='center', zorder=10)

# --- Save File ---
# Define the output path
output_path = r"C:\Users\USER\Desktop\IELTS_Mock_Test_10\task1_visual.png"

# Ensure the directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Save the figure to the specified path
plt.savefig(output_path, bbox_inches='tight', dpi=150)
plt.close(fig) # Close the figure to free up memory