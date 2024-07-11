const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const absolutePathToTestNetwork = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network';
const org4MSP = 'Org4MSP';
const org4Domain = 'org4.example.com';
const org4PeerPort = 12051;
const newOrgConfigPath = `${absolutePathToTestNetwork}/organizations/peerOrganizations/${org4Domain}/org4.json`;
const fabricBinPath = `${absolutePathToTestNetwork}/../bin`;
const fabricCfgPath = `${absolutePathToTestNetwork}/config`;

function execCommand(command) {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
}

function createOrg4Config() {
    const cryptoConfigPath = path.join(absolutePathToTestNetwork, 'crypto-config.yaml');
    const configtxPath = path.join(absolutePathToTestNetwork, 'configtx.yaml');

    // Step 1: Update the crypto-config.yaml
    const cryptoConfig = fs.readFileSync(cryptoConfigPath, 'utf8');
    const newCryptoConfig = cryptoConfig + `
PeerOrgs:
  - Name: Org4
    Domain: ${org4Domain}
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1
`;
    fs.writeFileSync(cryptoConfigPath, newCryptoConfig, 'utf8');

    // Generate crypto material
    execCommand(`cryptogen generate --config=${cryptoConfigPath} --output="organizations"`);

    // Step 2: Update the configtx.yaml
    const configtx = fs.readFileSync(configtxPath, 'utf8');
    const newConfigtx = configtx + `
Organizations:
  - &Org4
    Name: Org4MSP
    ID: Org4MSP
    MSPDir: organizations/peerOrganizations/${org4Domain}/msp
    Policies:
      Readers:
        Type: Signature
        Rule: "OR('Org4MSP.admin', 'Org4MSP.peer', 'Org4MSP.client')"
      Writers:
        Type: Signature
        Rule: "OR('Org4MSP.admin', 'Org4MSP.client')"
      Admins:
        Type: Signature
        Rule: "OR('Org4MSP.admin')"
    AnchorPeers:
      - Host: peer0.${org4Domain}
        Port: ${org4PeerPort}

Profiles:
  SampleMultiNodeEtcdRaft:
    ...
    Application:
      Organizations:
        - *Org4
`;
    fs.writeFileSync(configtxPath, newConfigtx, 'utf8');

    // Step 3: Generate the Org4 MSP definition
    execCommand(`configtxgen -printOrg Org4MSP > ${newOrgConfigPath}`);

    console.log('Org4 configuration created successfully.');
}

async function main() {
    try {
        createOrg4Config();

        console.log('Org4 configuration and MSP definition generation completed successfully.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
