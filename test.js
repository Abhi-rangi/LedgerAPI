fetch("http://localhost:3000/create-asset", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    assetID: "asset7",
    color: "yellow",
    size: "45",
    owner: "Pouria",
    appraisedValue: "4000",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
