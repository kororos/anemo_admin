<template>
  <svg :class="props.id">
  </svg>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as d3 from 'd3';
import { InfluxDB } from '@influxdata/influxdb-client-browser';
import { CHART_COLORS, CHART_CONFIG } from '@/utils/chartConfig';
import { createTooltipContent, findClosestDataPoint, createTooltipElement } from '@/utils/tooltipHelper';
import { generateQuery, createGradients, addNoDataMessage, createLegend, updateTimeDomain } from '@/utils/chartHelpers';

// Props with validation
const props = defineProps({
  id: {
    type: String,
    required: true
  },
  device: {
    type: String,
    required: true
  }
});

// State management
const measurements = ref([]);
const chartElements = ref({
  svg: null,
  xAxis: null,
  yAxis: null,
  y2Axis: null,
  tempPath: null,
  speedPath: null,
  tooltip: null,
  noDataMessage: null,
  overlay: null
});

// Scales and path generators
const scales = ref({
  x: null,
  y: null,
  y2: null
});

const generators = ref({
  area: null,
  speedArea: null,
  line: null,
  speedLine: null
});

// Interval ID for cleanup
let dataRefreshInterval = null;

// Query API setup
const queryApi = new InfluxDB({ 
  url: process.env.INFLUX_URL, 
  token: process.env.INFLUX_TOKEN 
}).getQueryApi(process.env.INFLUX_ORG);

// Computed properties for data series
const tempMeasurements = computed(() => 
  measurements.value.filter(m => m._field === 'temp')
);

const rotsPerSecMeasurements = computed(() => 
  measurements.value.filter(m => m._field === 'rotPerSec')
);

const speedMeasurements = computed(() => 
  rotsPerSecMeasurements.value.map(m => ({
    _time: m._time,
    _value: m._value * 1.46
  }))
);

const humidityMeasurements = computed(() => 
  measurements.value.filter(m => m._field === 'hummidity')
);

const directionMeasurements = computed(() => 
  measurements.value.filter(m => m._field === 'direction')
);

// Computed property to check if data is available
const hasData = computed(() => 
  measurements.value.length > 0 && 
  tempMeasurements.value.length > 0 && 
  speedMeasurements.value.length > 0
);

// Lifecycle hooks
onMounted(async () => {
  await fetchData();
  initializeChart();
  setupDataRefresh();
});

onUnmounted(() => {
  cleanupResources();
});

// Data fetching
async function fetchData() {
  try {
    const query = generateQuery(
      process.env.INFLUX_BUCKET,
      props.device,
      CHART_CONFIG.timeRange,
      CHART_CONFIG.timeAggregation
    );
    
    measurements.value = [];
    
    for await (const { values, tableMeta } of queryApi.iterateRows(query)) {
      const o = tableMeta.toObject(values);
      o._time = new Date(o._time);
      measurements.value.push(o);
    }
  } catch (error) {
    console.error('Error fetching chart data:', error);
  }
}

// Chart initialization and setup
function initializeChart() {
  setupBaseChart();
  setupScales();
  setupGenerators();
  createChartElements();
  updateDataDisplay();
}

function setupBaseChart() {
  const { width, height } = CHART_CONFIG;
  
  // Create the base SVG element
  chartElements.value.svg = d3.select(`.${props.id}`)
    .attr('width', "100%")
    .attr('height', "100%")
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
    
  // Create tooltip
  chartElements.value.tooltip = createTooltipElement(d3);
}

function setupScales() {
  const { width, height, margin, tempMaxScale, speedMaxScale } = CHART_CONFIG;
  
  // X-axis time scale
  scales.value.x = d3.scaleUtc()
    .range([0, width - margin.left - margin.right]);
    
  // Update domain based on data or fallback to 24h
  updateTimeDomain(scales.value.x, tempMeasurements.value);
  
  // Y-axis scales
  scales.value.y = d3.scaleLinear()
    .domain([0, tempMaxScale])
    .range([height - margin.bottom, 0]);
    
  scales.value.y2 = d3.scaleLinear()
    .domain([0, speedMaxScale])
    .range([height - margin.bottom, 0]);
}

function setupGenerators() {
  const { x } = scales.value;
  const { y } = scales.value;
  const { y2 } = scales.value;
  
  // Line generators
  generators.value.line = d3.line()
    .x(d => x(d._time))
    .y(d => y(d._value))
    .defined(d => d && d._time && d._value != null);
    
  generators.value.speedLine = d3.line()
    .x(d => x(d._time))
    .y(d => y2(d._value))
    .defined(d => d && d._time && d._value != null);
    
  // Area generators
  generators.value.area = d3.area()
    .x(d => x(d._time))
    .y0(y(0))
    .y1(d => y(d._value))
    .defined(d => d && d._time && d._value != null)
    .curve(d3.curveBasis);
    
  generators.value.speedArea = d3.area()
    .x(d => x(d._time))
    .y0(y2(0))
    .y1(d => y2(d._value))
    .defined(d => d && d._time && d._value != null)
    .curve(d3.curveBasis);
}

function createChartElements() {
  const svg = chartElements.value.svg;
  const { margin, width, height } = CHART_CONFIG;
  
  // Add chart background
  svg.append('rect')
    .attr('x', margin.left)
    .attr('y', margin.top)
    .attr('width', width - margin.left - margin.right)
    .attr('height', height - margin.top - margin.bottom)
    .attr('fill', CHART_COLORS.background)
    .attr('opacity', 0.3);
    
  // Create gradients
  const defs = svg.append('defs');
  createGradients(defs);
  
  // Create chart title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '9px')
    .style('font-weight', 'bold')
    .style('fill', CHART_COLORS.text)
    .text('24-Hour Measurements');
    
  // Create the areas for data
  createDataAreas();
  
  // Create axes
  createAxes();
  
  // Create legend
  createLegend(svg, margin);
  
  // Create overlay for mouse interaction
  createOverlay();
  
  // Check for no data
  updateNoDataMessage();
}

function createDataAreas() {
  const svg = chartElements.value.svg;
  const { margin } = CHART_CONFIG;
  
  // Create speed area
  chartElements.value.speedPath = svg.append('g')
    .append('path')
    .attr('id', 'speedArea')
    .data([speedMeasurements.value])
    .attr('fill', 'url(#speed-gradient)')
    .attr('stroke', CHART_COLORS.windSpeed)
    .attr('stroke-width', 0.5)
    .attr('d', generators.value.speedArea)
    .attr('transform', `translate(${margin.left}, 0)`)
    .style('opacity', speedMeasurements.value.length > 0 ? 1 : 0);
    
  // Create temperature area
  chartElements.value.tempPath = svg.append('path')
    .attr('id', 'tempArea')
    .data([tempMeasurements.value])
    .attr('fill', 'url(#temperature-gradient)')
    .attr('stroke', CHART_COLORS.temperature)
    .attr('stroke-width', 0.5)
    .attr('d', d => generators.value.area(d))
    .attr('transform', `translate(${margin.left}, 0)`)
    .style('opacity', tempMeasurements.value.length > 0 ? 1 : 0);
}

function createAxes() {
  const svg = chartElements.value.svg;
  const { margin, width, height } = CHART_CONFIG;
  const { x, y, y2 } = scales.value;
  
  // Create Y-axis for temperature
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y)
      .tickValues([0, 5, 10, 15, 20, 25, 30, 35, 40])
      .tickSize(3)
      .tickSizeOuter(0)
      .tickFormat(d => `${d}°C`))
    .call(g => g.select('.domain').style('stroke-width', 0.5).style('stroke', CHART_COLORS.grid))
    .call(g => g.selectAll('.tick line').style('stroke-width', 0.5).style('stroke', CHART_COLORS.grid))
    .call(g => g.selectAll('.tick line').clone()
      .attr('stroke-opacity', 0.15)
      .attr('stroke-dasharray', '2,2')
      .attr('stroke-width', 0.7)
      .attr('x2', width - margin.left - margin.right))
    .selectAll('text')
    .style('font-size', '7px')
    .style('fill', CHART_COLORS.temperature)
    .style('font-weight', 500);
    
  // Create Y-axis for speed
  svg.append('g')
    .attr('transform', `translate(${width - margin.right},0)`)
    .call(d3.axisRight(y2)
      .tickValues([0, 5, 10, 15, 20])
      .tickSize(3)
      .tickSizeOuter(0)
      .ticks(5)
      .tickFormat(d => `${d}kts`))
    .call(g => g.select('.domain').style('stroke-width', 0.5).style('stroke', CHART_COLORS.grid))
    .call(g => g.selectAll('.tick line').style('stroke-width', 0.5).style('stroke', CHART_COLORS.grid))
    .selectAll('text')
    .style('font-size', '7px')
    .style('fill', CHART_COLORS.windSpeed)
    .style('font-weight', 500);
    
  // Create X-axis
  chartElements.value.xAxis = svg.append('g')
    .attr('id', 'xAxis')
    .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .tickSize(2)
      .tickSizeOuter(0)
      .ticks(d3.timeHour.every(2))
      .tickFormat(d3.timeFormat('%H:%M')))
    .call(g => g.select('.domain').style('stroke-width', 0.5).style('stroke', CHART_COLORS.grid))
    .call(g => g.selectAll('.tick line').style('stroke-width', 0.5).style('stroke', CHART_COLORS.grid))
    .call(g => g.selectAll('.tick text').style('font-size', '7px'));
    
  // Style the x-axis labels
  chartElements.value.xAxis.selectAll('text')
    .attr('transform', 'translate(-5, 3) rotate(-45)')
    .style('text-anchor', 'end')
    .style('fill', CHART_COLORS.text);
}

function createOverlay() {
  const svg = chartElements.value.svg;
  const { margin, width, height } = CHART_CONFIG;
  const { x } = scales.value;
  
  // Create a transparent overlay for mouse events
  chartElements.value.overlay = svg.append('rect')
    .attr('class', 'overlay')
    .attr('width', width - margin.left - margin.right)
    .attr('height', height - margin.top - margin.bottom)
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .style('fill', 'transparent')
    .style('pointer-events', 'all');
    
  // Add mouse event handlers
  chartElements.value.overlay
    .on('mouseover', handleMouseOver)
    .on('mouseout', handleMouseOut)
    .on('mousemove', handleMouseMove);
    
  function handleMouseOver() {
    if (!hasData.value) return;
    chartElements.value.tooltip.style('opacity', 1);
  }
  
  function handleMouseOut() {
    chartElements.value.tooltip.style('opacity', 0);
  }
  
  function handleMouseMove(event) {
    if (!hasData.value) return;
    
    const mouseX = d3.pointer(event)[0];
    const mouseTime = x.invert(mouseX);
    
    // Find closest data points
    const tempDataPoint = findClosestDataPoint(tempMeasurements.value, mouseTime);
    const speedDataPoint = findClosestDataPoint(speedMeasurements.value, mouseTime);
    
    // Return if we don't have valid data points
    if (!tempDataPoint || !speedDataPoint) return;
    
    // Update tooltip position and content
    chartElements.value.tooltip
      .style('opacity', 1)
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .html(createTooltipContent(tempDataPoint, speedDataPoint));
  }
}

function updateNoDataMessage() {
  const svg = chartElements.value.svg;
  const { width, height } = CHART_CONFIG;
  
  // Remove existing message if any
  if (chartElements.value.noDataMessage) {
    chartElements.value.noDataMessage.remove();
    chartElements.value.noDataMessage = null;
  }
  
  // Add message if no data
  if (!hasData.value) {
    chartElements.value.noDataMessage = addNoDataMessage(svg, width, height);
  }
}

function setupDataRefresh() {
  dataRefreshInterval = setInterval(async () => {
    await fetchData();
    updateChart();
  }, CHART_CONFIG.refreshInterval);
}

function updateChart() {
  updateScales();
  updateDataDisplay();
  updateAxes();
  updateNoDataMessage();
}

function updateScales() {
  // Update x-axis domain based on data
  updateTimeDomain(scales.value.x, measurements.value);
}

function updateDataDisplay() {
  // Update temperature area
  chartElements.value.tempPath
    .data([tempMeasurements.value])
    .join('path')
    .attr('d', d => generators.value.area(d))
    .style('opacity', tempMeasurements.value.length > 0 ? 1 : 0);

  // Update speed area
  chartElements.value.speedPath
    .data([speedMeasurements.value])
    .join('path')
    .attr('d', d => generators.value.speedArea(d))
    .style('opacity', speedMeasurements.value.length > 0 ? 1 : 0);
}

function updateAxes() {
  const { x } = scales.value;
  
  // Update x-axis
  chartElements.value.xAxis
    .call(d3.axisBottom(x)
      .tickSize(2)
      .tickSizeOuter(0)
      .ticks(d3.timeHour.every(2))
      .tickFormat(d3.timeFormat('%H:%M')))
    .call(g => g.select('.domain').style('stroke-width', 0.5).style('stroke', CHART_COLORS.grid))
    .call(g => g.selectAll('.tick line').style('stroke-width', 0.5).style('stroke', CHART_COLORS.grid))
    .call(g => g.selectAll('.tick text').style('font-size', '7px'))
    .selectAll('text')
    .attr('transform', 'translate(-5, 3) rotate(-45)')
    .style('text-anchor', 'end')
    .style('fill', CHART_COLORS.text);
}

function cleanupResources() {
  // Clear data refresh interval
  if (dataRefreshInterval) {
    clearInterval(dataRefreshInterval);
  }
  
  // Remove tooltip to prevent duplicates when component is remounted
  if (chartElements.value.tooltip) {
    chartElements.value.tooltip.remove();
  }
}
</script>

<style lang="scss">
body.body--dark {
  .chart-tooltip {
    background-color: rgba(40, 44, 52, 0.95) !important;
    color: #e0e0e0 !important;
    border-color: #555 !important;
  }
  
  svg {
    text {
      fill: #e0e0e0 !important;
    }
    
    .domain, .tick line {
      stroke: #666 !important;
    }
    
    rect[fill="#f8f9fa"] {
      fill: #2d3748 !important;
    }
  }
}

body.body--light {
  .chart-tooltip {
    background-color: rgba(255, 255, 255, 0.95) !important;
  }
}

/* Global tooltip styles to ensure visibility */
.chart-tooltip {
  position: absolute;
  pointer-events: none;
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  z-index: 9999;
  transition: opacity 0.2s;
}

// Responsive adjustments for the chart
@media (max-width: 600px) {
  svg text {
    font-size: 6px !important;
  }
  
  .chart-tooltip {
    font-size: 10px !important;
    padding: 6px 10px !important;
  }
}
</style>