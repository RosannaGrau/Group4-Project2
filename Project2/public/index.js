/*function exampleLDA() {
  //you likely want to preprocess the data and load it in from the server.
  NumberData = [
    [1, 3, 3, 4, 5],
    [1, 2, 3, 24, 5],
    [1, 24, 3, 4, 2],
    [1, 2, 36, 5, 5],
    [1, 21, 3, 4, 5],
    [12, 2, 3, 7, 5]
  ]

  classes = ["a", "a", "b", "b", "a", "a"]


  const X = druid.Matrix.from(NumberData); // X is the data as object of the Matrix class.

  //https://saehm.github.io/DruidJS/LDA.html
  const reductionLDA = new druid.LDA(X,{ labels: classes, d: 2 }) //2 dimensions, can use more.
  const result = reductionLDA.transform()

  console.log(result.to2dArray) //convenience method: https://saehm.github.io/DruidJS/Matrix.html
};
*/


// this is working because of the import in the html file
// https://socket.io/docs/v4/client-installation/#standalone-build
const socket = io()

socket.on("connect", () => {
  console.log("Connected to the webserver.")
})
socket.on("disconnect", () => {
  console.log("Disconnected from the webserver.")
})

function request_example_data() {
  socket.emit("get_example_data", { example_parameter: "hi" });
}

let receivedData 
let normalizeMatrix
let matrixData;

socket.on("example_data", (obj) => {
  receivedData = obj;
  console.log(receivedData);
});


function vis1(){
  // first process the data
  const attrs = Object.keys(receivedData[0]).filter(a => {
    const value = receivedData[0][a];
    if (typeof value === "number") {
      return true;
    } else if (typeof value === "object" && value !== null) {
      const objectAttrs = Object.keys(value);
      return objectAttrs.some(attr => typeof value[attr] === "number");
    }
    return false;
  });
  
  const data = receivedData.map(d => attrs.map(a => d[a]));
  
 console.log(data)

  // Flattens the nested arrays and objects into a single array
  function flattenArray(data) {
  const flattened = [];

  function flatten(item) {
    if (Array.isArray(item)) {
      item.forEach(flatten);
    } else if (typeof item === 'object' && item !== null) {
      Object.values(item).forEach(flatten);
    } else {
      flattened.push(item);
    }
  }
  flatten(data);
  return flattened;
}

// normalize the data 
const matrixData = data.map(values => flattenArray(values));

const columnIndices = [1, 3, 4, 5, 6, 7, 8, 9]; 

for (let colIdx of columnIndices) {
  const column = matrixData.map(row => row[colIdx]); 

  const columnMax = Math.max(...column);
  const columnMin = Math.min(...column);

  for (let i = 0; i < matrixData.length; i++) {
    matrixData[i][colIdx] = (columnMax - matrixData[i][colIdx]) / (columnMax - columnMin);
  }
}

// rename the normalized data 
  const normalizedData = matrixData
  console.log(normalizedData)

  



// start the visualisation 1 with LDA  

//get the matrix just about the play time and publish year which we want for the visualisation 
const minplaytimeIndex = 5;
const maxplaytimeIndex = 6;
const publishYearIndex = 1
 
const minplaytimeData = matrixData.map(row => row[minplaytimeIndex]);
const maxplaytimeData = matrixData.map(row => row[maxplaytimeIndex]);
const publishYearData = matrixData.map(row =>row[publishYearIndex] )

const playtimeMatrixData = matrixData.map(row => [row[minplaytimeIndex],row[maxplaytimeIndex],row[publishYearIndex]]);

console.log(playtimeMatrixData);

//creat the labels for the LDA
const labels = [];
for (let i = 0; i < playtimeMatrixData.length; i++) {
  if (i <= 10) {
    labels.push("Top 10");
  } else if (i <= 40) {
    labels.push("Top 40");
  } else {
    labels.push("Top 100");
  }
}

const playtimeLDA = new druid.LDA(playtimeMatrixData, { labels, d: 2 });
const transformedMatrix = playtimeLDA.transform();
const transformedData_playtime = transformedMatrix;
console.log(transformedData_playtime)

// start to do the visualization
const svgWidth = 800;
const svgHeight = 550;

const colorScale = d3.scaleOrdinal()
  .domain([...new Set(labels)]) // Get unique labels
  .range(d3.schemeCategory10); // Use D3.js categorical color scheme

const margin = { top: 20, right: 20, bottom: 50, left: 50 };
const chartWidth = svgWidth - margin.left - margin.right;
const chartHeight = svgHeight - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("body")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Set up scales
const xScale = d3.scaleLinear()
  .domain(d3.extent(transformedData_playtime, d => d[0]))
  .range([0, chartWidth]);

const yScale = d3.scaleLinear()
  .domain(d3.extent(transformedData_playtime, d => d[1]))
  .range([chartHeight, 0]);

// Create axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

// Append x-axis
const xAxisGroup = chart.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${chartHeight})`)
  .call(xAxis);

// Append y-axis
chart.append("g")
  .attr("class", "y-axis")
  .call(yAxis);

// Append x-axis label
chart.append('text')
  .attr('class', 'axis-label')
  .attr('x', chartWidth / 2)
  .attr('y', chartHeight + margin.bottom - 10)
  .attr('text-anchor', 'middle')
  .style('font-family', 'Helvetica')
  .style('font-size', 12)
  .text('LDA Reduced Coordinate X');

  // Append y-axis label
chart.append('text')
.attr('class', 'axis-label')
.attr('text-anchor', 'middle')
.attr('transform', `translate(-30, ${chartHeight / 2})rotate(-90)`)
.style('font-family', 'Helvetica')
.style('font-size', 12)
.text('LDA Reduced Coordinate Y');



// Create a container for the bubbles
const bubbleContainer = chart.append("g")
  .attr("class", "bubble-container")
  .attr("transform", `translate(0, 0)`);
// Create bubbles
const year = data.map(row => row[1]);

bubbleContainer.selectAll('.bubble')
  .data(transformedData_playtime)
  .enter()
  .append("circle")
  .attr('class', 'bubble')
  .attr("cx", d => xScale(d[0]))
  .attr("cy", d => yScale(d[1]))
  .attr("r", (d, i) => {
    if (year[i] < 2000) {
      return 5;
    } else if (year[i] >= 2000 && year[i] < 2010) {
      return 7;
    } else if (year[i] >= 2010 && year[i] < 2016) {
      return 12;
    } else {
      return 17;
    }
  }) 
  .attr("fill", (d, i) => colorScale(labels[i])) // Use color scale based on labels
  .attr("opacity", 0.3)
  .append("title")
  .text((d, i) => `Game ${i+1}\nRank: ${i+1}\nTransformed Coordinates: (${d[0]}, ${d[1]})`);


// Update the bubble positions based on the scales
bubbleContainer.selectAll('.bubble')
  .attr("cx", d => xScale(d[0]))
  .attr("cy", d => yScale(d[1]));





// Create legend for the colors 
const legendContainer = svg.append("g")
  .attr("class", "legend-container")
  .attr("transform", `translate(${svgWidth + 15}, ${svgHeight - 500})`);

const legend = legendContainer.selectAll(".legend")
  .data([...new Set(labels)])
  .enter()
  .append("g")
  .attr("class", "legend")
  .attr("transform", (d, i) => `translate(0, ${i * 20})`);

// Add colored circles to legend
legend.append("circle")
  .attr("cx", 5)
  .attr("cy", 5)
  .attr("r", 5)
  .attr("fill", d => colorScale(d))
  .attr("opacity", 0.7);

// Add labels to legend
legend.append("text")
  .attr("x", 15)
  .attr("y", 8)
  .attr("dy", "0.35em")
  .text(d => d);

// Define the legend data for the radius size 
const legendData = [
  { radius: 3, label: 'Published before 2000' },
  { radius: 7, label: 'Published between 2000 and 2010' },
  { radius: 12, label: 'Published between 2010 and 2016' },
  { radius: 17, label: 'Published after 2016' }
];

// Calculate the dimensions and positions for the legend
const legendX = svgWidth + 15;
const legendY = svgHeight -400;
const legendSpacing = 35;

// Create the legend container
const legendContainer2 = svg.append('g')
  .attr('class', 'legend')
  .attr('transform', `translate(${legendX}, ${legendY})`);

// Create legend circles
const legendCircles = legendContainer2.selectAll('.legend-circle')
  .data(legendData)
  .enter()
  .append('circle')
  .attr('class', 'legend-circle')
  .attr('cx', 0)
  .attr('cy', (d, i) => i * legendSpacing)
  .attr('r', d => d.radius)
  .style('fill', "none")
  .style('stroke',"#9370DB");

// Create legend labels
const legendLabels = legendContainer2.selectAll('.legend-label')
  .data(legendData)
  .enter()
  .append('text')
  .attr('class', 'legend-label')
  .attr('x', 20)
  .attr('y', (d, i) => i * legendSpacing)
  .attr('dy', '0.35em')
  .style('font-size', '12px')
  .text(d => d.label);
}



function vis2(){
  
const uniqueCategories = [...new Set(receivedData.flatMap(receivedData => receivedData.types.categories.map(category => category.name)))];
console.log(uniqueCategories);
const categories = [...new Set(receivedData.flatMap(receivedData => receivedData.types.categories.map(category => category.name)))];
const gameCategoryArray = [];

for (const game of receivedData) {
  const categoryArray = [];
  for (const category of categories) {
    const containsCategory = game.types.categories.some(cat => cat.name === category);
    categoryArray.push(containsCategory ? 1 : 0);
  }
  gameCategoryArray.push(categoryArray);
}

console.log(gameCategoryArray);
  
  
  const margin = { top: 160, right: 200, bottom: 20, left: 20 };
const viewBox = { x: 0, y: 0, w: 1000, h: 600 };
const width = viewBox.w - margin.left - margin.right;
const height = viewBox.h - margin.top - margin.bottom;

const svg = d3.select('#container')
    .append('svg')
    .attr('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`)
    .attr('width', window.innerWidth - margin.left - margin.right)
    .attr('height', window.innerHeight - margin.top - margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)    
    .attr('color', 'black')                                         
    .attr('font-weight', 'bold')                                       
    .attr('stroke-width', 2);                                          

    window.addEventListener('resize', function (event) {   
    d3.select('svg')
        .attr('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`)
        .attr('width', window.innerWidth - margin.left - margin.right)
        .attr('height', window.innerHeight - margin.top - margin.bottom)
});



const xrange = [0, 10];
const x = d3.scaleLinear()
    .domain(xrange)         
    .range([0, width]);     

const yrange = [0, 10];
const y = d3.scaleLinear()
    .domain(yrange)         
    .range([height, 0]);    

const color = d3.scaleOrdinal(d3.schemeCategory10); // 10 different colors for 10 different numbers

svg.append('g')
    .attr('transform', `translate(0, ${height})`)  
    .call(d3.axisBottom(x));

svg.append('g')
    .call(d3.axisLeft(y));

    const getRandomPoint = () => {
    const point = {
        x: Math.random() * xrange[1],
        y: Math.random() * yrange[1],
        cluster: null
    };

    return point;
}

const generatePoints = (n) => {    
    return Array.from(Array(n)).map(_ => getRandomPoint());
}

const numPoints = gameCategoryArray

const numClusters = 3;
const points = generatePoints(numPoints);
const centroids = generatePoints(numClusters);

const pointsSvg = svg.append('g')          
    .attr('id', 'points-svg')              
    .selectAll('dot')
    .data(points)                          
    .join('circle')                        
    .attr('cx', d => x(d.x))               
    .attr('cy', d => y(d.y))
    .attr('r', 4)                          
    .style('fill', d => color(d.cluster)); 


const centroidsSvg = svg.append('g')
    .attr('id', 'centroids-svg')
    .selectAll('dot')
    .data(centroids)
    .join('circle')
    .attr('cx', d => x(d.x))
    .attr('cy', d => y(d.y))
    .attr('r', 5)                       
    .style('fill', '#e6e8ea')           
    .attr('stroke', (d, i) => color(i)) 
    .attr('stroke-width', 2);

    const distance = (a, b) => {    
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

const closestCentroid = (point) => {
    const distances = centroids.map(centroid => distance(point, centroid));   
    const i = distances.findIndex(d => d === Math.min(...distances));         
    return i;
}

const updatePoints = () => {
    points.forEach(point => {
        point.cluster = closestCentroid(point);
    });
    pointsSvg.transition()
        .duration(500)
        .style('fill', d => color(d.cluster));
}

const avg = (arr) => arr.reduce((p, c) => p + c, 0) / arr.length;      
const updateCentroids = () => {
    centroids.forEach((centroid, i) => {
        const cluster = points.filter(point => point.cluster === i);   
        if (cluster.length > 0) {
            centroid.x = avg(cluster.map(point => point.x));          
            centroid.y = avg(cluster.map(point => point.y));
        }
    });
    centroidsSvg.transition()
        .duration(500)
        .attr('cx', d => x(d.x))
        .attr('cy', d => y(d.y));                                      
}

updatePoints();          


}

