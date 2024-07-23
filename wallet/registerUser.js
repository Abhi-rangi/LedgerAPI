

const registerUser = async (org, enrollmentID, affiliation, role) => {
  const url = "http://localhost:3001/registerUser";
  const body = {
    org: org,
    enrollmentID: enrollmentID,
    affiliation: affiliation,
    role: role
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
registerUser("org1", "test21", "org1.department1", "client");
