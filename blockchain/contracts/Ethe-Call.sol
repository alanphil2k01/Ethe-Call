// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

error NOT_A_HOST();

contract EtheCall {

    struct UserInCall {
        address addr;
        bool admin;
    }

    struct Call {
        address Host;
        uint32 UserCount;
    }

    struct UserData {
        string nickname;
        string fingerprint;
    }

    mapping (string => Call) calls;
    mapping(string => UserInCall[]) InCallUsers;
    mapping (address => UserData) Users;
    mapping (string => address) NicknamesToUser;

    modifier onlyHost(string memory _id) {
        if (msg.sender != calls[_id].Host) {
            revert NOT_A_HOST();
        }
        _;
    }

    function setNickname(string memory nickname) public {
        require(NicknamesToUser[nickname] != address(0), "Nickname already in use");
        NicknamesToUser[nickname] = msg.sender;
        Users[msg.sender].nickname = nickname;
    }

    function setFingerprint(string memory fingerprint) public {
        Users[msg.sender].fingerprint = fingerprint;
    }

    function newCall(string memory call_id) public {
        require(calls[call_id].Host == address(0), "Call ID already used");
        Call memory _call;
        _call.Host = msg.sender;
        calls[call_id] = _call;
    }

    function isAdmitted(string memory call_id, address user) public view returns (bool) {
        for (uint i = 0; i < InCallUsers[call_id].length; i++) {
            if (user == InCallUsers[call_id][i].addr) {
                return true;
            }
        }
        return false;
    }

    function admitUser(string memory call_id, address new_callee) public onlyHost(call_id) {
        require(isAdmitted(call_id, new_callee), "User already admitted");
        UserInCall memory user;
        user.addr = new_callee;
        user.admin = false;
        InCallUsers[call_id].push(user);
    }

    function isAdmin(string memory call_id, address user) public view returns (bool) {
        for (uint i = 0; i < InCallUsers[call_id].length; i++) {
            if (user == InCallUsers[call_id][i].addr && InCallUsers[call_id][i].admin) {
                return true;
            }
        }
        return false;
    }

    function addAdmin(string memory call_id, address user) public onlyHost(call_id) {
        for (uint i = 0; i < InCallUsers[call_id].length; i++) {
            if (user == InCallUsers[call_id][i].addr) {
                InCallUsers[call_id][i].admin = true;
                return;
            }
        }

        UserInCall memory new_admin;
        new_admin.addr = user;
        new_admin.admin = true;
        InCallUsers[call_id].push(new_admin);
    }

    function changeHost(string memory call_id, address new_host) public onlyHost(call_id) {
        calls[call_id].Host = new_host;
    }
}
