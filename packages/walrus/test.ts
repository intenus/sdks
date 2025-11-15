import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction, TransactionResult } from "@mysten/sui/transactions";

const tx = new Transaction();

// ----------------------------------------------------
// Fake addresses (đã sửa: hợp lệ 32-byte hex)
// ----------------------------------------------------
const POOL = "0x1111111111111111111111111111111111111111111111111111111111111111";
const STAKING_VAULT = "0x2222222222222222222222222222222222222222222222222222222222222222";
const LOG_STORE = "0x3333333333333333333333333333333333333333333333333333333333333333";

const DEX_PKG = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const STAKE_PKG = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const LOG_PKG = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

// ----------------------------------------------------
// 1) Split gas thành 3 phần
// ----------------------------------------------------
const amountA = tx.splitCoins(tx.gas, [tx.pure.u64(5_000_000)]);
const amountB = tx.splitCoins(tx.gas, [tx.pure.u64(10_000_000)]);
const amountC = tx.splitCoins(tx.gas, [tx.pure.u64(20_000_000)]);

// ----------------------------------------------------
// 2) Swap trên DEX
// ----------------------------------------------------
const swapOutput = tx.moveCall({
    target: `${DEX_PKG}::swap::swap_exact_in`,
    arguments: [
        amountA,
        tx.pure.u64(1000),
        tx.object(POOL),
    ],
});

// ----------------------------------------------------
// 3) Merge swap output vào amountB
// ----------------------------------------------------
const merged = tx.mergeCoins(amountB, [swapOutput]);

// ----------------------------------------------------
// 4) Staking bằng coin merged
// ----------------------------------------------------
const stakedReceipt = tx.moveCall({
    target: `${STAKE_PKG}::staking::deposit`,
    arguments: [
        merged,
        tx.object(STAKING_VAULT),
    ],
});

// ----------------------------------------------------
// 5) Transfer amountC
// ----------------------------------------------------
tx.transferObjects([amountC], "0x9999999999999999999999999999999999999999999999999999999999999999");

// ----------------------------------------------------
// 6) Ghi log
// ----------------------------------------------------
tx.moveCall({
    target: `${LOG_PKG}::logger::write`,
    arguments: [
        tx.object(LOG_STORE),
        stakedReceipt,
        tx.pure.string("Completed multi-command operation"),
    ],
});

tx.setSender('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

// ----------------------------------------------------
// Xuất TransactionKind thuần
// ----------------------------------------------------
console.log(
    await tx.build({
        client: new SuiClient({
            url: getFullnodeUrl('testnet')
        })
    })
);
