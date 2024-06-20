fetch("http://localhost:3000/create-asset", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    assetID: "asset4",
    color: "Red",
    size: "20",
    owner: "Abhishek",
    appraisedValue: "3000",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
