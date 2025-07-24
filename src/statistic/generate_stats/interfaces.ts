export interface IEvent {
    eventName: string;
    id: string;
    blockNumber: number;
    contractAddress: string;
}

export interface IDepositEvent extends IEvent {
    eventValues: {
        user: string;
        tokenId: string;
        liquidityToStake: string;
    }
}

export interface IWithdrawEvent extends IEvent {
    eventValues: {
        user: string;
        tokenId: string;
        liquidityToStake: string;
    }
}

export interface IClaimRewardsEvent extends IEvent {
    eventValues: {
        from: string;
        amount: string;
    }
}