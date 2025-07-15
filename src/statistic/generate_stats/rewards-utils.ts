import { blockToTimestamp } from "./utils";

const initialBlock = 30152681;
const initialTimestamp = 1747094709;

export const compileRewards = async (rewardsDb: any[]) => {
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

    Object.keys(rewardsWithdraw).forEach((id: string) => {
        if (rewardsClaimRewards[id]) {
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
        }
    })

    return rewards;
}