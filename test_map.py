import matplotlib.pyplot as plt
import matplotlib.patches as patches

fig, ax = plt.subplots(figsize=(8, 6))
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

# Road
road = patches.Rectangle((0, 4), 10, 2, facecolor='lightgray', edgecolor='none')
ax.add_patch(road)
ax.text(5, 5, 'Main Road', fontsize=12, ha='center', va='center', rotation=0)

# Buildings
b1 = patches.Rectangle((1, 6.5), 3, 2.5, facecolor='lightblue', edgecolor='black', linewidth=2)
ax.add_patch(b1)
ax.text(2.5, 7.75, 'Library', fontsize=14, ha='center', va='center')

b2 = patches.Rectangle((6, 6.5), 3, 2.5, facecolor='white', edgecolor='black', linewidth=2, linestyle='--')
ax.add_patch(b2)
ax.text(7.5, 7.75, 'A', fontsize=16, fontweight='bold', ha='center', va='center')

# Compass
ax.text(9, 9, 'N\n|\nW--+--E\n|\nS', fontsize=10, ha='center', va='center', fontfamily='monospace')

plt.savefig('scratch/sample_ielts_map.png', bbox_inches='tight')
print('Done')
