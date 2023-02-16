// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

error NOT_A_HOST();

contract EtheCall {

    struct Call {
        address Host;
        address[] Admitted;
        address[] Admins;
    }

    mapping (string => Call) calls;

    modifier onlyHost(string memory _id) {
        if (msg.sender != calls[_id].Host) {
            revert NOT_A_HOST();
        }
        _;
    }

    function newCall(string memory _id) public {
        Call memory _call;
        _call.Host = msg.sender;
        // _call.Admins.push(msg.sender);
        calls[_id] = _call;
    }

    function isAdmitted(string memory _id, address user) public view returns (bool) {
        for (uint i = 0; i < calls[_id].Admitted.length; i++) {
            if (user == calls[_id].Admitted[i]) {
                return true;
            }
        }
        return false;
    }

    function admitUser(string memory _id, address _new_callee) public onlyHost(_id) {
        if (!isAdmitted(_id, _new_callee)) {
            return;
        }
        calls[_id].Admitted.push(_new_callee);
    }
}
