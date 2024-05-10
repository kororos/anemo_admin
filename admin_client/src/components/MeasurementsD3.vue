<template>
    <svg :class="props.id">
    </svg>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeMount, onBeforeUpdate } from 'vue';
import * as d3 from 'd3';
import { InfluxDB } from '@influxdata/influxdb-client-browser'

const props = defineProps({
    id: String,
    device: String
});

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
onBeforeMount(async () => {

    //    createChart();
});
onMounted(async () => {
    //   await iterateRows();
    await iterateRows();
    updateFunctions();
    createChart();
    setInterval(async () => {
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
const height = 130;
const margin = { top: 10, right: 30, bottom: 30, left: 30 };


let xAxis;
let yAxis;
let y2Axis;
let line;
let speedLine;
let area;
let speedArea;

function updateFunctions() {
    xAxis = d3.scaleUtc().range([0, width - margin.left - margin.right]);
    xAxis.domain(d3.extent(tempMeasurements.value, d => d._time));
    //xAxis.domain(d3.extent(tempMeasurements.value, d => d._time));
    yAxis = d3.scaleLinear([0, 45 /* d3.max(tempMeasurements.value, d => d._value)*/], [height - margin.bottom, 0]);
    y2Axis = d3.scaleLinear([0, 22.5 /*d3.max(speedMeasurements.value, d => d._value)*/], [height - margin.bottom, 0]);
    line = d3.line()
        .x(d => xAxis(d._time))
        .y(d => yAxis(d._value));

    speedLine = d3.line()
        .x(d => xAxis(d._time))
        .y(d => y2Axis(d._value));

    area = d3.area()
        .x(d => xAxis(d._time))
        .y0(yAxis(0))
        .y1(d => yAxis(d._value))
        .curve(d3.curveBasis);

    speedArea = d3.area()
        .x(d => xAxis(d._time))
        .y0(y2Axis(0))
        .y1(d => y2Axis(d._value))
        .curve(d3.curveBasis);
}
function createChart() {
    const svg = d3.select(`.${props.id}`)
        .attr('width', "100%")
        .attr('height', "100%")
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'temperature-gradient')
        .attr('gradientTransform', 'rotate(90)');
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'blue')
        .attr('stop-opacity', 0.7);
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'blue')
        .attr('stop-opacity', 0.1);

    const speedGradient = defs.append('linearGradient')
        .attr('id', 'speed-gradient')
        .attr('gradientTransform', 'rotate(90)');
    speedGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', 'green')
        .attr('stop-opacity', 0.7);
    speedGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', 'green')
        .attr('stop-opacity', 0.1);

    svg.append('g')
        .append('path')
        .attr('id', 'speedArea')
        .data([speedMeasurements.value])
        .attr('fill', 'url(#speed-gradient)')
        //.attr('fill-opacity', 0.3)
        .attr('stroke', 'green')
        .attr('stroke-width', 0.5)
        .attr('d', speedArea)
        .attr('transform', `translate(${margin.left}, 0)`);

    svg.append('path')
        .attr('id', 'tempArea')
        .data([tempMeasurements.value])
        .attr('fill', 'url(#temperature-gradient)')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 0.5)
        .attr('d', d => area(d))
        .attr('transform', `translate(${margin.left}, 0)`)
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
                .html(`Temperature: ${Math.round(tempDataPoint._value * 10,) / 10}°C<br/>\
                Speed: ${Math.round(speedDataPoint._value * 10) / 10}kts`);
        });

    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yAxis).tickValues([0, 5, 10, 15, 20, 25, 30, 35, 40]).tickSize(3).tickSizeOuter(0).tickFormat(d => `${d}°C`))
        .call(g => g.select('.domain').style('stroke-width', 0.5))
        .call(g => g.selectAll('.tick line').style('stroke-width', 0.5))
        .selectAll('text')
        .style('font-size', '6px');

    svg.append('g')
        .attr('transform', `translate(${width - margin.right},0)`)
        .call(d3.axisRight(y2Axis).tickValues([0, 5, 10, 15, 20]).tickSize(3).tickSizeOuter(0).ticks(5).tickFormat(d => `${d}kts`))
        .call(g => g.select('.domain').style('stroke-width', 0.5))
        .call(g => g.selectAll('.tick line').style('stroke-width', 0.5))
        .selectAll('text')
        .style('font-size', '6px');

    svg.append('g')
        .attr('id', 'xAxis')
        .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
        .call(d3.axisBottom(xAxis).tickSize(2).tickSizeOuter(0).ticks(d3.timeMinute.every(30)).tickFormat(d3.timeFormat('%H:%M')))
        .call(g => g.select('.domain').style('stroke-width', 0.5))
        .call(g => g.selectAll('.tick line').style('stroke-width', 0.5))
        .call(g => g.selectAll('.tick text').style('font-size', '6px'))
        //.call(g => g.selectAll('.tick:last-of-type line').style('stroke', 'black').style('stroke-width', 1))
        .selectAll('text')
        //.style('font-size', '6px')
        .attr('transform', 'translate(-7, 15) rotate(-90)');

    //Create a tooltip div
    d3.select('body').append('div')
        .attr('class', 'tip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background-color', 'white')
        .style('border', '1px solid black')
        .style('padding', '5px')
        .style('border-radius', '5px')
        .style('font-size', '10px')
        .style('pointer-events', 'none');
}

function updateChart() {
    xAxis.domain(d3.extent(measurements.value, d => d._time));
    d3.select('#xAxis')
        .call(d3.axisBottom(xAxis).tickSize(2).tickSizeOuter(0).ticks(d3.timeMinute.every(30)).tickFormat(d3.timeFormat('%H:%M')))
        .call(g => g.select('.domain').style('stroke-width', 0.5))
        .call(g => g.selectAll('.tick line').style('stroke-width', 0.5))
        .call(g => g.selectAll('.tick text').style('font-size', '6px'))
        .selectAll('text')
        .attr('transform', 'translate(-7, 15) rotate(-90)');

    d3.select('#tempArea')
        .data([tempMeasurements.value])
        .join('path')
            .attr('d', d => area(d));

    d3.selectAll('#speedArea')
        .data([speedMeasurements.value])
        .join('path')
            .attr('d', d => speedArea(d));
}
</script>