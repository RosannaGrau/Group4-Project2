function exampleLDA() {


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
  socket.emit("get_example_data", { example_parameter: "hi" })
}

socket.on("example_data", (obj) => {
  console.log(obj)
})