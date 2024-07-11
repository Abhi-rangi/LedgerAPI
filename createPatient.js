const fetch = require('node-fetch');

const createPatient = async (org, identityName, patientData) => {
  const url = "http://localhost:3000/create-patient";
  const body = {
    org: org,
    identityName: identityName,
    patientData: patientData
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


  const patientData = {
    resourceType: "Patient",
    id: "patient123",
    identifier: [
      {
        use: "usual",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number",
            },
          ],
          text: "Medical Record Number",
        },
        system: "http://hospital.smarthealthit.org",
        value: "123456789",
        period: { start: "2022-01-01" },
        assigner: { display: "Smart Hospital" },
      },
    ],
    active: true,
    name: [
      {
        use: "official",
        family: "Doe",
        given: ["John", "B."],
      },
    ],
    gender: "male",
    birthDate: "1985-02-25",
    address: [
      {
        use: "home",
        line: ["1234 Elm St"],
        city: "Anytown",
        state: "CA",
        postalCode: "90210",
        country: "USA",
      },
    ],
  };

  

  createPatient("org1", "test21", patientData);
