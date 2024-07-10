const { Gateway, Wallets } = require("fabric-network");
const fs = require("fs");
const path = require("path");
const http = require("http");

// Manually set peer URLs if discovery does not provide them
const peerUrls = {
  Org1MSP: "http://localhost:7051",
  Org2MSP: "http://localhost:9051",
};

async function listChannelParticipants(channelName) {
  const ccpPath = path.resolve(
    "/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com",
    "connection-org2.json"
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "admin",
    discovery: { enabled: true, asLocalhost: true },
  });

  try {
    const network = await gateway.getNetwork(channelName);
    const channel = network.getChannel();
    const endorsers = channel.getEndorsers();

    const peerStatuses = await Promise.all(
      endorsers.map(async (peer) => {
        const url = peerUrls[peer.mspid]; // Use manually configured URLs
        if (!url) {
          console.warn(`No URL configured for peer with MSPID: ${peer.mspid}`);
          return { mspid: peer.mspid, status: "NO URL CONFIGURED" };
        }
        try {
          const status = await checkPeerStatus(url);
          return { mspid: peer.mspid, status };
        } catch (error) {
          console.error(`Failed to check status for peer ${url}: ${error}`);
          return { mspid: peer.mspid, status: "ERROR" };
        }
      })
    );

    return peerStatuses;
  } finally {
    gateway.disconnect();
  }
}

async function checkPeerStatus(peerUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL("/health", peerUrl); // Adjust if your health check endpoint differs
    const req = http.get(url.href, (res) => {
      if (res.statusCode === 200) {
        resolve("UP");
      } else {
        resolve("DOWN");
      }
      res.resume();
    });

    req.on("error", (e) => {
      console.error(`Error checking peer status for ${url.href}: ${e.message}`);
      resolve("DOWN");
    });
  });
}

// Usage example
listChannelParticipants("channel1")
  .then((participants) => console.log("Participants:", participants))
  .catch((error) =>
    console.error("Failed to list channel participants:", error)
  );
