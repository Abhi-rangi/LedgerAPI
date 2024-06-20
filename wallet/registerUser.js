const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

async function main() {
  const ccpPath = path.resolve(
    "/Users/abhishek/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com",
    "connection-org1.yaml"
  );
  const ccp = yaml.load(fs.readFileSync(ccpPath, "utf8"));

  const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];
  const ca = new FabricCAServices(
    caInfo.url,
    { trustedRoots: caInfo.tlsCACerts.pem, verify: false },
    caInfo.caName
  );

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const adminIdentity = await wallet.get("admin");
  if (!adminIdentity) {
    console.error(
      'An identity for the admin user "admin" does not exist in the wallet'
    );
    console.error("Run the enrollAdmin.js application before retrying");
    return;
  }

  const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
  const adminUser = await provider.getUserContext(adminIdentity, "admin");

  try {
    const secret = await ca.register(
      {
        affiliation: "org1.department1",
        enrollmentID: "newUser",
        role: "client",
      },
      adminUser
    );
    const enrollment = await ca.enroll({
      enrollmentID: "newUser",
      enrollmentSecret: secret,
    });
    const userIdentity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };
    await wallet.put("newUser", userIdentity);
    console.log(
      'Successfully registered and enrolled user "newUser" and imported it into the wallet'
    );
  } catch (error) {
    console.error(`Error in registering or enrolling user: ${error}`);
  }
}

main();
