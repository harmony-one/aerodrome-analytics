import axios from "axios";
import {getBurnsQuery, getMintsQuery, getPoolHourDatasQuery, getPositionsBurnsQuery, getPositionsQuery, getRewardsQuery, getSwapsQuery} from "./query";
// import {ClBurn, ClMint, clPoolHourDatas, ClPosition, clPositionBurns, ClSwap} from "./types";
import config from "../configs/config";

// const client = axios.create({
//   baseURL: appConfig.shadowSubgraphUrl,
//   headers: {
//     'Authorization': `Bearer ${token}`,
//     'Content-Type': 'application/json'
//   }
// })

export interface GetEventsFilter {
  poolSymbol?: string
  poolAddress?: string
  blockNumber_gt?: number
  startOfHour_gt?: number
  periodStartUnix_gt?: number
  blockNumber_lte?: number
  timestamp_gt?: number
  owner?: string
  liquidity_gt?: number
  gauge?: string
  id?: string
}

export interface GetEventsSort {
  orderDirection?: 'asc' | 'desc'
  orderBy?: 'transaction__blockNumber'
}

export interface GetEventsParams {
  skip?: number
  first?: number
  filter?: GetEventsFilter
  sort?: GetEventsSort
}

export interface TheGraphConfig {
  url: string;
  token: string;
}

export const getMintEvents = async (params: GetEventsParams, config: TheGraphConfig) => {
  const { data } = await axios.post(config.url, {
    query: getMintsQuery(params)
  }, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json' // Устанавливаем тип контента
    }
  })
  return data.data.clMints
}

export const getBurnEvents = async (params: GetEventsParams, config: TheGraphConfig) => {
  const { data } = await axios.post(config.url, {
    query: getBurnsQuery(params)
  }, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json' // Устанавливаем тип контента
    }
  })
  return data.data.clBurns
}

export const getSwapEvents = async (params: GetEventsParams, config: TheGraphConfig) => {
  // console.log(getSwapsQuery(params));

  const { data } = await axios.post(config.url, {
    query: getSwapsQuery(params)
  }, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json' // Устанавливаем тип контента
    }
  })

  // console.log(data);

  return data.data.clSwaps
}

export const getPoolHourDatas = async (params: GetEventsParams, config: TheGraphConfig) => {
  //console.log(getPoolHourDatasQuery(params));

  //const url = "https://gateway.thegraph.com/api/subgraphs/id/AfEueFh2MkpEp394Bo6EApfESwv97Zzg6jA48ugzXrwG";
  const { data } = await axios.post(config.url, {
    query: getPoolHourDatasQuery(params)
  }, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json' // Устанавливаем тип контента
    }
  })
  
  return data.data.poolHourDatas
}

export const getPositionsBurns = async (params: GetEventsParams, config: TheGraphConfig) => {

  // console.log(getPositionsBurnsQuery(params));
  const { data } = await axios.post(config.url, {
    query: getPositionsBurnsQuery(params)
  }, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json' // Устанавливаем тип контента
    }
  })
  return data.data.clPositionBurns
}

export const getPositions = async (params: GetEventsParams, config: TheGraphConfig) => {
  // console.log(getPositionsQuery(params));
  
  const { data } = await axios.post(config.url, {
    query: getPositionsQuery(params)
  }, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json' // Устанавливаем тип контента
    }
  })

  if(!data?.data?.positions) {
    console.log(getPositionsQuery(params)); 
    
    throw new Error(data?.message || data);
  }

  return data.data.positions
}

export const getRewards = async (params: GetEventsParams, config: TheGraphConfig) => {
  //console.log(getRewardsQuery(params));

  // const { data } = await client.post<{
  //   data: {
  //     gaugeRewardClaims: any[]
  //   }
  // }>('/', {
  //   query: getRewardsQuery(params)
  // })

  const { data } = await axios.post(config.url, {
    query: getRewardsQuery(params)
  }, {
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    }
  })

  return data.data.gaugeRewardClaims
}
