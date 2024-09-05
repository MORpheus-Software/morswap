// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

library PoolAddress {
    bytes32 internal constant POOL_INIT_CODE_HASH = 0xe34f7558b256fc7968fd0b3c71b2b1b5ac176e2f7d27e69ebae96e891b164b57;

    struct PoolKey {
        address token0;
        address token1;
        uint24 fee;
    }

    // Hashes and returns the pool key
    function getPoolKey(
        address tokenA,
        address tokenB,
        uint24 fee
    ) internal pure returns (PoolKey memory) {
        if (tokenA > tokenB) (tokenA, tokenB) = (tokenB, tokenA);
        return PoolKey({token0: tokenA, token1: tokenB, fee: fee});
    }

    // Computes the address of the pool contract
    function computeAddress(address factory, PoolKey memory key) internal pure returns (address pool) {
        pool = address(
            uint160( // Step to convert to uint160
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex'ff',
                            factory,
                            keccak256(abi.encode(key.token0, key.token1, key.fee)),
                            POOL_INIT_CODE_HASH
                        )
                    )
                )
            )
        );
    }
}
