const { exec } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const absolutePathToTestNetwork = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network'; // Replace with your actual path
const pathToFabricBinaries = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/bin'; // Replace with the actual path to the Fabric binaries

function runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(`Error: ${error.message}`);
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }
            resolve(stdout);
        });
    });
}

async function createChannel(channelName) {
    try {
        const createChannelCommand = `${absolutePathToTestNetwork}/network.sh createChannel -c ${channelName}`;
        console.log(`Creating channel ${channelName}...`);
        const createChannelOutput = await runCommand(createChannelCommand);
        console.log(createChannelOutput);
        console.log(`Channel ${channelName} created successfully.`);
    } catch (error) {
        console.error(`Failed to create channel: ${error}`);
    }
}

async function listParticipatingNodes(channelName) {
    try {
        process.chdir(absolutePathToTestNetwork);

        const envScriptPath = path.join(absolutePathToTestNetwork, 'env.sh');
        const envScriptContent = `
        #!/bin/bash
        export PATH=${pathToFabricBinaries}:$PATH
        export FABRIC_CFG_PATH=$PWD/../config/
        export CORE_PEER_TLS_ENABLED=true
        export CORE_PEER_LOCALMSPID=Org1MSP
        export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
        export CORE_PEER_MSPCONFIGPATH=$PWD/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
        export CORE_PEER_ADDRESS=localhost:7051
        peer channel fetch config config_block.pb -o localhost:7050 -c ${channelName} --tls --cafile $PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
        `;

        fs.writeFileSync(envScriptPath, envScriptContent);
        fs.chmodSync(envScriptPath, '755');

        const options = {
            env: {
                ...process.env,
                PATH: `${pathToFabricBinaries}:${process.env.PATH}`
            }
        };

        console.log(`Running temporary script to fetch configuration block for channel ${channelName}...`);
        await runCommand(`bash ${envScriptPath}`, options);
        console.log(`Fetched the latest configuration block for channel ${channelName}.`);

        console.log('Converting the configuration block to JSON...');
        await runCommand('configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json', options);
        console.log('Converted the configuration block to JSON.');

        console.log('Extracting the channel configuration...');
        await runCommand('jq .data.data[0].payload.data.config config_block.json > config.json', options);
        console.log('Extracted the channel configuration.');

        console.log('Listing the organizations in the channel configuration...');
        const output = await runCommand('jq -r \'.channel_group.groups.Application.groups\' config.json', options);
        console.log('Organizations in the channel:');
        console.log(output);

        fs.unlinkSync(envScriptPath);
    } catch (error) {
        console.error(`Failed to list participating nodes: ${error}`);
    }
}

rl.question('Enter the channel name: ', async (channelName) => {
    try {
        await createChannel(channelName);
        console.log("Participating nodes are:");
        await listParticipatingNodes(channelName);
    } catch (error) {
        console.error(`Error during processing: ${error}`);
    } finally {
        rl.close();
    }
});
