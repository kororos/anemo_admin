/**
 * Creates tooltip HTML content with formatted data
 * @param {Object} tempDataPoint - Temperature data point
 * @param {Object} speedDataPoint - Wind speed data point
 * @returns {string} HTML content for tooltip
 */
export function createTooltipContent(tempDataPoint, speedDataPoint) {
  if (!tempDataPoint || !speedDataPoint) return '';
  
  return `<div style="margin-bottom: 4px; font-weight: bold;">
    ${new Date(tempDataPoint._time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
  </div>
  <div style="display: flex; align-items: center; margin-bottom: 3px;">
    <span style="display: inline-block; width: 8px; height: 8px; background-color: #4285F4; margin-right: 6px; border-radius: 50%;"></span>
    <span style="color: #4285F4; font-weight: 500;">Temperature:</span> 
    <span style="margin-left: 4px;">${Math.round(tempDataPoint._value * 10) / 10}°C</span>
  </div>
  <div style="display: flex; align-items: center;">
    <span style="display: inline-block; width: 8px; height: 8px; background-color: #34A853; margin-right: 6px; border-radius: 50%;"></span>
    <span style="color: #34A853; font-weight: 500;">Wind Speed:</span> 
    <span style="margin-left: 4px;">${Math.round(speedDataPoint._value * 10) / 10} kts</span>
  </div>`;
}

/**
 * Find the closest data point to a given time
 * @param {Array} data - Array of time series data points
 * @param {Date} time - Time to find closest point to
 * @returns {Object|null} The closest data point or null if no data
 */
export function findClosestDataPoint(data, time) {
  if (!data || !data.length) return null;
  
  // Simple binary search implementation
  const timeValue = time.getTime();
  let left = 0;
  let right = data.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midTime = data[mid]._time.getTime();
    
    if (midTime === timeValue) {
      return data[mid];
    }
    
    if (midTime < timeValue) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  // Return the closest point
  if (left >= data.length) return data[data.length - 1];
  if (left <= 0) return data[0];
  
  // Compare distances to determine the closest point
  const leftDist = Math.abs(data[left - 1]._time.getTime() - timeValue);
  const rightDist = Math.abs(data[left]._time.getTime() - timeValue);
  
  return leftDist < rightDist ? data[left - 1] : data[left];
}

/**
 * Creates and returns a fully styled tooltip element
 * @param {Object} d3 - D3.js instance
 * @returns {Object} D3 selection of the tooltip
 */
export function createTooltipElement(d3) {
  // Remove any existing tooltips first
  d3.selectAll('.chart-tooltip').remove();
  
  // Create a new tooltip
  return d3.select('body')
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background-color', 'rgba(255,255,255,0.95)')
    .style('border', '1px solid #ddd')
    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '11px')
    .style('font-weight', '500')
    .style('color', '#333')
    .style('pointer-events', 'none')
    .style('z-index', '1000')
    .style('transition', 'opacity 0.2s');
}