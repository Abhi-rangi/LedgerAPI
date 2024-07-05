const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const absolutePathToTestNetwork = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network';
const ccpPath = path.resolve(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.yaml');
const walletPath = path.join(process.cwd(), 'wallet');
const channelName = 'mychannel';
const orgMsp = 'Org1MSP';
const ordererEndpoint = 'orderer.example.com:7050';
const fabricBinPath = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/bin'; // Update this path to your Fabric binaries location
const fabricCfgPath = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/config'; // Update this path to the directory containing core.yaml

async function main() {
    try {
        // Load the network configuration
        const ccp = yaml.load(fs.readFileSync(ccpPath, 'utf8'));

        // Set environment variables
        const env = {
            ...process.env,
            PATH: `${fabricBinPath}:${process.env.PATH}`,
            FABRIC_CFG_PATH: fabricCfgPath,
            CORE_PEER_LOCALMSPID: orgMsp,
            CORE_PEER_TLS_ROOTCERT_FILE: path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
            CORE_PEER_MSPCONFIGPATH: path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp'),
            CORE_PEER_ADDRESS: 'localhost:7051',
            CORE_PEER_TLS_ENABLED: 'true',
        };

        // Debug: Print environment variables to ensure they are set correctly
        console.log('Environment Variables:', env);

        // Fetch the current channel configuration from the orderer
        execSync(`peer channel fetch config config_block.pb -o ${ordererEndpoint} -c ${channelName} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, { env });

        // Decode the configuration block to JSON
        execSync(`configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json`, { env });
        execSync(`jq .data.data[0].payload.data.config config_block.json > config.json`, { env });

        // Read the config.json file
        const configJson = JSON.parse(fs.readFileSync('config.json'));

        // Modify the configuration to add the new peer node
        configJson.channel_group.groups.Application.groups.Org1MSP.values.AnchorPeers.value.anchor_peers.push({
            host: 'peer0.org1.example.com',
            port: 7052
        });

        // Write the modified configuration to a file
        fs.writeFileSync('modified_config.json', JSON.stringify(configJson));

        // Encode the original and modified configurations to protobuf
        execSync(`configtxlator proto_encode --input config.json --type common.Config --output config.pb`, { env });
        execSync(`configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb`, { env });

        // Compute the update
        execSync(`configtxlator compute_update --channel_id ${channelName} --original config.pb --updated modified_config.pb --output config_update.pb`, { env });

        // Decode the update to JSON
        execSync(`configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json`, { env });

        // Wrap the update in an envelope message
        execSync(`echo '{"payload":{"header":{"channel_header":{"channel_id":"${channelName}", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . > config_update_in_envelope.json`, { env });

        // Encode the envelope message to protobuf
        execSync(`configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output config_update_in_envelope.pb`, { env });

        // Sign the configuration update
        execSync(`peer channel signconfigtx -f config_update_in_envelope.pb`, { env });

        // Submit the configuration update
        execSync(`peer channel update -f config_update_in_envelope.pb -c ${channelName} -o ${ordererEndpoint} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, { env });

        console.log('Channel configuration updated successfully');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
