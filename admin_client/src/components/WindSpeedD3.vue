<template>
    <div>
        <q-card>
        <svg width="200" height="100">
        </svg>
        </q-card>
    </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUpdate } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    speed: Number,
    speedMax: Number
});
const speedRound = computed(() => {
    return Math.round(props.speed);
});

// Define the arc generator with a fixed inner radius, 
// outer radius, and start angle
const arcGenerator = d3.arc()
    .innerRadius(60)
    .outerRadius(100)
    .startAngle(-Math.PI / 2);

// When the component is mounted, create an SVG group 
// for the arc and append a path element to it
onMounted(() => {
    // If 'speedRound.value' is truthy, use it as the data; otherwise, use 0 as the data
    const myData = speedRound.value ? [speedRound.value] : [0];
    console.log('props.speedMax', props.speedMax);
    // Select the SVG element, append a 'g' element to it, add the 'arc' class to the 'g' element,
    // and translate the 'g' element to the center of the SVG
    const svg = d3.select('svg')
        .attr('viewBox', '0 0 200 100')
        .append('g')
        .classed('arc', true)
        .attr('transform', 'translate(100, 100)');

    const myArc = svg.append('path')
        .classed('arcPath', true)
        .datum({ endAngle: ((myData / props.speedMax) * Math.PI) - Math.PI / 2 })
        .style('fill', colorScale(speedRound.value))
        .attr('stroke', colorScale(speedRound.value))
        .attr('d', arcGenerator);
});

const colorScale = d3.scaleLinear()
    .domain([0, props.speedMax/2, props.speedMax])
    .range(['green', 'yellow', 'red']);

// This method is called before the component updates, i.e., when the 'speed' prop changes
onBeforeUpdate(() => {
    // This function generates a transition interpolator for the end angle of the arc
    function arcTween(newAngle) {
        return function (d) {
            // Create an interpolator from the current end angle to the new end angle
            const interpolate = d3.interpolate(d.endAngle, newAngle);
            return function (t) {
                // At time 't', set the end angle to the interpolated value
                d.endAngle = interpolate(t);
                // Return the path data for the arc with the updated end angle
                return arcGenerator(d);
            };
        };
    };

    // Select the path element of the arc
    const arcPath = d3.select('.arcPath');
    // Start a transition on the path element
    arcPath.transition()
        // Set the duration of the transition to 1000 milliseconds
        .duration(1100)
        // Use the 'arcTween' function to update the 'd' attribute of the path element during the transition
        // The new end angle is calculated based on 'speedRound.value'
        .attrTween('d', arcTween(((speedRound.value / props.speedMax) * Math.PI) - Math.PI / 2))
        .ease(d3.easeLinear)
        // Update the fill color of the arc based on 'speedRound.value'
        .style('fill', colorScale(speedRound.value))
        // Update the stroke color of the arc based on 'speedRound.value'
        .style('stroke', colorScale(speedRound.value));

    // Select all 'text' elements inside the 'g' element with the 'arc' class
    d3.select('.arc')
        .selectAll('text')
        .data([speedRound.value])
        .join('text')
        .attr('text-anchor', 'middle')
        .style('font-size', '30px')
        .text(d => d);

});

</script>