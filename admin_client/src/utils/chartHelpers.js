import * as d3 from 'd3';
import { CHART_COLORS } from './chartConfig';

/**
 * Generate a time-based InfluxDB query
 * @param {string} bucket - InfluxDB bucket name
 * @param {string} device - Device ID to query
 * @param {string} timeRange - Time range for query (e.g. '-24h')
 * @param {string} aggregation - Time aggregation window (e.g. '5m')
 * @returns {string} InfluxDB query string
 */
export function generateQuery(bucket, device, timeRange, aggregation) {
  const deviceId = device !== "test" ? device : "Aegina";
  
  return `from(bucket: "${bucket}")
  |> range(start: ${timeRange})
  |> filter(fn: (r) => r._measurement == "anemometer")
  |> filter(fn: (r) => r._field == "temp" or r._field == "speed" 
                     or r._field == "hummidity" or r._field == "direction" 
                     or r._field == "rotPerSec")
  |> filter(fn: (r) => r.device == "${deviceId}")
  |> aggregateWindow(every: ${aggregation}, fn: mean, createEmpty: false)
  |> yield(name: "mean")`;
}

/**
 * Creates SVG gradients for chart areas
 * @param {Object} defs - D3 defs element
 */
export function createGradients(defs) {
  // Temperature gradient
  const tempGradient = defs.append('linearGradient')
    .attr('id', 'temperature-gradient')
    .attr('gradientTransform', 'rotate(90)');
  
  tempGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', CHART_COLORS.temperature)
    .attr('stop-opacity', 0.8);
  
  tempGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', CHART_COLORS.temperature)
    .attr('stop-opacity', 0.1);

  // Speed gradient
  const speedGradient = defs.append('linearGradient')
    .attr('id', 'speed-gradient')
    .attr('gradientTransform', 'rotate(90)');
  
  speedGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', CHART_COLORS.windSpeed)
    .attr('stop-opacity', 0.8);
  
  speedGradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', CHART_COLORS.windSpeed)
    .attr('stop-opacity', 0.1);
}

/**
 * Add "No Data Available" message to chart
 * @param {Object} svg - D3 SVG element
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 * @returns {Object} D3 text element
 */
export function addNoDataMessage(svg, width, height) {
  return svg.append('text')
    .attr('id', 'no-data-message')
    .attr('x', width / 2)
    .attr('y', height / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', '#888')
    .text('No measurement data available');
}

/**
 * Creates chart legend
 * @param {Object} svg - D3 SVG element
 * @param {Object} margin - Chart margins
 */
export function createLegend(svg, margin) {
  const legend = svg.append('g')
    .attr('transform', `translate(${margin.left + 10}, ${margin.top + 10})`);
    
  // Temperature legend
  legend.append('rect')
    .attr('width', 10)
    .attr('height', 5)
    .attr('fill', CHART_COLORS.temperature);
    
  legend.append('text')
    .attr('x', 15)
    .attr('y', 5)
    .style('font-size', '6px')
    .style('fill', CHART_COLORS.temperature)
    .text('Temperature');
    
  // Speed legend
  legend.append('rect')
    .attr('width', 10)
    .attr('height', 5)
    .attr('fill', CHART_COLORS.windSpeed)
    .attr('transform', 'translate(70, 0)');
    
  legend.append('text')
    .attr('x', 85)
    .attr('y', 5)
    .style('font-size', '6px')
    .style('fill', CHART_COLORS.windSpeed)
    .text('Wind Speed');
}

/**
 * Update time domain for chart with fallback for empty data
 * @param {Object} scale - D3 time scale
 * @param {Array} data - Data array
 * @returns {Object} Updated scale
 */
export function updateTimeDomain(scale, data) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  if (data && data.length > 0) {
    scale.domain(d3.extent(data, d => d._time));
  } else {
    scale.domain([twentyFourHoursAgo, now]);
  }
  
  return scale;
}