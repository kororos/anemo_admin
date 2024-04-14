<template>
    <div>
        <VuePlotly :data="chartData.data" :layout="chartData.layout" :config="chartData.config"></VuePlotly>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { VuePlotly } from 'vue3-plotly';
const props = defineProps({
    temperature: Number
});

const chartData = computed(() => {
    return {
        data: [
            {
                value: props.temperature,
                type: 'indicator',
                gauge: {
                    axis: {
                        range: [0, 45],
                        visible: false,
                    },
                },
                domain: { row: 0, column: 0 },
                delta: { reference: 20 },
                mode: "gauge+number",
            }
        ],
        layout: {
             title: 'Temperature',
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