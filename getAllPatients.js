const readAllPatients = async () => {
    const url = "http://localhost:3000/get-all-patients";
    try {
        const response = await fetch(url);
      
        const result = await response.json();
        console.log("Success:", result);
      } catch (error) {
        console.error("Error:", error);
      }
      

}

readAllPatients();