const fetch = require('node-fetch');

const getPatientById = async (org, identityName, patientId) => {
  const url = `http://localhost:3000/get-patient/${patientId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "org": org,
        "identityName": identityName,
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
getPatientById("org1", "test21", "patient123");
