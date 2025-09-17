import numpy as np
import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.animation import FuncAnimation, PillowWriter
import pandas as pd
from matplotlib.colors import LinearSegmentedColormap
import matplotlib.patches as mpatches

# Load the impact data from CSV
impact_df = pd.read_csv('congressional_district_impacts.csv')

# Load the hexagon shapefile for voting districts
hex_gdf = gpd.read_file('HexCDv31/HexCDv31.shp')
hex_gdf['cd_id'] = hex_gdf['GEOID'].astype(int)

# Load non-voting districts shapefile and extract only DC
nonvoting_gdf = gpd.read_file('HexDDv20/HexDDv20.shp')
dc_gdf = nonvoting_gdf[nonvoting_gdf['GEOID'] == '1198'].copy()
dc_gdf['cd_id'] = dc_gdf['GEOID'].astype(int)
dc_gdf['STATEAB'] = dc_gdf['ABBREV']
dc_gdf['STATENAME'] = dc_gdf['NAME']
dc_gdf['CDLABEL'] = dc_gdf['ABBREV']

# Combine voting districts with DC only
hex_gdf = pd.concat([hex_gdf, dc_gdf], ignore_index=True)

# Fix single-district state mappings
single_district_states = {
    200: 201, 1000: 1001, 3800: 3801, 4600: 4601, 5000: 5001, 5600: 5601, 1198: 1101
}
hex_gdf['cd_id'] = hex_gdf['cd_id'].replace(single_district_states)

# Merge impact data with shapefile
merged_gdf = hex_gdf.merge(
    impact_df[['congressional_district_geoid', 'avg_income_impact', 'avg_tax_change', 'total_households']], 
    left_on='cd_id', 
    right_on='congressional_district_geoid',
    how='left'
)

# For "before", we assume the baseline is 0 impact
merged_gdf['before_impact'] = 0
merged_gdf['after_impact'] = merged_gdf['avg_income_impact']

# Create static before/after comparison
fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(24, 8))

# Common colormap settings
vmin, vmax = -2000, 0
cmap = 'RdBu'

# Before plot (all zeros, so all neutral)
merged_gdf.plot(
    column='before_impact',
    ax=ax1,
    legend=False,
    cmap=cmap,
    edgecolor='black',
    linewidth=0.3,
    vmin=vmin,
    vmax=vmax,
    missing_kwds={'color': 'lightgray'}
)
ax1.set_title('Before SALT Deduction Abolishment\n(Baseline)', fontsize=14, fontweight='bold')
ax1.axis('off')

# After plot
im = merged_gdf.plot(
    column='after_impact',
    ax=ax2,
    legend=True,
    cmap=cmap,
    edgecolor='black',
    linewidth=0.3,
    vmin=vmin,
    vmax=vmax,
    missing_kwds={'color': 'lightgray'},
    legend_kwds={'label': 'Average Income Impact ($)', 'orientation': 'horizontal', 'pad': 0.01}
)
ax2.set_title('After SALT Deduction Abolishment\n(Income Impact per Household)', fontsize=14, fontweight='bold')
ax2.axis('off')

# Change magnitude plot (absolute value to highlight biggest changes)
merged_gdf['change_magnitude'] = merged_gdf['after_impact'].abs()
merged_gdf.plot(
    column='change_magnitude',
    ax=ax3,
    legend=True,
    cmap='YlOrRd',
    edgecolor='black',
    linewidth=0.3,
    vmin=0,
    vmax=2000,
    missing_kwds={'color': 'lightgray'},
    legend_kwds={'label': 'Magnitude of Change ($)', 'orientation': 'horizontal', 'pad': 0.01}
)
ax3.set_title('Magnitude of Income Impact\n(Larger = More Affected)', fontsize=14, fontweight='bold')
ax3.axis('off')

plt.suptitle('Income Impact from Abolishing SALT Deduction: Before vs After', fontsize=16, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('salt_before_after_comparison.png', dpi=300, bbox_inches='tight')
plt.show()

print("Static comparison saved as 'salt_before_after_comparison.png'")

# Create animated transition
fig, ax = plt.subplots(figsize=(14, 10))

# Find top 10 most impacted districts for highlighting
top_impacted = merged_gdf.nlargest(10, 'change_magnitude')
print(f"\nTop 10 Most Impacted Districts:")
for idx, row in top_impacted.iterrows():
    print(f"  {row['STATEAB']}-{row['CDLABEL']}: ${row['after_impact']:,.0f} impact")

# Create a colorbar axis that persists across frames
cbar_ax = fig.add_axes([0.3, 0.05, 0.4, 0.02])
sm = plt.cm.ScalarMappable(cmap='RdBu', norm=plt.Normalize(vmin=-2000, vmax=0))
sm.set_array([])
cbar = fig.colorbar(sm, cax=cbar_ax, orientation='horizontal')
cbar.set_label('Average Household Income Impact ($)', fontsize=10)

def animate(frame):
    ax.clear()
    
    # Calculate interpolated values for smooth transition
    progress = frame / 50.0  # 50 frames total
    merged_gdf['current_impact'] = merged_gdf['before_impact'] + (merged_gdf['after_impact'] - merged_gdf['before_impact']) * progress
    
    # Plot the current state
    merged_gdf.plot(
        column='current_impact',
        ax=ax,
        cmap='RdBu',
        edgecolor='black',
        linewidth=0.3,
        vmin=-2000,
        vmax=0,
        missing_kwds={'color': 'lightgray'}
    )
    
    # Highlight top impacted districts with thicker borders
    if progress > 0.5:  # Start highlighting halfway through
        highlight_width = 0.3 + (progress - 0.5) * 4  # Growing border width
        top_impacted.boundary.plot(ax=ax, edgecolor='yellow', linewidth=highlight_width, alpha=0.8)
    
    # Add title with progress indicator
    if progress == 0:
        title = 'Baseline (Before SALT Abolishment)'
    elif progress == 1:
        title = 'Final Impact (After SALT Abolishment)\nYellow borders = Most affected districts'
    else:
        title = f'Transitioning... {progress*100:.0f}% Complete'
    
    ax.set_title(f'Household Income Impact from Abolishing SALT Deduction\n{title}', 
                 fontsize=14, fontweight='bold')
    ax.axis('off')

# Create animation
anim = FuncAnimation(fig, animate, frames=51, interval=100, repeat=True)

# Save as GIF
print("\nCreating animated GIF (this may take a moment)...")
writer = PillowWriter(fps=10)
anim.save('salt_impact_animation.gif', writer=writer)
print("Animation saved as 'salt_impact_animation.gif'")

# Also save as MP4 if ffmpeg is available
try:
    from matplotlib.animation import FFMpegWriter
    writer = FFMpegWriter(fps=10, bitrate=1800)
    anim.save('salt_impact_animation.mp4', writer=writer)
    print("Animation also saved as 'salt_impact_animation.mp4'")
except:
    print("MP4 export skipped (ffmpeg not available)")

plt.show()

# Create a focused plot on most affected districts
fig, ax = plt.subplots(figsize=(14, 10))

# Create custom colormap for highlighting
colors = ['lightgray'] * len(merged_gdf)
merged_gdf['highlight_category'] = 'Other'

# Mark top losers (most negative impact)
top_losers = merged_gdf.nsmallest(20, 'after_impact')
for idx in top_losers.index:
    merged_gdf.loc[idx, 'highlight_category'] = 'Top 20 Losers'

# Mark top winners (least negative or positive impact if any)
top_winners = merged_gdf.nlargest(20, 'after_impact')
for idx in top_winners.index:
    if merged_gdf.loc[idx, 'highlight_category'] == 'Other':
        merged_gdf.loc[idx, 'highlight_category'] = 'Least Affected'

# Plot with categories
merged_gdf.plot(
    column='highlight_category',
    ax=ax,
    categorical=True,
    legend=True,
    edgecolor='black',
    linewidth=0.3,
    cmap='RdYlGn',
    missing_kwds={'color': 'white', 'label': 'No Data'}
)

ax.set_title('Districts Most and Least Affected by SALT Deduction Abolishment', 
             fontsize=14, fontweight='bold')
ax.axis('off')

# Add text annotations for the most extreme districts
for idx, row in merged_gdf.nsmallest(5, 'after_impact').iterrows():
    if not pd.isna(row.geometry):
        x, y = row.geometry.centroid.x, row.geometry.centroid.y
        ax.annotate(f"{row['STATEAB']}-{row['CDLABEL']}\n${row['after_impact']:.0f}", 
                   xy=(x, y), xytext=(x, y-0.5),
                   fontsize=8, ha='center', fontweight='bold',
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7),
                   arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0'))

plt.tight_layout()
plt.savefig('salt_impact_highlighted_districts.png', dpi=300, bbox_inches='tight')
plt.show()

print("\nHighlighted districts plot saved as 'salt_impact_highlighted_districts.png'")