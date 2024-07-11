const express = require("express");
const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());


const ccpPathBase =
  "/Users/abhishek/fabric-samples/test-network/organizations/peerOrganizations";

// Function to connect to gateway
const connectToGateway = async (org, identityName) => {
  try {
    const ccpPath = path.resolve(`${ccpPathBase}/${org}.example.com`, `connection-${org}.yaml`);
    const ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));

    const walletPath = path.join(process.cwd(), `wallet`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get(identityName);

    if (!identity) {
      console.log(`An identity for the user "${identityName}" does not exist in the wallet`);
      console.log("Run the registerUser.js application before retrying");
      return null;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: identityName,
      discovery: { enabled: true, asLocalhost: true },
    });

    return gateway;
  } catch (error) {
    console.error(`Failed to connect to gateway: ${error}`);
    return null;
  }
};

// Endpoint to register a user
app.post("/registerUser", async (req, res) => {
  const { org, enrollmentID, affiliation, role } = req.body;

  try {
    const ccpPath = path.resolve(`${ccpPathBase}/${org}.example.com`, `connection-${org}.yaml`);
    const ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));

    const caInfo = ccp.certificateAuthorities[`ca.${org}.example.com`];
    const ca = new FabricCAServices(
      caInfo.url,
      { trustedRoots: caInfo.tlsCACerts.pem, verify: false },
      caInfo.caName
    );

    const walletPath = path.join(process.cwd(), `wallet`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const adminIdentity = await wallet.get("admin");
    if (!adminIdentity) {
      return res.status(400).send('Admin identity not found in the wallet. Run the enrollAdmin.js application before retrying');
    }

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "admin");

    const secret = await ca.register(
      {
        affiliation: affiliation || `${org}.department1`,
        enrollmentID: enrollmentID,
        role: role || "client",
      },
      adminUser
    );
    const enrollment = await ca.enroll({
      enrollmentID: enrollmentID,
      enrollmentSecret: secret,
    });
    const userIdentity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: `${org.charAt(0).toUpperCase() + org.slice(1)}MSP`,
      type: "X.509",
    };
    await wallet.put(enrollmentID, userIdentity);
    res.status(200).send(`Successfully registered and enrolled user ${enrollmentID} and imported it into the wallet`);
  } catch (error) {
    res.status(500).send(`Error in registering or enrolling user: ${error}`);
  }
});
app.post("/checkUser", async (req, res) => {
  const { org, enrollmentID } = req.body;

  try {
    const walletPath = path.join(process.cwd(), `wallet`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const userIdentity = await wallet.get(enrollmentID);
    if (userIdentity) {
      res.status(200).send(`User ${enrollmentID} is already registered`);
    } else {
      res.status(404).send(`User ${enrollmentID} is not registered`);
    }
  } catch (error) {
    res.status(500).send(`Error in checking user registration: ${error}`);
  }
});

// Endpoint to create a patient
app.post("/create-patient", async (req, res) => {
  try {
    const { org, identityName, patientData } = req.body;
    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic");

    await contract.submitTransaction(
      "CreatePatient",
      JSON.stringify(patientData)
    );

    await gateway.disconnect();

    res.status(200).json({ message: "Patient record and initial observation have been created." });
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ message: `Failed to create patient: ${error.message}` });
  }
});

// Endpoint to append observation
app.post("/append-observation", async (req, res) => {
  try {
    const { org, identityName, patientId, observationData } = req.body;
    const timestamp = new Date().toISOString(); // Generate timestamp on server side

    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic");

    await contract.submitTransaction(
      "AppendObservation",
      patientId,
      JSON.stringify(observationData),
      timestamp // Pass the timestamp as a parameter
    );
    await gateway.disconnect();

    res.status(200).json({ message: "Observation has been appended." });
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    res.status(500).json({ message: `Failed to append observation: ${error.message}` });
  }
});

// Endpoint to get a patient
app.get("/get-patient/:id", async (req, res) => {
  try {
    const org = req.headers["org"];
    const identityName = req.headers["identityname"];
    const { id } = req.params;
    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("basic");

    const result = await contract.evaluateTransaction("ReadPatient", id);
    await gateway.disconnect();

    res.status(200).json(JSON.parse(result.toString()));
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ message: `Failed to fetch patient: ${error.message}` });
  }
});

// Endpoint to get all patients
app.get("/get-all-patients", async (req, res) => {
  try {
    const org = req.headers["org"];
    const identityName = req.headers["identityname"];
    const gateway = await connectToGateway(org, identityName);
    if (!gateway) {
      res.status(500).send("Failed to connect to gateway.");
      return;
    }
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("pt");

    const result = await contract.evaluateTransaction("GetAllPatients");
    await gateway.disconnect();

    res.status(200).json(JSON.parse(result.toString()));
  } catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ message: `Failed to fetch patients: ${error.message}` });
  }
});

app.listen(3001, () => {
  console.log("Server is listening on port http://localhost:3001");
});
