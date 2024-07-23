// const fetch = require('node-fetch');

const appendData = async (org, identityName, patientId, observationData) => {
  const url = "http://localhost:3001/append-observation";
  const body = {
    org: org,
    identityName: identityName,
    patientId: patientId,
    observationData: observationData
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    if (response.ok) {
      console.log("Success:", text);
    } else {
      console.error("Failed:", text);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

// Example usage
const observationData = {
  type: "test measurement",
  value: "test value",
  unit: "test unit"
};

appendData("org1", "test21", "patient123", observationData);




