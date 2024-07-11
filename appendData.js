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
  type: "blood pressure",
  value: "122/80",
  unit: "mmHg"
};

appendData("org1", "test212", "testpatient1", observationData);


