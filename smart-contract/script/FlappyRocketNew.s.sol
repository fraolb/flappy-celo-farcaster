// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import {FlappyRocketGame} from "../src/FlappyRocketNew.sol";

contract DeployFlappyRocket is Script {
    function run() external {
        vm.startBroadcast();

        FlappyRocketGame game = new FlappyRocketGame();

        vm.stopBroadcast();

        console.log("FlappyRocketGame deployed at:", address(game));
        console.log("Owner:", game.owner());
    }
}
