import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

def draw_campus_map():
    """
    Generates and saves a 2D map of City University's East Campus based on a
    pre-defined JSON-like data structure, using Matplotlib.
    """
    # --- Data Definition ---
    # This data is derived from the provided JSON description.
    data = {
        'image_description': "Map of City University's East Campus",
        'points': [
            {'label': 'A', 'description': 'Location of the Library'},
            {'label': 'B', 'description': 'Location of the Student Union'},
            {'label': 'C', 'description': 'Location of the Science Block'},
            {'label': 'D', 'description': 'Location of the Art Studio'},
            {'label': 'E', 'description': 'Location of the Sports Centre'},
            {'label': 'F', 'description': 'Location of the Canteen'},
            {'label': 'G', 'description': 'Location of the Main Lecture Theatre'},
            {'label': 'H', 'description': 'Location of the Administration Building'},
            {'label': 'I', 'description': 'Location of the University Bookshop'},
            {'label': 'J', 'description': 'Location of the Medical Centre'}
        ],
        'labels': [
            {'text': 'Main Entrance', 'approx_position': 'bottom-center'},
            {'text': 'Main Path', 'approx_position': 'running horizontally through center'}
        ]
    }

    # --- Map Layout & Styling ---
    # As the JSON lacks explicit coordinates, a plausible layout is designed to be
    # professional and logical for a university campus.
    # The layout is based on a 14x10 grid to accommodate the map and a legend.
    locations = {
        'A': {'pos': (1.5, 7.0), 'size': (2.5, 2.0), 'color': '#003366', 'desc': 'Library'},
        'B': {'pos': (4.5, 5.5), 'size': (2.0, 1.5), 'color': '#E67E22', 'desc': 'Student Union'},
        'C': {'pos': (7.5, 7.0), 'size': (2.0, 2.5), 'color': '#4682B4', 'desc': 'Science Block'},
        'D': {'pos': (8.0, 1.0), 'size': (1.5, 1.5), 'color': '#8E44AD', 'desc': 'Art Studio'},
        'E': {'pos': (1.0, 1.0), 'size': (2.5, 2.5), 'color': '#27AE60', 'desc': 'Sports Centre'},
        'F': {'pos': (4.5, 2.5), 'size': (2.0, 1.2), 'color': '#A0522D', 'desc': 'Canteen'},
        'G': {'pos': (0.5, 5.2), 'size': (2.5, 1.0), 'color': '#990000', 'desc': 'Main Lecture Theatre'},
        'H': {'pos': (6.0, 0.8), 'size': (1.2, 1.2), 'color': '#696969', 'desc': 'Administration Building'},
        'I': {'pos': (3.0, 0.8), 'size': (1.2, 1.0), 'color': '#008080', 'desc': 'University Bookshop'},
        'J': {'pos': (9.0, 4.0), 'size': (1.0, 1.0), 'color': '#DB7093', 'desc': 'Medical Centre'}
    }

    # --- Plotting ---

    # 1. Setup Figure and Axis
    fig, ax = plt.subplots(figsize=(14, 9))
    fig.suptitle(data['image_description'], fontsize=20, fontweight='bold', y=0.98, color='#333333')
    ax.set_aspect('equal')
    ax.axis('off')

    # Set map boundaries
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)

    # 2. Draw Background and Main Features
    # Campus grounds (light green)
    ax.add_patch(patches.Rectangle((0, 0), 14, 10, facecolor='#e8f4e2', zorder=0))

    # Main Path (horizontal)
    ax.add_patch(patches.Rectangle((0, 4.2), 10, 0.8, facecolor='#bdc3c7', edgecolor='#7f8c8d', linewidth=0.5, zorder=1))
    ax.text(5, 4.95, 'Main Path', fontsize=12, style='italic', color='#555555', ha='center', va='center')

    # Path to entrance (vertical)
    ax.add_patch(patches.Rectangle((5.0, 0), 0.8, 4.2, facecolor='#bdc3c7', edgecolor='#7f8c8d', linewidth=0.5, zorder=1))
    ax.text(5.4, 0.3, 'Main Entrance', fontsize=12, style='italic', color='#555555', ha='center', va='bottom', rotation=90)

    # 3. Draw Buildings and Labels
    for label, props in locations.items():
        # Draw building as a rectangle
        rect = patches.Rectangle(
            props['pos'], props['size'][0], props['size'][1],
            facecolor=props['color'],
            edgecolor='black',
            linewidth=0.75,
            zorder=2,
            alpha=0.9
        )
        ax.add_patch(rect)

        # Add the letter label inside the building
        center_x = props['pos'][0] + props['size'][0] / 2
        center_y = props['pos'][1] + props['size'][1] / 2
        ax.text(
            center_x, center_y, label,
            fontsize=14, fontweight='bold', color='white',
            ha='center', va='center', zorder=3,
            bbox=dict(facecolor='black', alpha=0.1, boxstyle='round,pad=0.2', edgecolor='none')
        )

        # Special marker for Medical Centre
        if label == 'J':
            ax.text(center_x, center_y, '+', fontsize=24, fontweight='bold', color='white', ha='center', va='center', zorder=4, alpha=0.8)

    # 4. Create a Custom Legend/Key
    legend_x_start = 10.5
    ax.add_patch(patches.Rectangle((legend_x_start - 0.2, 0.3), 3.5, 9.4, facecolor='#f5f5f5', edgecolor='black', zorder=1, alpha=0.9))
    ax.text(legend_x_start + 1.55, 9.3, 'Key to Map', fontsize=16, fontweight='bold', ha='center', color='#333333')
    ax.plot([legend_x_start, legend_x_start + 3.1], [9.1, 9.1], color='black', linewidth=1)

    y_pos = 8.6
    for point in sorted(data['points'], key=lambda p: p['label']):
        label = point['label']
        desc = point['description'].replace('Location of the ', '')
        legend_text = f" {label}  -  {desc}"
        ax.text(legend_x_start, y_pos, legend_text, fontsize=11, va='center', ha='left', color='#333333')
        y_pos -= 0.85

    # 5. Add a Compass Rose
    compass_center_x, compass_center_y = 0.8, 9.2
    ax.add_patch(patches.Circle((compass_center_x, compass_center_y), radius=0.6, facecolor='white', edgecolor='black', zorder=2))
    ax.text(compass_center_x, compass_center_y + 0.4, 'N', ha='center', va='center', fontsize=12, fontweight='bold')
    ax.text(compass_center_x, compass_center_y - 0.4, 'S', ha='center', va='center', fontsize=10, alpha=0.7)
    ax.text(compass_center_x + 0.4, compass_center_y, 'E', ha='center', va='center', fontsize=10, alpha=0.7)
    ax.text(compass_center_x - 0.4, compass_center_y, 'W', ha='center', va='center', fontsize=10, alpha=0.7)
    ax.arrow(compass_center_x, compass_center_y, 0, 0.25, head_width=0.1, head_length=0.15, fc='k', ec='k', zorder=3)

    # --- File Saving ---
    output_path = r"C:\Users\USER\Desktop\IELTS_Mock_Test_20\listen_part_2_map.png"
    try:
        # Ensure the directory exists before saving
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        # Save the figure with specified settings
        plt.savefig(output_path, bbox_inches='tight', dpi=150, facecolor=fig.get_facecolor())
    except Exception as e:
        print(f"An error occurred while saving the file to '{output_path}': {e}")
    finally:
        # Clean up the plot to free memory
        plt.close(fig)

if __name__ == '__main__':
    draw_campus_map()