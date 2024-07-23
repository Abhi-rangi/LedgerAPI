// const fetch = require('node-fetch');

const getAllPatients = async (org, identityName) => {
  const url = `http://localhost:3001/get-all-patients`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "org": org,
        "identityname": identityName,
      }
    });
    const text = await response.text();
    if (response.ok) {
      console.log("Success:", JSON.parse(text));
    } else {
      console.error("Failed:", text);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Example usage
getAllPatients("org1", "test21");

