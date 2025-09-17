import numpy as np
import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd

# Load the impact data from CSV
impact_df = pd.read_csv('congressional_district_impacts.csv')

# Load the hexagon shapefile for voting districts
hex_gdf = gpd.read_file('HexCDv31/HexCDv31.shp')
hex_gdf['cd_id'] = hex_gdf['GEOID'].astype(int)

# Load non-voting districts shapefile and extract only DC
nonvoting_gdf = gpd.read_file('HexDDv20/HexDDv20.shp')
# Filter for DC only (GEOID 1198)
dc_gdf = nonvoting_gdf[nonvoting_gdf['GEOID'] == '1198'].copy()
dc_gdf['cd_id'] = dc_gdf['GEOID'].astype(int)
# Add state abbreviation column to match main shapefile structure
dc_gdf['STATEAB'] = dc_gdf['ABBREV']
dc_gdf['STATENAME'] = dc_gdf['NAME']
dc_gdf['CDLABEL'] = dc_gdf['ABBREV']

# Combine voting districts with DC only
hex_gdf = pd.concat([hex_gdf, dc_gdf], ignore_index=True)

# Fix single-district state mappings (at-large districts)
single_district_states = {
    200: 201,   # Alaska
    1000: 1001, # Delaware  
    3800: 3801, # North Dakota
    4600: 4601, # South Dakota
    5000: 5001, # Vermont
    5600: 5601, # Wyoming
    1198: 1101  # DC (from 1198 in shapefile to 1101 in PolicyEngine data)
}
hex_gdf['cd_id'] = hex_gdf['cd_id'].replace(single_district_states)

# Merge impact data with shapefile
merged_gdf = hex_gdf.merge(
    impact_df[['congressional_district_geoid', 'avg_income_impact', 'avg_tax_change', 'total_households']], 
    left_on='cd_id', 
    right_on='congressional_district_geoid',
    how='left'
)

# Create the visualization with four subplots
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(20, 16))

# Plot 1: Average Income Impact (negative values = income decrease)
merged_gdf.plot(
    column='avg_income_impact',
    ax=ax1,
    legend=True,
    cmap='RdBu',  # Red for negative, Blue for positive
    edgecolor='black',
    linewidth=0.3,
    missing_kwds={'color': 'lightgray', 'label': 'No Data'},
    vmin=-2000,  # Set range to better show variation
    vmax=0
)
ax1.set_title('Average Household Income Impact from Abolishing SALT Deduction\n(Negative = Income Decrease)', 
              fontsize=12, fontweight='bold')
ax1.axis('off')

# Plot 2: Average Tax Change (positive values = tax increase)
merged_gdf.plot(
    column='avg_tax_change',
    ax=ax2,
    legend=True,
    cmap='coolwarm',  # Blue to Red
    edgecolor='black',
    linewidth=0.3,
    missing_kwds={'color': 'lightgray', 'label': 'No Data'},
    vmin=0,
    vmax=3000
)
ax2.set_title('Average Tax Change per Household from Abolishing SALT Deduction\n(Positive = Tax Increase)', 
              fontsize=12, fontweight='bold')
ax2.axis('off')

# Plot 3: Net Benefit/Loss (income impact + tax change)
merged_gdf['net_impact'] = merged_gdf['avg_income_impact'] + merged_gdf['avg_tax_change']
merged_gdf.plot(
    column='net_impact',
    ax=ax3,
    legend=True,
    cmap='RdYlGn',  # Red (negative) to Green (positive)
    edgecolor='black',
    linewidth=0.3,
    missing_kwds={'color': 'lightgray', 'label': 'No Data'},
    vmin=-1000,
    vmax=1000
)
ax3.set_title('Net Household Impact (Income + Tax Change)\n(Green = Net Benefit, Red = Net Loss)', 
              fontsize=12, fontweight='bold')
ax3.axis('off')

# Plot 4: Total District Impact (scaled by households)
merged_gdf['total_district_impact'] = (merged_gdf['avg_income_impact'] + merged_gdf['avg_tax_change']) * merged_gdf['total_households']
merged_gdf.plot(
    column='total_district_impact',
    ax=ax4,
    legend=True,
    cmap='PuOr',  # Purple to Orange
    edgecolor='black',
    linewidth=0.3,
    missing_kwds={'color': 'lightgray', 'label': 'No Data'}
)
ax4.set_title('Total District Impact (Net Impact × Total Households)\n(Aggregate District Effect)', 
              fontsize=12, fontweight='bold')
ax4.axis('off')

plt.suptitle('Impact of Abolishing SALT Deduction by Congressional District', 
             fontsize=16, fontweight='bold', y=1.02)
plt.tight_layout()
plt.savefig('salt_impact_by_district.png', dpi=300, bbox_inches='tight')
plt.show()

# Print summary statistics
print("\n=== Summary Statistics ===")
print(f"Districts with data: {impact_df.shape[0]}")
print(f"Total districts in shapefile: {hex_gdf.shape[0]}")

# Average impacts across all districts
print(f"\nNational Averages (Weighted by Households):")
total_households = impact_df['total_households'].sum()
weighted_income_impact = (impact_df['avg_income_impact'] * impact_df['total_households']).sum() / total_households
weighted_tax_change = (impact_df['avg_tax_change'] * impact_df['total_households']).sum() / total_households
weighted_net_impact = weighted_income_impact + weighted_tax_change
print(f"  Average Income Impact: ${weighted_income_impact:,.2f}")
print(f"  Average Tax Change: ${weighted_tax_change:,.2f}")
print(f"  Average Net Impact: ${weighted_net_impact:,.2f}")

print(f"\nDistricts by Impact:")
print(f"  Districts with net benefit: {(merged_gdf['net_impact'] > 0).sum()}")
print(f"  Districts with net loss: {(merged_gdf['net_impact'] < 0).sum()}")
print(f"  Districts with no data: {merged_gdf['net_impact'].isna().sum()}")

# Top winners and losers
print(f"\nTop 5 Districts with Greatest Net Benefit:")
top_benefit = impact_df.copy()
top_benefit['net_impact'] = top_benefit['avg_income_impact'] + top_benefit['avg_tax_change']
top_5_benefit = top_benefit.nlargest(5, 'net_impact')[['congressional_district_geoid', 'avg_income_impact', 'avg_tax_change', 'net_impact']]
for col in ['avg_income_impact', 'avg_tax_change', 'net_impact']:
    top_5_benefit[col] = top_5_benefit[col].apply(lambda x: f"${x:,.0f}")
print(top_5_benefit.to_string(index=False))

print(f"\nTop 5 Districts with Greatest Net Loss:")
bottom_5_loss = top_benefit.nsmallest(5, 'net_impact')[['congressional_district_geoid', 'avg_income_impact', 'avg_tax_change', 'net_impact']]
for col in ['avg_income_impact', 'avg_tax_change', 'net_impact']:
    bottom_5_loss[col] = bottom_5_loss[col].apply(lambda x: f"${x:,.0f}")
print(bottom_5_loss.to_string(index=False))

# Tax increase vs income impact correlation
print(f"\nCorrelation between tax increase and income loss: {impact_df['avg_tax_change'].corr(impact_df['avg_income_impact']):.3f}")

# States most affected
state_impacts = impact_df.copy()
state_impacts['state_fips'] = state_impacts['state_fips'].astype(int)
state_impacts['net_impact'] = state_impacts['avg_income_impact'] + state_impacts['avg_tax_change']
state_impacts['total_impact'] = state_impacts['net_impact'] * state_impacts['total_households']

state_summary = state_impacts.groupby('state_fips').agg({
    'total_households': 'sum',
    'total_impact': 'sum'
}).reset_index()
state_summary['avg_impact_per_household'] = state_summary['total_impact'] / state_summary['total_households']

print(f"\nTop 5 States with Greatest Average Net Loss per Household:")
worst_states = state_summary.nsmallest(5, 'avg_impact_per_household')[['state_fips', 'avg_impact_per_household']]
# Map state FIPS to names
state_names = {
    1: 'Alabama', 2: 'Alaska', 4: 'Arizona', 5: 'Arkansas', 6: 'California',
    8: 'Colorado', 9: 'Connecticut', 10: 'Delaware', 11: 'DC', 12: 'Florida',
    13: 'Georgia', 15: 'Hawaii', 16: 'Idaho', 17: 'Illinois', 18: 'Indiana',
    19: 'Iowa', 20: 'Kansas', 21: 'Kentucky', 22: 'Louisiana', 23: 'Maine',
    24: 'Maryland', 25: 'Massachusetts', 26: 'Michigan', 27: 'Minnesota',
    28: 'Mississippi', 29: 'Missouri', 30: 'Montana', 31: 'Nebraska',
    32: 'Nevada', 33: 'New Hampshire', 34: 'New Jersey', 35: 'New Mexico',
    36: 'New York', 37: 'North Carolina', 38: 'North Dakota', 39: 'Ohio',
    40: 'Oklahoma', 41: 'Oregon', 42: 'Pennsylvania', 44: 'Rhode Island',
    45: 'South Carolina', 46: 'South Dakota', 47: 'Tennessee', 48: 'Texas',
    49: 'Utah', 50: 'Vermont', 51: 'Virginia', 53: 'Washington',
    54: 'West Virginia', 55: 'Wisconsin', 56: 'Wyoming'
}
worst_states['state'] = worst_states['state_fips'].map(state_names).fillna('Unknown')
worst_states['avg_impact_per_household'] = worst_states['avg_impact_per_household'].apply(lambda x: f"${x:,.0f}")
print(worst_states[['state', 'avg_impact_per_household']].to_string(index=False))