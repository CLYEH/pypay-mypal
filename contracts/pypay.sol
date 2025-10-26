// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IOFTLikeSender {
    struct SendParam {
        uint32  dstEid;        // 目標鏈的 Endpoint ID
        bytes32 to;            // 目標鏈接收者（bytes32 格式的地址/識別）
        uint256 amountLD;      // 傳送的 token 數量（local decimals）
        uint256 minAmountLD;   // 目的鏈最少可接受數量（滑點保護）
        bytes   extraOptions;  // 傳輸額外選項（如執行 gas/執行模式）
        bytes   composeMsg;    // 可選的複合訊息
        bytes   oftCmd;        // 可選的 OFT 指令
    }

    struct MessagingFee {
        uint256 nativeFee;     // 需要隨交易附帶的原生幣手續費（如 ETH）
        uint256 lzTokenFee;    // 若使用 LZ token 支付費用（通常為 0）
    }

    struct MessagingReceipt {
        bytes32 guid;
        uint64  nonce;
        uint32  dstEid;
    }

    struct OFTReceipt {
        uint256 amountSentLD;  // 實際扣除的數量
        uint256 amountReceivedLD; // 目的鏈可得數量
    }

    // 常見的 OFT v2 介面：payable，並回傳兩個 receipt
    function send(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    )
        external
        payable
        returns (MessagingReceipt memory msgReceipt, OFTReceipt memory oftReceipt);
}

contract PyPay {
    address public signer;
    address public operator;

    // usedNonces[nonce] => bool
    mapping(uint256 => bool) public usedNonces;
    // endpointID[chainId] => endpointID
    // ethereum 30101; arb 30110
    mapping(uint256 => uint32) endpointID;
    
    mapping(uint256 => address) public OFTcontract;
    mapping(uint256 => address) private PYUSDcontract;

    modifier onlySigner() {
        require(msg.sender == signer, "Only signer can call this function");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator, "Only operator can call this function");
        _;
    }

    event usedNoncesEvent(uint32 indexed chainId, uint256 indexed nonceUsed);
    event CrossChainTransferEvent(
        uint256 indexed sourceChainId,
        uint256 indexed amount,
        uint256 indexed nonce,
        uint256 destinationChainId,
        address targetAddress
    );
    event TransferEvent(
        uint256 indexed sourceChainId,
        uint256 indexed amount,
        uint256 indexed nonce,
        uint256 destinationChainId,
        address targetAddress
    );
    
    struct localSignature{
        uint256 sourceChainId;
        uint256 amount;
        uint256 nonce;
        uint256 destinationChainId;
        address targetAddress;
    }

    constructor(address _signer, address _operator) {
        signer = _signer;
        operator = _operator;

        endpointID[1] = 30101; // ethereum
        endpointID[42161] = 30110; // arbitrum

        OFTcontract[1] = 0xa2C323fE5A74aDffAd2bf3E007E36bb029606444;
        OFTcontract[42161] = 0xFaB5891ED867a1195303251912013b92c4fc3a1D;

        PYUSDcontract[1] = 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8;
        PYUSDcontract[42161] = 0x46850aD61C2B7d64d08c9C754F45254596696984;
    }

    function arraySum(uint256[] memory numbers) internal pure returns (uint256) {
        uint256 total = 0;
        uint256 len = numbers.length;
        for(uint256 i = 0; i < len; i++) {
            total += numbers[i];
        }
        return total;
    }

    function signatureVerifier(
        uint256[] memory sourceChainIds, 
        uint256[] memory amountEach,
        uint256[] memory nonces, 
        uint256 expiry,
        uint256 destinationChainId,
        address targetAddress,
        bytes memory signature
        ) public 
        returns(localSignature memory){
            require(block.timestamp < expiry, "signature is expired");
            uint256 localIndex;
            bool matched = false;
            for(uint256 i = 0; i < sourceChainIds.length; i += 1){
                if(sourceChainIds[i] == block.chainid){
                    localIndex = i;
                    matched = true;
                    break;
                }
            }
            require(matched, "not authorized source chain");
            require(!usedNonces[nonces[localIndex]], "nonce used!");
            usedNonces[nonces[localIndex]] = true;
            emit usedNoncesEvent(uint32(block.chainid), nonces[localIndex]);

            // 將訊息 hash 化
            bytes32 messageHash = keccak256(abi.encode(sourceChainIds, amountEach, nonces, expiry, destinationChainId, targetAddress));
            // 轉成 eth_signed message hash（自動加上前綴）
            bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
            // 使用 ECDSA 恢復簽名者
            (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
            address recovered = ecrecover(ethSignedMessageHash, v, r, s);
            //address recovered = ethSignedMessageHash.recover(signature);
            require(recovered == signer, "Invalid signature");

            localSignature memory sigContext = localSignature({
                sourceChainId: sourceChainIds[localIndex],
                amount: amountEach[localIndex],
                nonce: nonces[localIndex],
                destinationChainId: destinationChainId,
                targetAddress: targetAddress
            });

            return sigContext;
        }

    function splitSignature(bytes memory sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function CrossChainTransfer(
        uint256[] memory sourceChainIds, 
        uint256[] memory amountEach,
        uint256[] memory nonces,
        uint256 expirey,
        uint256 destinationChainId,
        address targetAddress,
        bytes memory signature,
        uint256 nativeFee
    ) external onlyOperator{
        localSignature memory sigContent = signatureVerifier(sourceChainIds, amountEach, nonces, expirey, destinationChainId, targetAddress, signature);

        IOFTLikeSender.SendParam memory sendParam = IOFTLikeSender.SendParam({
            dstEid: endpointID[destinationChainId],
            to: bytes32(bytes20(targetAddress)),
            amountLD: sigContent.amount,
            minAmountLD: sigContent.amount * 99 / 100,
            extraOptions: "",
            composeMsg: "",
            oftCmd: ""
        });

        IOFTLikeSender.MessagingFee memory fee = IOFTLikeSender.MessagingFee({
            nativeFee: nativeFee,
            lzTokenFee: 0
        });

        IOFTLikeSender(OFTcontract[destinationChainId]).send(sendParam, fee, signer);

        emit CrossChainTransferEvent(sigContent.sourceChainId, sigContent.amount, sigContent.nonce, destinationChainId, targetAddress);
    }

    function transfer(
        uint256[] memory sourceChainIds, 
        uint256[] memory amountEach,
        uint256[] memory nonces,
        uint256 expiry,
        uint256 destinationChainId,
        address targetAddress,
        bytes memory signature
    )external onlyOperator returns (bool){
        localSignature memory sigContent = signatureVerifier(sourceChainIds, amountEach, nonces, expiry, destinationChainId, targetAddress, signature);

        uint256 totalAmount = arraySum(amountEach);
        IERC20(PYUSDcontract[sigContent.sourceChainId]).transferFrom(signer, targetAddress, totalAmount);
        emit TransferEvent(sigContent.sourceChainId, totalAmount, sigContent.nonce, destinationChainId, targetAddress);
        return true;
    }

}

contract Factory {
    event ContractDeployed(address indexed deployedAddress);

    function computeAddress(uint256 _salt_int, address signer, address operator) external view returns (address) {
        bytes32 _salt = bytes32(_salt_int);
        bytes memory bytecode = abi.encodePacked(
            type(PyPay).creationCode,
            abi.encode(signer, operator)
        );
        return Create2.computeAddress(_salt, keccak256(bytecode), address(this));
    }

    function deploy(uint256 _salt_int, address signer, address operator) external returns (address) {
        bytes32 _salt = bytes32(_salt_int);
        bytes memory bytecode = abi.encodePacked(
            type(PyPay).creationCode,
            abi.encode(signer, operator)
        );
        address deployedAddr = Create2.deploy(0, _salt, bytecode);
        emit ContractDeployed(deployedAddr);
        return deployedAddr;
    }
}