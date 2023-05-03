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

    mapping (string => Call) calls;
    mapping(string => UserInCall[]) InCallUsers;
    mapping (address => string) UserFingerprints;
    mapping (address => string) UserToNickname;
    mapping (string => address) NicknamesToUser;

    modifier onlyHost(string memory _id) {
        if (msg.sender != calls[_id].Host) {
            revert NOT_A_HOST();
        }
        _;
    }

    function getFingerprint(address user) public view returns (string memory) {
        return UserFingerprints[user];
    }

    function getNickname(address user) public view returns (string memory) {
        return UserToNickname[user];
    }

    function nicknameToAddress(string memory nickname) public view returns (address) {
        return NicknamesToUser[nickname];
    }

    function setNickname(string memory nickname) public {
        require(NicknamesToUser[nickname] == address(0), "Nickname already in use");
        NicknamesToUser[nickname] = msg.sender;
        UserToNickname[msg.sender] = nickname;
    }

    function setFingerprint(string memory fingerprint) public {
        UserFingerprints[msg.sender] = fingerprint;
    }

    function newCall(string memory call_id) public {
        require(calls[call_id].Host == address(0), "Call ID already used");
        Call memory _call;
        _call.Host = msg.sender;
        calls[call_id] = _call;
        InCallUsers[call_id].push(UserInCall(msg.sender, true));
    }

    function newCall(string memory call_id, address[] memory users, address[] memory admins) public {
        newCall(call_id);
        for (uint i = 0; i < users.length; i++) {
            InCallUsers[call_id].push(UserInCall(users[i], false));
        }
        for (uint i = 0; i < admins.length; i++) {
            InCallUsers[call_id].push(UserInCall(admins[i], true));
        }
    }

    function isAdmitted(string memory call_id, address user) public view returns (bool) {
        if (user == calls[call_id].Host) {
            return true;
        }
        for (uint i = 0; i < InCallUsers[call_id].length; i++) {
            if (user == InCallUsers[call_id][i].addr) {
                return true;
            }
        }
        return false;
    }

    function admitUser(string memory call_id, address new_callee) public onlyHost(call_id) {
        require(isAdmitted(call_id, new_callee), "User already admitted");
        InCallUsers[call_id].push(UserInCall(new_callee, false));
    }

    function isAdmin(string memory call_id, address user) public view returns (bool) {
        if (user == calls[call_id].Host) {
            return true;
        }
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
        InCallUsers[call_id].push(UserInCall(user, true));
    }

    function changeHost(string memory call_id, address new_host) public onlyHost(call_id) {
        calls[call_id].Host = new_host;
    }

    function getHost(string memory call_id) public view returns (address) {
        return calls[call_id].Host;
    }
}
