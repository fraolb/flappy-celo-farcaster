// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import {FlappyRocketGame} from "../src/FlappyRocket.sol";

contract DeployFlappyRocketWithArgs is Script {
    function run(uint256 minDeposit) external {
        require(minDeposit > 0, "Minimum deposit must be > 0");

        vm.startBroadcast();

        FlappyRocketGame game = new FlappyRocketGame(minDeposit);

        vm.stopBroadcast();

        console.log("FlappyRocketGame deployed at:", address(game));
        console.log("Minimum deposit set to:", minDeposit, "wei");
        console.log("Owner:", game.owner());
    }
}
