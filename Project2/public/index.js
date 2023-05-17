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
const svgHeight = 600;
const radius = 5; // Fixed radius for all bubbles

const colorScale = d3.scaleOrdinal()
  .domain([...new Set(labels)]) // Get unique labels
  .range(d3.schemeCategory10); // Use D3.js categorical color scheme


// Create SVG container
const svg = d3.select("body")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Create a container for the bubbles
const bubbleContainer = svg.append("g")
  .attr("class", "bubble-container");

// Set up scales
const xScale = d3.scaleLinear()
  .domain(d3.extent(transformedData_playtime, d => d[0]))
  .range([50, svgWidth - 50]);

const yScale = d3.scaleLinear()
  .domain(d3.extent(transformedData_playtime, d => d[1]))
  .range([50, svgHeight - 50]);

// Create bubbles
bubbleContainer.selectAll('.bubble')
  .data(transformedData_playtime)
  .enter()
  .append("circle")
  .attr('class', 'bubble')
  .attr("cx", d => xScale(d[0]))
  .attr("cy", d => yScale(d[1]))
  .attr("r", d => {
    if (d[2] < 2000) {
      return 5;
    } else if (d[2] >= 2000 && d[2] < 2010) {
      return 7;
    } else if (d[2] >= 2010 && d[2] < 2016) {
      return 13;
    } else {
      return 17;
    }
  })
  .attr("fill", (d, i) => colorScale(labels[i])) // Use color scale based on labels
  .attr("opacity", 0.3)
  .append("title")
  .text((d, i) => `Game ${i+1}\nRank: ${i+1}\nTransformed Coordinates: (${d[0]}, ${d[1]})`);

// Create legend
const legendContainer = svg.append("g")
  .attr("class", "legend-container")
  .attr("transform", `translate(${svgWidth + 15}, ${svgHeight - 550})`);

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

// Add axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

svg.append("g")
  .attr("transform", `translate(0, ${svgHeight - 50})`)
  .call(xAxis);

svg.append("g")
  .attr("transform", `translate(50, 0)`)
  .call(yAxis);

}
