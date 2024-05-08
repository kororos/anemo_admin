<template>
    <svg :class="props.id">
    </svg>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUpdate } from 'vue';
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
onMounted(async () => {
    await iterateRows();
    updateChart();
    setInterval(async () => {
        await iterateRows();
    }, 10000);
});
async function iterateRows() {
    const rows = [];
    measurements.value = [];
    for await (const { values, tableMeta } of queryApi.iterateRows(flexQuery)) {
        // const table = tableMeta as FluxTableMetaData;
        // for (let i = 0; i < values.length; i++) {
        //   const value = values[i];
        //   rows.push(value);
        // }
        const o = tableMeta.toObject(values);
        o._time = new Date(o._time);
        //console.log(new Date(o._time).toUTCString());
        //console.log(`${o._time} ${o._measurement} in '${o.device}' ${o._field}=${o._value}`);
        measurements.value.push(o);
    }
    // console.log(tempMeasurements.value);
    // console.log(humidityMeasurements.value);
    // console.log(directionMeasurements.value);
    //console.log(measurements.value);
}


function updateChart() {
    const xAxis = d3.scaleUtc(d3.extent(measurements.value, d => d._time), [0, 340]);
    const yAxis = d3.scaleLinear([0, d3.max(tempMeasurements.value, d => d._value)], [100, 0]);
    const y2Axis = d3.scaleLinear([0, d3.max(speedMeasurements.value, d => d._value)], [100, 0]);
    const line = d3.line()
        .x(d => xAxis(d._time))
        .y(d => yAxis(d._value));

    const speedLine = d3.line()
        .x(d => xAxis(d._time))
        .y(d => y2Axis(d._value));

    const area = d3.area()
        .x(d => xAxis(d._time))
        .y0(yAxis(0))
        .y1(d => yAxis(d._value))
        .curve(d3.curveBasis);

    const speedArea = d3.area()
        .x(d => xAxis(d._time))
        .y0(y2Axis(0))
        .y1(d => y2Axis(d._value))
        .curve(d3.curveBasis);

    const svg = d3.select(`.${props.id}`)
        .attr('width', "100%")
        .attr('height', "100%")
        .attr('viewBox', '0 0 400 130')
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

    svg.append('path')
        .attr('fill', 'url(#speed-gradient)')
        //.attr('fill-opacity', 0.3)
        .attr('stroke', 'green')
        .attr('stroke-width', 1)
        .attr('d', speedArea(speedMeasurements.value))
        .attr('transform', `translate(30, 0)`);

    svg.append('path')
        .attr('fill', 'url(#temperature-gradient)')
        //.attr('fill-opacity', 0.3)
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1)
        .attr('d', area(tempMeasurements.value))
        .attr('transform', `translate(30, 0)`)
        .on('mouseover', function (event, d) {
            d3.select("div.tip")
                .style('opacity', 1)
                .style('left', `${d3.pointer(event)[0]+60}px`)
                .style('top', `${d3.pointer(event)[1]}px`);
          //      .text(`Temperature: ${d._value}°C`);
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
                .html(`Temperature: ${Math.round(tempDataPoint._value* 10, )/10}°C<br/>\
                Speed: ${Math.round(speedDataPoint._value*10)/10}kts`);
        });

    svg.append('g')
        .attr('transform', `translate(30, 0)`)
        .call(d3.axisLeft(yAxis).ticks(10).tickFormat(d => `${d}°C`))
        .selectAll('text')
        .style('font-size', '6px');

    svg.append('g')
        .attr('transform', `translate(370,0)`)
        .call(d3.axisRight(y2Axis).ticks(5).tickFormat(d => `${d}kts`))
        .selectAll('text')
        .style('font-size', '6px');

    svg.append('g')
        .attr('transform', `translate(30, 100)`)
        .call(d3.axisBottom(xAxis).ticks(d3.timeMinute.every(30)).tickFormat(d3.timeFormat('%H:%M')))
        .selectAll('text')
        .style('font-size', '6px')
        .attr('transform', 'translate(-11, 15) rotate(-90)');

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
</script>