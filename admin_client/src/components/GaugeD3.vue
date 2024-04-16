<template>
    <div>
        <svg :class="props.id">
        </svg>
    </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUpdate } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    value: Number,
    valueMax: Number,
    id: String,
    innerRadius: Number,
    outerRadius: Number,
    dark: Boolean
});
const valueRound = computed(() => {
    return Math.round(props.value);
});

// Define the arc generator with a fixed inner radius, 
// outer radius, and start angle
const arcGenerator = d3.arc()
    .innerRadius(props.innerRadius ? props.innerRadius : 60)
    .outerRadius(props.outerRadius ? props.outerRadius : 100)
    .startAngle(-Math.PI / 2);

// When the component is mounted, create an SVG group 
// for the arc and append a path element to it
onMounted(() => {
    // If 'valueRound.value' is truthy, use it as the data; otherwise, use 0 as the data
    const myData = valueRound.value ? [valueRound.value] : [0];

    // Select the SVG element, append a 'g' element to it, add the 'arc' class to the 'g' element,
    // and translate the 'g' element to the center of the SVG
    const svg = d3.select(`.${props.id}`)
        .attr('width', "100%")
        .attr('height', "100%")
        .attr('viewBox', '0 00 220 120')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .classed('arc', true)
        .attr('transform', 'translate(110, 110)');

    const myArc = svg.append('path')
        .classed('arcPath', true)
        .datum({ endAngle: ((myData / props.valueMax) * Math.PI) - Math.PI / 2 })
        .style('fill', colorScale(valueRound.value))
        .attr('stroke', colorScale(valueRound.value))
        .attr('d', arcGenerator);
});

const colorScale = d3.scaleLinear()
    .domain([0, props.valueMax / 2, props.valueMax])
    .range(['green', 'yellow', 'red']);

// This method is called before the component updates, i.e., when the 'value' prop changes
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
    const arcPath = d3.select(`.${props.id} .arcPath`);
    // Start a transition on the path element
    arcPath.transition()
        // Set the duration of the transition to 1000 milliseconds
        .duration(1100)
        // Use the 'arcTween' function to update the 'd' attribute of the path element during the transition
        // The new end angle is calculated based on 'valueRound.value'
        .attrTween('d', arcTween(((valueRound.value / props.valueMax) * Math.PI) - Math.PI / 2))
        .ease(d3.easeLinear)
        // Update the fill color of the arc based on 'valueRound.value'
        .style('fill', colorScale(valueRound.value))
        // Update the stroke color of the arc based on 'valueRound.value'
        .style('stroke', colorScale(valueRound.value));

    // Select all 'text' elements inside the 'g' element with the 'arc' class
    d3.select(`.${props.id} .arc`)
        .selectAll('text')
        .data([valueRound.value])
        .join('text')
        .attr('text-anchor', 'middle')
        //.style('font-size', '30px')
        //.classed('gauge-text', true)
        .text(d => d);

});

</script>
<style lang="scss">
svg {
    margin: auto;
    display: block;
}

body.body--light {
    text {
        font-size: 30px;
        fill: $green-10;
    }
}

body.body--dark {
    text {
        font-size: 30px;
        fill: #d41919;
    }
}
</style>