const express = require("express");
const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");
const FabricCAServices = require("fabric-ca-client");
const yaml = require("js-yaml");

const app = express();
app.use(express.json());

const connectToGateway = async () => {
  const ccpPath = path.resolve(
    "/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com",
    "connection-org1.yaml"
  );
  const ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);


  const identity = await wallet.get("newuser");
 
  if (!identity) {
    console.log(
      'An identity for the user "newuser" does not exist in the wallet'
    );
    console.log("Run the registerUser.js application before retrying");
    return null;
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "newuser",
    discovery: { enabled: true, asLocalhost: true },
  });

  return gateway;
};

// app.post("/create-asset", async (req, res) => {
//   try {
//     const { assetID, color, size, owner, appraisedValue } = req.body;
//     const gateway = await connectToGateway();
//     if (!gateway) {
//       res.status(500).send("Failed to connect to gateway.");
//       return;
//     }
//     const network = await gateway.getNetwork("mychannel");
//     const contract = network.getContract("basic");

//     await contract.submitTransaction(
//       "CreateAsset",
//       assetID,
//       color,
//       size,
//       owner,
//       appraisedValue
//     );
//     await gateway.disconnect();

//     res
//       .status(200)
//       .json({ message: `Asset with ID ${assetID} has been created.` });
//   } catch (error) {
//     console.error(`Failed to submit transaction: ${error}`);
//     res
//       .status(500)
//       .json({ message: `Failed to create asset: ${error.message}` });
//   }
// });

app.post("/create-patient", async (req, res) => {
  try {
    // Assuming your patient data comes as a JSON object in the request body
    const patientData = req.body;
    const gateway = await connectToGateway();
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic"); // Ensure this matches the deployed chaincode name

    // Submit transaction for creating a patient. Assume the chaincode function 'CreatePatient' takes a JSON string
    await contract.submitTransaction(
      "CreatePatient",
      JSON.stringify(patientData)
    );
    await gateway.disconnect();

    res.status(200).json({ message: "Patient record has been created." });
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res
      .status(500)
      .json({ message: `Failed to create patient: ${error.message}` });
  }
});



app.listen(3000, () => {
  console.log("Server is listening on port http://localhost:3000");
});


app.get("/get-all-patients", async (req, res) => {
  try {
    const gateway = await connectToGateway();
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic");

    const result = await contract.evaluateTransaction("GetAllPatients");
    await gateway.disconnect();

    res.status(200).json(JSON.parse(result.toString()));
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res
      .status(500)
      .json({ message: `Failed to fetch assets: ${error.message}` });
  }
});

// app.get("/fetch-asset/:assetID", async (req, res) => {
//   try {
//     const { assetID } = req.params;
//     const gateway = await connectToGateway();
//     if (!gateway) {
//       res.status(500).send("Failed to connect to gateway.");
//       return;
//     }
//     const network = await gateway.getNetwork("mychannel");
//     const contract = network.getContract("basic");

//     const result = await contract.evaluateTransaction("ReadAsset", assetID);
//     await gateway.disconnect();

//     res.status(200).json(JSON.parse(result.toString()));
//   } catch (error) {
//     console.error(`Failed to evaluate transaction: ${error}`);
//     res
//       .status(500)
//       .json({ message: `Failed to fetch asset: ${error.message}` });
//   }
// }
// );