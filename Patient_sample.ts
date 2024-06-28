const patientData = {
  resourceType: "Patient",
  identifier: [
    {
      use: "usual",
      type: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            code: "MR",
            display: "Medical Record Number",
          },
        ],
        text: "MRN",
      },
      system: "http://hospital.smarthealthit.org",
      value: "12345",
      period: { start: "2001-05-06" },
      assigner: { display: "Hospital" },
    },
  ],
  active: true,
  name: [{ use: "official", family: "Doe", given: ["John"] }],
  gender: "male",
  birthDate: "1974-12-25",
  address: [
    {
      use: "home",
      line: ["123 Main St"],
      city: "Somewhere",
      state: "CA",
      postalCode: "90210",
      country: "USA",
    },
  ],
};
