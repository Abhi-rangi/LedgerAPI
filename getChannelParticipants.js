const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");

async function listChannelParticipants(channelName) {
  const ccpPath = path.resolve(
    "/Users/abhishek/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com",
    "connection-org2.json"
  ); // Adjust to your connection profile path
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet"); // Adjust to your wallet path
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "admin", // Ensure this identity is in your wallet and has the necessary permissions
    discovery: { enabled: true, asLocalhost: true },
  });
//   console.log(gateway.getIdentity());
//   console.log(gateway.getOptions());

  try {
    const network = await gateway.getNetwork(channelName);
    const channel = network.getChannel();
// console.log(channel.getEndorsers());
    // Since direct API access might not be available, fallback to using CLI or modify for compatibility
    // The following is a placeholder to show where you would interact with the channel
    // console.log(`Channel ID: ${channel.getChannelName()}`);
    const mspids = channel.getEndorsers().map((peer) => peer.mspid);
    // console.log(channel.getCommitters(channel.getMspids[2]));
    console.log(channel.getMspids());
    return mspids;
  } finally {
    gateway.disconnect();
  }
}

// Usage example
listChannelParticipants("channel1")
  .then((participants) => console.log("Participants:", participants))
  .catch((error) =>
    console.error("Failed to list channel participants:", error)
  );

// const {
//   Gateway,
//   Wallets,
//   DefaultEventHandlerStrategies,
// } = require("fabric-network");
// const fs = require("fs");
// const path = require("path");
// const Client = require("fabric-common");

// async function listChannelParticipants(channelName) {
//   const ccpPath = path.resolve(
//     "/Users/abhishek/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com",
//     "connection-org1.json"
//   ); // Adjust with your actual connection profile path
//   const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

//   const walletPath = path.join(process.cwd(), "wallet"); // Adjust with your actual wallet path
//   const wallet = await Wallets.newFileSystemWallet(walletPath);

//   const gateway = new Gateway();
//   await gateway.connect(ccp, {
//     wallet,
//     identity: "admin", // Make sure 'appUser' exists in your wallet
//     discovery: { enabled: true, asLocalhost: true },
//     eventHandlerOptions: DefaultEventHandlerStrategies.NONE, // Avoid timeouts on offline
//   });

//   const client = gateway.getClient();
//   const admin = client.getPeerAdmin(); // Assuming the client is set as admin

//   const channel = client.getChannel(channelName);
//   const configEnvelope = await admin.getChannelConfig(channelName);
//   const configJson = Client.configEnvelopeToJson(configEnvelope);
//   const orgs = configJson.channel_group.groups.Application.groups;

//   const participantOrgs = Object.keys(orgs).map((key) => ({
//     mspid: orgs[key].values.MSP.value.config.name,
//     name: key,
//   }));

//   gateway.disconnect();

//   return participantOrgs;
// }

// // Usage example
// listChannelParticipants("mychannel")
//   .then((participants) => console.log("Participants:", participants))
//   .catch((error) =>
//     console.error("Failed to list channel participants:", error)
//   );

// const { Gateway, Wallets } = require("fabric-network");
// const fs = require("fs");
// const path = require("path");

// async function listChannelParticipants(channelName) {
//   const ccpPath = path.resolve(
//     "/Users/abhishek/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com",
//     "connection-org1.json"
//   ); // Path to your connection profile
//   const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

//   const walletPath = path.join(process.cwd(), "wallet"); // Path to your wallet
//   const wallet = await Wallets.newFileSystemWallet(walletPath);

//   const gateway = new Gateway();
//   await gateway.connect(ccp, {
//     wallet,
//     identity: "newUser", // Ensure 'appUser' is enrolled and exists in your wallet
//     discovery: { enabled: true, asLocalhost: true }, // Set based on your network configuration
//   });

//   const network = await gateway.getNetwork(channelName);
//   const channel = network.getChannel();

//   // Fetch the channel configuration
//   const config = await channel.getChannelConfig();
//   const orgs = config.config.channel_group.groups.map.group;

//   const participantOrgs = Object.keys(orgs)
//     .filter((key) => orgs[key].value && orgs[key].value.mspid)
//     .map((key) => ({
//       mspid: orgs[key].value.mspid,
//       name: key,
//     }));

//   gateway.disconnect();

//   return participantOrgs;
// }

// // Usage example
// listChannelParticipants("mychannel")
//   .then((participants) => console.log("Participants:", participants))
//   .catch((error) =>
//     console.error("Failed to list channel participants:", error)
//   );
