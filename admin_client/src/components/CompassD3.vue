<template>
    <div>
        <svg>
        </svg>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUpdate, ref } from 'vue';
import * as d3 from 'd3';

const props = defineProps({
    angle: Number,
    radius: Number,
    id: String,
    arrowAngle: Number,
    arcStart: {
        type: Number,
        default: 90
    },
    arcEnd: {
        type: Number,
        default: 180
    }
});

const arcGenerator = d3.arc()
    .innerRadius(props.innerRadius ? props.innerRadius : 50)
    .outerRadius(props.outerRadius ? props.outerRadius : 55);

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function normalizeAngle(angle) {
    let normalizedAngle = angle - props.arcStart;
    if (normalizedAngle < 0) {
        normalizedAngle += 360;
    };
    // provided that props.arcStart = 90 then: 
    // if angle = 90 then normalizedAngle = 90 - 90 = 0
    // if angle = 0 then normalizedAngle = 0 - 90 = -90 + 360 = 270
    // if angle = 90 then normalizedAngle = 90 - 90 = 0
    return normalizedAngle;
}

const scales = ({ arcStart, arcEnd  }) => {
    
    const arcStartNormalized = normalizeAngle(arcStart);
    const arcEndNormalized = normalizeAngle(arcEnd);
    
    const remainingCircle = 360 - (arcStartNormalized + arcEndNormalized);
    const segmentLength = remainingCircle/6
    let domain = [];
    let range = [];

    domain.push(arcStartNormalized, arcEndNormalized);
    range.push('green', 'green');
    domain.push(arcEndNormalized + segmentLength);
    range.push('orange');
    domain.push(arcEndNormalized + 2 * segmentLength);
    range.push('red');
    domain.push(arcEndNormalized + 3 * segmentLength);
    range.push('red');
    domain.push(arcEndNormalized + 4 * segmentLength);
    range.push('red');
    domain.push(arcEndNormalized + 5 * segmentLength);
    range.push('orange');

    return { domain, range };

};

const scaleObject = scales({ arcStart: props.arcStart, arcEnd: props.arcEnd });

const colorScale = d3.scaleLinear()
    .domain(scaleObject.domain)
    .range(scaleObject.range);


onMounted(() => {
    var centerX = 110; // X-coordinate of circle center
    var centerY = 60; // Y-coordinate of circle center
    var radius = 50;  // Radius of the circle

    d3.select('svg')
        .attr('width', "100%")
        .attr('height', "100%")
        .attr('viewBox', '0 00 220 120')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('path')
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .datum({
            startAngle: degreesToRadians(props.arcStart),
            endAngle: degreesToRadians(props.arcEnd)
        })
        .style('fill', 'green')
        .attr('d', arcGenerator);

    d3.select('svg')
        .append('text')
        .attr('id', 'angle-text')
        .attr('text-anchor', 'middle')
        .text(Math.round(props.arrowAngle) + '°')
        .style('font-size', '15px')
        .attr('transform', `translate (${centerX},${centerY - radius / 2})`);

    d3.select('svg')
        .append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', 'none')
        //.style('stroke', 'black')
        .attr('stroke-width', '2');



    var numTicks = 36; // Number of ticks (360° / 30°)

    for (var i = 0; i < numTicks; i++) {
        var angle = (i * 10) * (Math.PI / 180); // Convert degrees to radians
        var tickLength = 10; // Length of each tick line

        let calcTickLength = (i * 10) % 45 === 0 ? 15 : 10;
        var x1 = centerX + (radius - calcTickLength / 2) * Math.cos(angle);
        var y1 = centerY + (radius - calcTickLength / 2) * Math.sin(angle);
        var x2 = centerX + (radius + calcTickLength / 2) * Math.cos(angle);
        var y2 = centerY + (radius + calcTickLength / 2) * Math.sin(angle);


        const line = d3.select('svg').append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke-width", 2)
            .attr("stroke", (i * 10) % 45 === 0 ? "red" : "black")
            .classed('longTick', calcTickLength === 15)
            .classed('shortTick', calcTickLength === 10);



        // .attr('transform', `rotate(${props.arrowAngle || 0} 100 100)`)
    }
    d3.select('svg')
        .append('g')
        .attr('id', 'arrow')
        .attr('transform', `translate(${centerX}, ${centerY})`)
        //.attr('transform', `translate(120,60)`)
        .append('g')
        .attr('id', 'rotate_group')
        .append('g')
        //.attr('transform', `translate(${-1*centerX}, ${-1* centerY})`)
        .attr('transform', `translate(-100, -40)`)
        .append("path")
        .attr("d", "M 95 70 v -50 h -10 l 15 -15 l 15 15 h -10 v 50 z")
        .style("stroke", "black")
        .style("fill", "green");

    d3.select('#rotate_group')
        .attr('transform', 'scale(0.5)');

    d3.select('#rotate_group')
        .select('g')
        .append('circle')
        .attr('cx', 100)
        .attr('cy', 40)
        .attr('r', 3)
        .style('fill', 'grey')
        .style('stroke', 'black');

    d3.select('svg')
        .append('g')
        .attr('id', 'kite-top-group')
        .append('g')
        .attr('id', 'kite-group')
        .append('path')
        .attr('d', "M482.595,292.638c55.214-67.941,49.505-155.849,43.682-193.764c-1.606-10.442-9.371-25.13-16.764-32.666 \
                    C471.665,27.7,442.04,11.3,424.35,4.338c-9.83-3.863-11.504,0.201-5.154, \
                    8.645c11.618,15.443,27.119,45.546,30.103,98.188 c3.366,59.431-20.722,132.001-33.134, \
                    164.925c-3.729,9.887-0.507,23.465,9.018,28.037 C461.347,321.479,482.595,292.638,482.595, \
                    292.638z");


    d3.select('#kite-group')
        .append('path')
        .attr('d', "M349.791,1.747c-53.168,10.911-80.201,49.878-84.006,78.211c-0.517,3.911,0.612, \
                    10.136,2.295,13.694 c4.476,9.419,14.401,25.885,29.988,27.903c3.892,0.516, \
                    9.352-2.372,12.163-5.097c15.539-15.013,64.222-59.383,111.308-74.262 C421.538,\
                    42.196,407.577-10.101,349.791,1.747z");

    d3.select('#kite-group')
        .append('circle')
        .attr('cx', 137.16)
        .attr('cy', 211.175)
        .attr('r', 38.308);

    d3.select('#kite-group')
        .append('path')
        .attr('d', "M93.641,257.84l-50.901,91.484c-7.879,13.961-2.974,31.747,10.834,39.599l102.883,\
                    62.07 c3.624,2.056,8.864,6.903,11.217,10.375l7.765,11.427h-0.057c-63.285,4.781-90.193,\
                    16.429-101.611,25.341 c-4.781,3.739-7.373,10.901-7.373,15.74v11.81c0,4.848,2.591,\
                    12.02,7.373,15.74c11.781,9.198,45.68,24.977,140.215,27.243 c4.284,0.105,8.473,\
                    0.153,12.565,0.153c96.265,0,139.487-27.713,153.592-39.618c2.745-2.313,4.313-5.747,\
                    4.313-9.409 c0-3.682-1.568-7.105-4.313-9.409c-13.406-11.322-54.353-37.82-144.555-39.493l-6.608-0.125l-15.988-31.805 \
                    c-2.63-5.278-8.3-12.326-12.891-16.046l-75.735-61.563c-1.54-1.252-1.874-3.672-0.717-5.297l5.394-7.66\
                    c3.547,3.634,8.73,6.072,13.588,6.072h112.656c0.736,0,2.152-0.048,3.547-0.392l37.332,\
                    47.697c1.884,2.41,4.695,3.672,7.535,3.672 c2.056,0,4.141-0.659,5.881-2.037c4.16-3.251,\
                    4.896-9.266,1.636-13.416l-86.062-109.968c-3.261-4.16-9.266-4.916-13.416-1.635 c-4.16,\
                    3.251-4.896,9.265-1.635,13.416l27.225,34.788c-3.108-0.669-6.56-1.032-10.347-1.032h-61.946 \
                    c-7.669,0-17.566-2.065-18.484-3.701l-19.747-44.188c-0.029-0.067-2.037-3.701-5.67-6.828l11.829,\
                    4.657 c0.832,1.205,1.291,2.037,1.31,2.065l15.138,33.803l3.366-4.79c2.305-3.252,2.735-7.756,\
                    1.214-11.619l43.442-20.243 c4.82-2.543,9.955-8.587,11.676-13.712l28.429-76.672c3.672-9.897,\
                    0.488-20.196-7.124-22.988 c-7.603-2.802-16.792,2.945-20.521,12.823l-26.297,69.672c-1.396,\
                    4.398-6.426,8.75-11.13,9.553l-39.551,12.278l-18.771-10.643 C105.775,249.473,97.886,\
                    250.324,93.641,257.84z");

    d3.select('#kite-top-group')
        .attr('transform', 'translate(120, 70) scale(0.04)');

    d3.selectAll('#kite-group path')
        .style('fill', colorScale(normalizeAngle(props.arrowAngle)));

    d3.selectAll('#kite-group circle')
        .style('fill', colorScale(normalizeAngle(props.arrowAngle)));
});

onBeforeUpdate(() => {
    const arrowAngle = props.arrowAngle;    

    d3.select('svg')
        .select('#rotate_group')
        .transition()
        .duration(800)
        .ease(d3.easeQuadInOut)
        .attr('transform', `scale(0.5) rotate(${arrowAngle || 0} 0 0 )`);
    d3.selectAll('#kite-group path')
        .transition()
        .duration(800)
        .style('fill', colorScale(normalizeAngle(arrowAngle)));

    d3.selectAll('#kite-group circle')
        .transition()
        .duration(800)
        .style('fill', colorScale(normalizeAngle(arrowAngle)));

    d3.select('#angle-text')
        .transition()
        .duration(800)
        .attr('text-anchor', 'middle')
        .text(Math.round(props.arrowAngle) + '°');
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

    .shortTick {
        stroke: black;
        stroke-width: 1;
    }

    svg circle {
        stroke: black;
        stroke-width: 1;
    }
}

body.body--dark {
    text {
        font-size: 30px;
        fill: #d41919;
    }

    .shortTick {
        stroke: lightgrey;
        stroke-width: 1;
    }

    svg circle {
        stroke: grey;
        stroke-width: 1;
    }
}
</style>