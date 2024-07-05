const createPatient = async () => {
  const url = "http://localhost:3000/create-patient";
  const urlread = "http://localhost:3000/read-all-patients";

  const patientData = {
    resourceType: "Patient",
    id: "patient1",
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

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientData),
    });

    const result = await response.json();
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }

  
};

// Call the function to execute the POST request
createPatient();
