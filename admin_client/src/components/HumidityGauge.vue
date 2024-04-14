<template>
    <div>
        <VuePlotly :data="chartData.data" :layout="chartData.layout" :config="chartData.config"></VuePlotly>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { VuePlotly } from 'vue3-plotly';
const props = defineProps({
    humidity: Number
});

const chartData = computed(() => {
    return {
        data: [
            {
                value: props.humidity,
                type: 'indicator',
                gauge: {
                    axis: {
                        range: [0, 100],
                        visible: false,
                    },
                },
                domain: { row: 0, column: 0 },
                delta: { reference: 60 },
                mode: "gauge+number",
            }
        ],
        layout: {
             title: 'Humidity',
             transition: { duration: 1500 },
        //     showlegend: false,
        //     xaxis: {
        //         title: 'Wind Speed'
        //     },
        //     // yaxis: {
        //     //     title: 'Speed (m/s)',
        //     //     range: [0, 30]
        //     // }
        },
        config: {
            displayModeBar: true,
            displaylogo: false,
            responsive: true
        }
    }
});


</script>