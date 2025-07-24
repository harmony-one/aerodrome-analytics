import { blockToTimestamp } from "./utils";
import { IDepositEvent, IWithdrawEvent, IClaimRewardsEvent } from "./interfaces";
import { get } from 'lodash';

const initialBlock = 30152681;
const initialTimestamp = 1747094709;

const combineByParam = (arr: any[], param: string, condition: (item: any) => boolean) => {
    return arr.reduce((acc, curr) => {
        const id = get(curr, param);

        if (condition(curr)) {
            acc[id] = acc[id] || [];
            acc[id].push(curr);
        }

        return acc;
    }, {});
}

// const rewardsByGroups = (rewardsDb: any[]) => {
//     const rewardsWithdraws: Record<string, IWithdrawEvent[]> = {};
//     const rewardsDeposits: Record<string, IDepositEvent[]> = {};

//     rewardsDb.forEach((r: any) => {
//         if (r.eventName === 'Withdraw') {
//             if (!rewardsWithdraws[r.eventValues.user]) {
//                 rewardsWithdraws[r.eventValues.user] = [];
//             }

//             rewardsWithdraws[r.eventValues.user].push(r);
//         }

//         if (r.eventName === 'Deposit') {
//             if (!rewardsDeposits[r.eventValues.user]) {
//                 rewardsDeposits[r.eventValues.user] = [];
//             }

//             rewardsDeposits[r.eventValues.user].push(r);
//         }
//     })

//     return {
//         rewardsWithdraws,
//         rewardsDeposits,
//     }
// }

export const compileReward = (params: {
    claimReward: IClaimRewardsEvent,
    rewardsWithdraws: Record<string, IWithdrawEvent[]>,
    rewardsDeposits: Record<string, IDepositEvent[]>
}) => {
    const { claimReward, rewardsWithdraws, rewardsDeposits } = params;

    let withdraw: IWithdrawEvent | null = null;

    if (!rewardsWithdraws[claimReward.eventValues.from]) {
        // console.log('No withdraws for user', claimRewards.eventValues.from);
    } else {
        // console.log('Withdraws for user', claimRewards.eventValues.from, rewardsWithdraws[claimRewards.eventValues.from].length);

        withdraw = rewardsWithdraws[claimReward.eventValues.from].find(
            (w: IWithdrawEvent) =>
                claimReward.eventValues.from === w.eventValues.user &&
                claimReward.blockNumber <= w.blockNumber
        );
    }

    let deposit: IDepositEvent | null = null;

    if (!rewardsDeposits[claimReward.eventValues.from]) {
        // console.log('No deposits for user', claimRewards.eventValues.from);
    } else {
        // console.log('Deposits for user', claimRewards.eventValues.from, rewardsDeposits[claimRewards.eventValues.from].length);

        deposit = rewardsDeposits[claimReward.eventValues.from].find(
            (w: IDepositEvent) =>
                claimReward.eventValues.from === w.eventValues.user &&
                claimReward.blockNumber >= w.blockNumber
        );
    }

    const tokenId = withdraw?.eventValues.tokenId || deposit?.eventValues.tokenId;
    const user = claimReward.eventValues.from;
    const amount = Number(claimReward.eventValues.amount) / 1e18;
    const id = claimReward.id;

    if (!withdraw || !deposit) {
        return null;
    }

    return {
        timestamp: blockToTimestamp(claimReward.blockNumber, initialBlock, initialTimestamp),
        id: id,
        blockNumber: claimReward.blockNumber,
        tokenId: tokenId,
        "receiver": user,
        "rewardAmount": amount,
        wallet: user,
        "rewardToken": {
            "id": "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
            "symbol": "AERO"
        },
        "transaction": {
            id: id,
            blockNumber: claimReward.blockNumber,
            timestamp: blockToTimestamp(claimReward.blockNumber, initialBlock, initialTimestamp),
        },
        "gauge": {
            "id": "0xf8440c989c72751c3a36419e61b6f62dfeb7630e"
        }
    };
}

export const compileRewards = async (rewardsDb: any[]) => {
    const withdrawsByUser = combineByParam(rewardsDb, 'eventValues.user', (r: any) => r.eventName === 'Withdraw');
    const depositsByUser = combineByParam(rewardsDb, 'eventValues.user', (r: any) => r.eventName === 'Deposit');

    const withdrawsByTokenId = combineByParam(rewardsDb, 'eventValues.tokenId', (r: any) => r.eventName === 'Withdraw');

    const rewardsClaimRewards = {};
    const rewardsWithdraw = {};

    rewardsDb.forEach((r: any) => {
        const id = r.id.split('_')[1];

        if (r.eventName === 'Withdraw') {
            rewardsWithdraw[id] = r;
        }

        if (r.eventName === 'ClaimRewards') {
            rewardsClaimRewards[id] = r;
        }
    })

    // console.log('rewardsClaimRewards : ', Object.keys(rewardsClaimRewards).length);
    // console.log('rewardsWithdraw : ', Object.keys(rewardsWithdraw).length);
    // {"eventName":"Deposit","eventValues":{"user":"0x545e7f4813C9bd922eb5911BCadd48cF815e60fb","tokenId":"15180748","liquidityToStake":"5585706398954"},"id":"0x8333014a4e8c846306881a20e60bb18f5583ca0689969ee850e89a9525a305b2","blockNumber":30927050,"contractAddress":"0x6399ed6725cC163D019aA64FF55b22149D7179A8"}
    // {"eventName":"ClaimRewards","eventValues":{"from":"0xFFC8519CAd3a02DB4252DFcfC81F15A2BEFbb9E4","amount":"869931847690128130"},"id":"0xa2c97c0e100abdcf21c53747efc4e6e7992c174620677aac8b658d12586bfaf1","blockNumber":30927055,"contractAddress":"0x6399ed6725cC163D019aA64FF55b22149D7179A8"}
    // {"eventName":"Withdraw","eventValues":{"user":"0xFFC8519CAd3a02DB4252DFcfC81F15A2BEFbb9E4","tokenId":"15180746","liquidityToStake":"8937130244441"},"id":"0xa2c97c0e100abdcf21c53747efc4e6e7992c174620677aac8b658d12586bfaf1","blockNumber":30927055,"contractAddress":"0x6399ed6725cC163D019aA64FF55b22149D7179A8"}

    // {"timestamp":"1746519581","id":"0x31d2b27f2ebe3f817a5c5b39e20500018b3b34809cb277eb58cd64a3ebf0e2333773ca00","logIndex":"144","nfpPositionHash":"0xa189558be5844e8918302ed96c03310648a8282f8c3bc8784c795a9b82365b45","period":"2887","receiver":"0x7812d6b858ef1fdc6b9690b8095814b737cda24f","rewardAmount":"0.000138553277034383","rewardToken":{"id":"0x5050bc082ff4a74fb6b0b04385defddb114b2424","symbol":"xSHADOW"},"transaction":{"id":"0x31d2b27f2ebe3f817a5c5b39e20500018b3b34809cb277eb58cd64a3ebf0e233","blockNumber":"24711985","timestamp":"1746519581"},"gauge":{"id":"0xf8440c989c72751c3a36419e61b6f62dfeb7630e"}}

    const rewards = [];

    Object.keys(rewardsClaimRewards).forEach((id: string) => {
        if (rewardsWithdraw[id]) {
            const claimRewards = rewardsClaimRewards[id];
            const withdraw = rewardsWithdraw[id];

            rewards.push({
                timestamp: blockToTimestamp(claimRewards.blockNumber, initialBlock, initialTimestamp),
                id: id,
                blockNumber: claimRewards.blockNumber,
                tokenId: withdraw.eventValues.tokenId,
                "receiver": withdraw.eventValues.user,
                "rewardAmount": claimRewards.eventValues.amount / 1e18,
                wallet: claimRewards.eventValues.from,
                "rewardToken": {
                    "id": "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
                    "symbol": "AERO"
                },
                "transaction": {
                    id: id,
                    blockNumber: claimRewards.blockNumber,
                    timestamp: blockToTimestamp(claimRewards.blockNumber, initialBlock, initialTimestamp),
                },
                "gauge": {
                    "id": "0xf8440c989c72751c3a36419e61b6f62dfeb7630e"
                }
            });
        } else {
            // console.log('No withdraw for id', id);

            const claimReward = rewardsClaimRewards[id];

            const reward = compileReward({
                claimReward,
                rewardsWithdraws: withdrawsByUser,
                rewardsDeposits: depositsByUser
            });

            if (reward) {
                rewards.push(reward);
            } else {
                // console.log('No reward data for id', id);
            }
        }
    })

    console.log('RewardsClaimRewards', Object.keys(rewardsClaimRewards).length);
    console.log('RewardsWithdraw', Object.keys(rewardsWithdraw).length);
    console.log('Rewards', rewards.length);

    return { rewards, rewardsWithdraw: withdrawsByTokenId };
}