<template>
    <svg :class="props.id">
    </svg>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUpdate, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import { InfluxDB } from '@influxdata/influxdb-client-browser'

const props = defineProps({
    id: String,
    device: String
});

let intervalId;
console.log(`INFLUX_URL: ${process.env.INFLUX_URL}`);
console.log(`INFLUX_TOKEN: ${process.env.INFLUX_TOKEN}`);
const queryApi = new InfluxDB({ url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN }).getQueryApi(process.env.INFLUX_ORG);
const flexQuery = `from(bucket: "${process.env.INFLUX_BUCKET}")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "anemometer")
  |> filter(fn: (r) => r._field == "temp" or r._field == "speed" \
                                    or r._field == "hummidity" or r._field == "direction" \
                                    or r._field == "rotPerSec")
  |> filter(fn: (r) => r.device == "${props.device !== "test" ? props.device : "Aegina"}")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> yield(name: "mean")`;
console.log(flexQuery);

const measurements = ref([]);
const tempMeasurements = computed(() => {
    return measurements.value.filter(m => m._field === 'temp');
});
const rotsPerSecMeasurements = computed(() => {
    return measurements.value.filter(m => m._field === 'rotPerSec');
});

const speedMeasurements = computed(() => {
    return rotsPerSecMeasurements.value.map(m => {
        return {
            _time: m._time,
            _value: m._value * 1.46
        }
    });
});
const humidityMeasurements = computed(() => {
    return measurements.value.filter(m => m._field === 'hummidity');
});
const directionMeasurements = computed(() => {
    return measurements.value.filter(m => m._field === 'direction');
});
onBeforeUnmount(async () => {
    clearInterval(intervalId);
});
onMounted(async () => {
    //   await iterateRows();
    await iterateRows();
    updateFunctions();
    createChart();
    intervalId = setInterval(async () => {
        await iterateRows();
        updateFunctions();
        updateChart();
    }, 10000);
});
async function iterateRows() {
    const rows = [];
    measurements.value = [];
    for await (const { values, tableMeta } of queryApi.iterateRows(flexQuery)) {
        const o = tableMeta.toObject(values);
        o._time = new Date(o._time);
        measurements.value.push(o);
    }
}

const width = 400;
const height = 160; // Increased height to accommodate labels and add more space
const margin = { top: 15, right: 40, bottom: 50, left: 40 }; // Adjusted margins for better spacing


let xAxis;
let yAxis;
let y2Axis;
let line;
let speedLine;
let area;
let speedArea;

function updateFunctions() {
    xAxis = d3.scaleUtc().range([0, width - margin.left - margin.right]);
    
    // Handle empty data case by setting a default domain for x-axis
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Use actual data timespan if available, otherwise use last 24h
    xAxis.domain(
        tempMeasurements.value.length > 0 
            ? d3.extent(tempMeasurements.value, d => d._time)
            : [twentyFourHoursAgo, now]
    );
    
    // Fixed scales for consistent display even with no data
    yAxis = d3.scaleLinear([0, 45], [height - margin.bottom, 0]);
    y2Axis = d3.scaleLinear([0, 22.5], [height - margin.bottom, 0]);
    
    line = d3.line()
        .x(d => xAxis(d._time))
        .y(d => yAxis(d._value))
        .defined(d => d && d._time && d._value != null); // Skip invalid data points

    speedLine = d3.line()
        .x(d => xAxis(d._time))
        .y(d => y2Axis(d._value))
        .defined(d => d && d._time && d._value != null); // Skip invalid data points

    area = d3.area()
        .x(d => xAxis(d._time))
        .y0(yAxis(0))
        .y1(d => yAxis(d._value))
        .defined(d => d && d._time && d._value != null) // Skip invalid data points
        .curve(d3.curveBasis);

    speedArea = d3.area()
        .x(d => xAxis(d._time))
        .y0(y2Axis(0))
        .y1(d => y2Axis(d._value))
        .defined(d => d && d._time && d._value != null) // Skip invalid data points
        .curve(d3.curveBasis);
}
function createChart() {
    const svg = d3.select(`.${props.id}`)
        .attr('width', "100%")
        .attr('height', "100%")
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const defs = svg.append('defs');
    // Create temperature gradient (using a more vibrant blue)
    const gradient = defs.append('linearGradient')
        .attr('id', 'temperature-gradient')
        .attr('gradientTransform', 'rotate(90)');
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#4285F4') // Google blue
        .attr('stop-opacity', 0.8);
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#4285F4')
        .attr('stop-opacity', 0.1);

    // Create speed gradient (using a more vibrant green)
    const speedGradient = defs.append('linearGradient')
        .attr('id', 'speed-gradient')
        .attr('gradientTransform', 'rotate(90)');
    speedGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#34A853') // Google green
        .attr('stop-opacity', 0.8);
    speedGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#34A853')
        .attr('stop-opacity', 0.1);

    svg.append('g')
        .append('path')
        .attr('id', 'speedArea')
        .data([speedMeasurements.value])
        .attr('fill', 'url(#speed-gradient)')
        .attr('stroke', '#34A853') // Updated color to match
        .attr('stroke-width', 0.5)
        .attr('d', speedArea)
        .attr('transform', `translate(${margin.left}, 0)`)
        // Set initial opacity to 0 if no data
        .style('opacity', speedMeasurements.value.length > 0 ? 1 : 0);

    svg.append('path')
        .attr('id', 'tempArea')
        .data([tempMeasurements.value])
        .attr('fill', 'url(#temperature-gradient)')
        .attr('stroke', '#4285F4') // Updated color to match
        .attr('stroke-width', 0.5)
        .attr('d', d => area(d))
        .attr('transform', `translate(${margin.left}, 0)`)
        // Set initial opacity to 0 if no data
        .style('opacity', tempMeasurements.value.length > 0 ? 1 : 0)
        .on('mouseover', function (event, d) {
            d3.select("div.tip")
                .style('opacity', 1)
                .style('left', `${d3.pointer(event)[0] + 60}px`)
                .style('top', `${d3.pointer(event)[1]}px`);
        })
        .on('mouseout', function (event, d) {
            d3.select("div.tip")
                .style('opacity', 0);
        })
        .on('mousemove', function (event, d) {
            const mouseX = d3.pointer(event)[0];
            const mouseTime = xAxis.invert(mouseX);
            const i = d3.bisectLeft(tempMeasurements.value.map(d => d._time), mouseTime);
            const tempDataPoint = tempMeasurements.value[i];
            const j = d3.bisectLeft(speedMeasurements.value.map(d => d._time), mouseTime);
            const speedDataPoint = speedMeasurements.value[j];
            d3.select("div.tip")
                .style('opacity', 1)
                .style('left', `${event.pageX}px`)
                .style('top', `${event.pageY}px`)
                .html(`<div style="margin-bottom: 4px; font-weight: bold;">
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
                </div>`);
        });

    // Add a subtle background for the chart area
    svg.append('rect')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', '#f8f9fa')
        .attr('opacity', 0.3);

    // Left Y-axis for temperature with improved styling
    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yAxis).tickValues([0, 5, 10, 15, 20, 25, 30, 35, 40]).tickSize(3).tickSizeOuter(0).tickFormat(d => `${d}°C`))
        .call(g => g.select('.domain').style('stroke-width', 0.5).style('stroke', '#666'))
        .call(g => g.selectAll('.tick line').style('stroke-width', 0.5).style('stroke', '#666'))
        .call(g => g.selectAll('.tick line').clone()
            .attr('stroke-opacity', 0.15)
            .attr('stroke-dasharray', '2,2')
            .attr('stroke-width', 0.7)
            .attr('x2', width - margin.left - margin.right))
        .selectAll('text')
        .style('font-size', '7px')
        .style('fill', '#4285F4')
        .style('font-weight', 500);

    // Right Y-axis for speed with improved styling
    svg.append('g')
        .attr('transform', `translate(${width - margin.right},0)`)
        .call(d3.axisRight(y2Axis).tickValues([0, 5, 10, 15, 20]).tickSize(3).tickSizeOuter(0).ticks(5).tickFormat(d => `${d}kts`))
        .call(g => g.select('.domain').style('stroke-width', 0.5).style('stroke', '#666'))
        .call(g => g.selectAll('.tick line').style('stroke-width', 0.5).style('stroke', '#666'))
        .selectAll('text')
        .style('font-size', '7px')
        .style('fill', '#34A853')
        .style('font-weight', 500);

    // Add a chart title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('font-weight', 'bold')
        .style('fill', '#666')
        .text('24-Hour Measurements');

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${margin.left + 10}, ${margin.top + 10})`);
        
    // Temperature legend
    legend.append('rect')
        .attr('width', 10)
        .attr('height', 5)
        .attr('fill', '#4285F4');
        
    legend.append('text')
        .attr('x', 15)
        .attr('y', 5)
        .style('font-size', '6px')
        .style('fill', '#4285F4')
        .text('Temperature');
        
    // Speed legend
    legend.append('rect')
        .attr('width', 10)
        .attr('height', 5)
        .attr('fill', '#34A853')
        .attr('transform', 'translate(70, 0)');
        
    legend.append('text')
        .attr('x', 85)
        .attr('y', 5)
        .style('font-size', '6px')
        .style('fill', '#34A853')
        .text('Wind Speed');

    // Improved X-axis styling
    svg.append('g')
        .attr('id', 'xAxis')
        .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
        .call(d3.axisBottom(xAxis).tickSize(2).tickSizeOuter(0).ticks(d3.timeHour.every(2)).tickFormat(d3.timeFormat('%H:%M')))
        .call(g => g.select('.domain').style('stroke-width', 0.5).style('stroke', '#666'))
        .call(g => g.selectAll('.tick line').style('stroke-width', 0.5).style('stroke', '#666'))
        .call(g => g.selectAll('.tick text').style('font-size', '7px'))
        .selectAll('text')
        .attr('transform', 'translate(-5, 3) rotate(-45)')
        .style('text-anchor', 'end')
        .style('fill', '#666');
        
    // Check if we have data initially
    if (measurements.value.length === 0) {
        // Add a "No data available" message
        svg.append('text')
            .attr('id', 'no-data-message')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#888')
            .text('No measurement data available');
    }

    //Create an enhanced tooltip div
    d3.select('body').append('div')
        .attr('class', 'tip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'rgba(255,255,255,0.9)')
        .style('border', '1px solid #ddd')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('color', '#333')
        .style('pointer-events', 'none')
        .style('z-index', '10')
        .style('transition', 'opacity 0.2s');
}

function updateChart() {
    // Handle empty data case by setting a default domain for x-axis
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Use actual data timespan if available, otherwise use last 24h
    xAxis.domain(
        measurements.value.length > 0 
            ? d3.extent(measurements.value, d => d._time)
            : [twentyFourHoursAgo, now]
    );
    
    d3.select('#xAxis')
        .call(d3.axisBottom(xAxis).tickSize(2).tickSizeOuter(0).ticks(d3.timeHour.every(2)).tickFormat(d3.timeFormat('%H:%M')))
        .call(g => g.select('.domain').style('stroke-width', 0.5).style('stroke', '#666'))
        .call(g => g.selectAll('.tick line').style('stroke-width', 0.5).style('stroke', '#666'))
        .call(g => g.selectAll('.tick text').style('font-size', '7px'))
        .selectAll('text')
        .attr('transform', 'translate(-5, 3) rotate(-45)')
        .style('text-anchor', 'end')
        .style('fill', '#666');

    // Check if we have data
    if (measurements.value.length === 0) {
        // Remove any existing no-data message first
        d3.select('#no-data-message').remove();
        
        // Add a "No data available" message
        const svg = d3.select(`.${props.id}`);
        svg.append('text')
            .attr('id', 'no-data-message')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#888')
            .text('No measurement data available');
    } else {
        // Remove the no-data message if it exists
        d3.select('#no-data-message').remove();
    }

    // Update the temperature area
    d3.select('#tempArea')
        .data([tempMeasurements.value])
        .join('path')
        .attr('d', d => area(d))
        .style('opacity', tempMeasurements.value.length > 0 ? 1 : 0);

    // Update the speed area
    d3.selectAll('#speedArea')
        .data([speedMeasurements.value])
        .join('path')
        .attr('d', d => speedArea(d))
        .style('opacity', speedMeasurements.value.length > 0 ? 1 : 0);
}
</script>

<style lang="scss">
body.body--dark {
    .tip {
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
    .tip {
        background-color: rgba(255, 255, 255, 0.95) !important;
    }
}

// Responsive adjustments for the chart
@media (max-width: 600px) {
    svg text {
        font-size: 6px !important;
    }
    
    .tip {
        font-size: 10px !important;
        padding: 6px 10px !important;
    }
}
</style>