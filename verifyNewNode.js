const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const absolutePathToTestNetwork = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network';
const channelName = 'f';
const org1MSP = 'Org1MSP';
const org2MSP = 'Org2MSP';
const org3MSP = 'Org3MSP';
const ordererEndpoint = 'orderer.example.com:7050';
const fabricBinPath = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/bin';
const fabricCfgPath = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/config';

async function verifyPeerAddition() {
    try {
        // Set environment variables
        const env = {
            ...process.env,
            PATH: `${fabricBinPath}:${process.env.PATH}`,
            FABRIC_CFG_PATH: fabricCfgPath,
            CORE_PEER_LOCALMSPID: org1MSP,
            CORE_PEER_TLS_ROOTCERT_FILE: path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
            CORE_PEER_MSPCONFIGPATH: path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp'),
            CORE_PEER_ADDRESS: 'localhost:7051',
            CORE_PEER_TLS_ENABLED: 'true',
        };

        // Fetch the latest channel configuration block
        execSync(`peer channel fetch config config_block.pb -o ${ordererEndpoint} -c ${channelName} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, { env });

        // Decode the configuration block to JSON
        execSync(`configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json`, { env });
        execSync(`jq .data.data[0].payload.data.config config_block.json > config.json`, { env });

        // Read the config.json file
        const configJson = JSON.parse(fs.readFileSync('config.json'));

        // Log the structure of the Application groups to diagnose
        console.log('Application Groups:', JSON.stringify(configJson.channel_group.groups.Application.groups, null, 2));

        // Get and print anchor peers for Org1MSP
        if (configJson.channel_group.groups.Application.groups[org1MSP]) {
            const anchorPeersOrg1 = configJson.channel_group.groups.Application.groups[org1MSP].values.AnchorPeers.value.anchor_peers;
            console.log('Org1MSP Anchor Peers:', anchorPeersOrg1);
        } else {
            console.log('Org1MSP has no anchor peers configured.');
        }

        // Get and print anchor peers for Org2MSP
        if (configJson.channel_group.groups.Application.groups[org2MSP]) {
            const anchorPeersOrg2 = configJson.channel_group.groups.Application.groups[org2MSP].values.AnchorPeers.value.anchor_peers;
            console.log('Org2MSP Anchor Peers:', anchorPeersOrg2);
        } else {
            console.log('Org2MSP has no anchor peers configured.');
        }

        // Get and print anchor peers for Org3MSP
        if (configJson.channel_group.groups.Application.groups[org3MSP]) {
            const anchorPeersOrg3 = configJson.channel_group.groups.Application.groups[org3MSP].values.AnchorPeers.value.anchor_peers;
            console.log('Org3MSP Anchor Peers:', anchorPeersOrg3);
        } else {
            console.log('Org3MSP has no anchor peers configured or Org3MSP not found in the configuration.');
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

verifyPeerAddition();
