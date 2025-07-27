// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import {FlappyRocketNFT} from "../src/FlappyRocketNFT.sol";

contract DeployFlappyRocketNFT is Script {
    function run() external {
        vm.startBroadcast();

        FlappyRocketNFT gameNFT = new FlappyRocketNFT();

        vm.stopBroadcast();

        console.log("FlappyRocketNFT deployed at:", address(gameNFT));
    }
}
