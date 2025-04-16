/**
 * Chart colors configuration
 * Consistent color scheme for all charts
 */
export const CHART_COLORS = {
  temperature: '#4285F4',  // Google blue
  windSpeed: '#34A853',    // Google green
  grid: '#666',
  background: '#f8f9fa',
  text: '#666',
  darkMode: {
    background: '#2d3748',
    text: '#e0e0e0',
    grid: '#666'
  }
};

/**
 * Chart dimensions and configuration
 */
export const CHART_CONFIG = {
  width: 400,
  height: 160,
  margin: { top: 15, right: 40, bottom: 50, left: 40 },
  tempMaxScale: 45,
  speedMaxScale: 22.5,
  refreshInterval: 10000, // 10 seconds
  timeRange: '-24h',
  timeAggregation: '5m'
};