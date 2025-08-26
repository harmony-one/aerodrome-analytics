export interface ITick {
    price0: string;
    price1: string;
    tickIdx: string;
}

export interface ITransaction {
    id: string;
    timestamp: string;
    blockNumber: number;
}

export interface IPosition {
    collectedFeesToken0: string;
    collectedFeesToken1: string;
    collectedToken0: string;
    collectedToken1: string;
    depositedToken0: string;
    depositedToken1: string;
    feeGrowthInside0LastX128: string;
    feeGrowthInside1LastX128: string;
    id: string;
    liquidity: string;
    owner: string;
    tickLower: ITick;
    tickUpper: ITick;
    transaction: ITransaction;
    withdrawnToken0: string;
    withdrawnToken1: string;
}

export interface IEvent {
    address: string;
    topics: string[];
    data: string;
    blockNumber: number;
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    logIndex: string;
    removed: boolean;
    name: string;
    returnValues: any;
    event: string;
}  

export interface ICompiledPosition extends IPosition {
    openPrice: string;
    closePrice: string;
    closeDate: number;
    depositedUSD: number;
    rewards: {
        AERO: number;
        USD: number;
        wallet: string;
    };
    wallet: string;
    totalUSD: string;
    totalCollected: string;
    tokenDiffUSD: string;
    apr_staking: string;
    apr_fee: string;
    apr_price: string;
    apr: string;
    price_mid: string;
    ticks: number;
    open_date: string;
    close_date: number;
    duration: number;
    in_range: number;
    hours_in_range: number;
    hours: number;
    swapsInInterval: number;
    swapsInRange: number;
    in_range_swaps: number;
    closed: boolean;
    impermanent_loss: string;
}

export interface IPoolHourDatas {
    close: string;
    feeGrowthGlobal0X128: string;
    feeGrowthGlobal1X128: string;
    feesUSD: string;
    high: string;
    id: string;
    liquidity: string;
    low: string;
    open: string;
    periodStartUnix: number;
    sqrtPrice: string;
    tick: string;
    token0Price: string;
    token1Price: string;
    tvlUSD: string;
    txCount: string;
    volumeToken0: string;
    volumeToken1: string;
  }
  
export interface IGetQueryParams {
    skip?: number;
    limit?: number;
    blockNumberFrom?: number;
    blockNumberTo?: number;
    timestampFrom?: string;
    timestampTo?: string;
    order?: 'ASC' | 'DESC';
    sortBy?: 'blockNumber' | 'timestamp';
    wallet?: string;
    positionId?: string;
    eventNames?: string[];
}

export interface IGetQueryPositionsParams extends IGetQueryParams {
    minDepositedUSD?: number;
    minApr?: number;
    maxApr?: number;
    minHours?: number;
    maxHours?: number;
}