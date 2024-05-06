<template>
    <svg :class="props.id">
    </svg>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUpdate } from 'vue';
import * as d3 from 'd3';
import {InfluxDB} from '@influxdata/influxdb-client-browser'

const props = defineProps({
  id: String
});

const queryApi = new InfluxDB({url: process.env.INFLUX_URL, token: process.env.INFLUX_TOKEN}).getQueryApi(process.env.INFLUX_ORG);
const flexQuery = `from(bucket: "${process.env.INFLUX_BUCKET}")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "anemometer")
  |> filter(fn: (r) => r._field == "temp" or r._field == "speed" \
                                    or r._field == "humidity" or r._field == "direction" \
                                    or r._field == "rotPerSec")
  |> filter(fn: (r) => r.device == "Aegina")
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
  |> yield(name: "mean")`;
console.log(flexQuery);

const measurements = ref([]);

onMounted(() => {
  setInterval(async () => {
    await iterateRows();
  }, 60000);
});
async function iterateRows() {
  const rows = [];
  for await (const {values, tableMeta} of queryApi.iterateRows(flexQuery)) {
    // const table = tableMeta as FluxTableMetaData;
    // for (let i = 0; i < values.length; i++) {
    //   const value = values[i];
    //   rows.push(value);
    // }
    const o = tableMeta.toObject(values);
    //console.log(`${o._time} ${o._measurement} in '${o.device}' ${o._field}=${o._value}`);
    measurements.value.push(o);
  }
  //console.log(measurements.value);
}
</script>