import { blockToTimestamp, calculateImpermanentLoss, rewardTokens, timestampToStartOfHour } from "./utils";
import { IEvent } from "../../interfaces";

export const calculateStats = async (
    positionsDb: any[],
    rewardsDb: any[],
    rewardsWithdraw: Record<string, IEvent[]>,
    poolHoursDatasDb: any[]
) => {
    let positions: any = positionsDb;
    const poolHoursData: any = poolHoursDatasDb;
    const rewards: any = rewardsDb;

    const poolHoursDataByHour = poolHoursData.reduce((acc: any, curr: any, idx: number) => {
        acc[curr.periodStartUnix] = { 
            token0Price: curr.token0Price,
            token1Price: curr.token1Price,
            index: idx,
        };

        return acc;
    }, {});

    const rewardsByPosition = rewards.reduce((acc: any, curr: any) => {
        acc[curr.tokenId] = [].concat(acc[curr.tokenId] || [], curr);
        return acc;
    }, {});

    const rewardsByWallet = rewards.reduce((acc: any, curr: any) => {
        acc[curr.tokenId] = [].concat(acc[curr.tokenId] || [], curr);
        return acc;
    }, {});

    positions = positions.map((p: any, idx: number) => {
        if (idx % 1000 === 0) {
            // console.log('positionsFinal: ', idx / positions.length * 100, '%');
        }

        let poolHoursDataStartIndex = poolHoursDataByHour[timestampToStartOfHour(p.transaction.timestamp)]?.index || -1;

        if (poolHoursDataStartIndex === -1) {
            poolHoursDataStartIndex = poolHoursData.length - 1;
        }

        let closePrice = poolHoursData[poolHoursDataStartIndex].token0Price;
        let closeDate = p.transaction.timestamp;

        let withdrawDate = rewardsWithdraw[p.id]?.[0]?.blockNumber ? 
            blockToTimestamp(rewardsWithdraw[p.id]?.[0]?.blockNumber) : 
            null;

        if (withdrawDate) {
            const data = poolHoursDataByHour[timestampToStartOfHour(withdrawDate)];
            closePrice = data.token0Price;
            closeDate = withdrawDate;
        } else {
            for (let i = poolHoursDataStartIndex; i < poolHoursData.length; i++) {
                if (Number(poolHoursData[i].tick) >= Number(p.tickLower.tickIdx) && Number(poolHoursData[i].tick) <= Number(p.tickUpper.tickIdx)) {
                } else {
                    closePrice = poolHoursData[i].token0Price;
                    closeDate = poolHoursData[i].periodStartUnix;
                    break;
                }
            }
        }

        return {
            ...p,
            openPrice: poolHoursDataByHour[timestampToStartOfHour(p.transaction.timestamp)]?.token0Price,
            closePrice,
            closeDate,
        }
    });

    const positionsWithRewards = positions.map((pos: any) => {
        return {
            ...pos,
            rewards: rewardsByPosition[
                pos.id
            ]?.reduce((acc: any, curr: any) => {
                acc[curr.rewardToken.symbol] = (acc[curr.rewardToken.symbol] || 0) + Number(curr.rewardAmount);


                const rewardToken = rewardTokens[curr.rewardToken.id];

                if (!rewardToken) {
                    console.log('no price for', curr.rewardToken.symbol, curr.rewardToken.id)
                    console.log('no price for', curr.rewardToken.symbol)
                }

                // acc['USD'] = (acc['USD'] || 0) + Number(curr.rewardAmount) * rewardToken?.price;
                acc['USD'] = (acc['USD'] || 0) + Number(curr.rewardAmount) * rewardToken?.price;

                acc['wallet'] = curr.wallet;

                return acc;
            }, {})
        }
    }).map((p: any) => {
        const token0DiffUSD = Number(p.collectedToken0) - Number(p.depositedToken0);
        const token1DiffUSD = Number(p.collectedToken1) * Number(p.closePrice) - Number(p.depositedToken1) * Number(p.openPrice);

        const tokenDiffUSD = token0DiffUSD + token1DiffUSD;

        return {
            ...p,
            wallet: p.rewards?.['wallet'] || p.wallet,
            totalUSD: p.rewards?.['USD'] || 0, // + Number(p.collectedFeesToken0) + Number(p.collectedFeesToken1) * Number(p.closePrice) + tokenDiffUSD
            totalCollected: Number(p.collectedFeesToken0) + Number(p.collectedFeesToken1) * Number(p.closePrice),
            tokenDiffUSD
        }
    })

    const positionsFinal = positionsWithRewards.map((p: any, idx: number) => {
        if (idx % 1000 === 0) {
            // console.log('positionsFinal 2: ', idx / positionsWithRewards.length * 100, '%');
        }

        const closeDate = p.closeDate;
        const endDate = closeDate * 1000 || Date.now();

        const daysElapsed = Math.ceil((endDate - p.transaction.timestamp * 1000) / (1000 * 60 * 60 * 24));

        const openDateTime = p.transaction.timestamp;
        const closeDateTime = closeDate?.timestamp || Date.now() / 1000;

        let hoursInRange = (closeDateTime - openDateTime) / 3600;

        const duration = closeDateTime - openDateTime;

        hoursInRange = Math.min(hoursInRange, duration / 3600);

        const inRange = Math.round((hoursInRange / (duration / 3600)) * 100);

        const depositedUSD = (Number(p.depositedToken0) * 1 + Number(p.depositedToken1) * p.openPrice);
        
        return {
            ...p,
            apr_staking: (((p.totalUSD / depositedUSD) * (365 / daysElapsed)) * 100).toFixed(2),
            apr_fee: (((p.totalCollected / depositedUSD) * (365 / daysElapsed)) * 100).toFixed(2),
            apr_price: (((p.tokenDiffUSD / depositedUSD) * (365 / daysElapsed)) * 100).toFixed(2),
            apr: ((((p.totalUSD + p.totalCollected) / depositedUSD) * (365 / daysElapsed)) * 100).toFixed(2),
            // apr_30d: (((p.totalUSD / (Number(p.depositedToken0) * 1 + Number(p.depositedToken1) * p.openPrice)) * (30 / daysElapsed)) * 100).toFixed(2),
            price_mid: ((Number(p.tickLower.price0) + Number(p.tickUpper.price0)) / 2).toFixed(4),
            ticks: Math.abs(p.tickUpper.tickIdx - p.tickLower.tickIdx),
            open_date: openDateTime,
            close_date: closeDateTime,
            duration,
            in_range: inRange,
            hours_in_range: hoursInRange,
            hours: hoursInRange,
            closed: closeDate ? true : false,
            impermanent_loss: calculateImpermanentLoss({
                depositedToken0: Number(p.depositedToken0),
                depositedToken1: Number(p.depositedToken1),
                withdrawnToken0: Number(p.withdrawnToken0),
                withdrawnToken1: Number(p.withdrawnToken1),
                currentPrice: Number(p.closePrice),
                tickLowerPrice: Number(p.tickLower.price1) * 100,
                tickUpperPrice: Number(p.tickUpper.price1) * 100,
            }).relativeIL,
        }
    })

    return positionsFinal;
};