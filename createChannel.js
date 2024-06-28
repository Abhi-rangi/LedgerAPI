const FabricClient = require("fabric-client");
const path = require("path");
const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());



app.post("/createChannel", async (req, res) => {
  const channelName = req.body.channelName;
  if (!channelName) {
    return res.status(400).send("Channel name is required");
  }

  try {
    const result = await createChannel(channelName);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to create channel");
  }
});

async function createChannel(channelName) {
  const client = new FabricClient();
  const channel = client.newChannel(channelName);

  // Setup the orderer
  const caFile = path.resolve(
    __dirname,
    "/Users/abhishek/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
  );
  const orderer = client.newOrderer("grpcs://localhost:7050", {
    pem: caFile,
    "ssl-target-name-override": "orderer.example.com",
  });
  channel.addOrderer(orderer);

  // Load admin identity
  const storePath = path.join(__dirname, "hfc-key-store");
  const stateStore = await FabricClient.newDefaultKeyValueStore({
    path: storePath,
  });
  client.setStateStore(stateStore);
  const cryptoSuite = FabricClient.newCryptoSuite();
  const cryptoStore = FabricClient.newCryptoKeyStore({ path: storePath });
  cryptoSuite.setCryptoKeyStore(cryptoStore);
  client.setCryptoSuite(cryptoSuite);

  // Admin identity must be loaded prior to this step
  // Example: admin is already enrolled and their materials are loaded into the client
  const adminUser = await client.getUserContext("admin", true);

  // Create the channel configuration transaction
  const envelopeBytes = fs.readFileSync(
    path.resolve(
      __dirname,
      `/Users/abhishek/fabric-samples/test-network/channel-artifacts/${channelName}.tx`
    )
  );
  const config = client.extractChannelConfig(envelopeBytes);
  const signature = client.signChannelConfig(config);

  const request = {
    config: config,
    signatures: [signature],
    name: channelName,
    orderer: orderer,
    txId: client.newTransactionID(true), // get an admin based transactionID
  };

  // Create the channel
  const response = await client.createChannel(request);
  if (response && response.status === "SUCCESS") {
    console.log("Channel created successfully");
    return "Channel created successfully";
  } else {
    throw new Error("Failed to create the channel");
  }
}




app.listen(port, () =>
  console.log(`Server running on port http://localhost:${port}`)
);