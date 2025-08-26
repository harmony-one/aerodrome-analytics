import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { EventA, Position, PoolHourData } from 'src/entities';
import { IEvent, IPosition, ICompiledPosition, IPoolHourDatas } from 'src/interfaces';
import { calculateStats } from './generate_stats/index';
import { compileRewards } from './generate_stats/rewards-utils';
import { IGetQueryParams, IGetQueryPositionsParams } from 'src/interfaces';

@Injectable()
export class StatisticService {
    private readonly logger = new Logger(StatisticService.name);

    // positions: IPosition[] = [];
    // events: IEvent[] = [];
    // poolHoursDatas: IPoolHourDatas[] = [];

    compiledPositions: ICompiledPosition[] = [];
    rewards: any[] = [];

    constructor(
        @InjectRepository(Position)
        private positionsRepository: Repository<Position>,
        @InjectRepository(EventA)
        private eventsRepository: Repository<EventA>,
        @InjectRepository(PoolHourData)
        private poolHourDatasRepository: Repository<PoolHourData>,
    ) {
    }

    relaodData = async () => {
        setTimeout(
            () => this.startFn(
                () => this.loadData(),
                'Load full data'
            ),
            100
        );
    }

    async loadData() {
        let eventsFromDb = await this.startFn(
            () => this.eventsRepository.find({
                order: {
                    blockNumber: 'ASC'
                },
                where: {
                    //blockNumber: MoreThanOrEqual(29990000)
                    blockNumber: MoreThanOrEqual(31990000)

                }
            }),
            'Loading events from db'
        );

        this.logger.log(`Events from db loaded: ${eventsFromDb.length}`);

        const { rewards, rewardsWithdraw } = await this.startFn(
            () => compileRewards(eventsFromDb),
            'Compiling rewards'
        );

        this.rewards = rewards;

        eventsFromDb = null;

        let poolHoursDatasFromDb = await this.startFn(
            () => this.poolHourDatasRepository.find(),
            'Loading pool hours datas from db'
        );

        const limit = 200000;

        let positionsFromDb;
        let skip = 0;
        let compiledPositions = [];

        while ((!positionsFromDb || positionsFromDb.length === limit) && skip < 1000000) {
            positionsFromDb = await this.startFn(
                () => this.positionsRepository.find({
                    skip,
                    take: limit,
                    order: {
                        blockNumber: 'DESC'
                    },
                    where: {
                        blockNumber: MoreThanOrEqual(31990000)
                    }
                }),
                'Loading positions from db'
            );

            const res = await this.startFn(
                () => calculateStats(
                    positionsFromDb.map(p => ({ ...p.metadata })),
                    this.rewards,
                    rewardsWithdraw,
                    poolHoursDatasFromDb
                ),
                `Calculating stats ${skip} - ${skip + limit}`
            );

            compiledPositions = compiledPositions.concat(res);

            skip += limit;
        }

        this.compiledPositions = compiledPositions;

        // clear all data
        eventsFromDb = null;
        // rewardsFromDb = null;
        poolHoursDatasFromDb = null;
        positionsFromDb = null;
    }

    async startFn(fn: () => Promise<any>, name: string) {
        const start = Date.now();
        this.logger.log(`${name} started`);
        const res = await fn();
        const end = Date.now();
        this.logger.log(`${name} taken: ${((end - start) / 1000).toFixed(2)}sec`);
        return res;
    }

    //////////

    getPositionByWallet(walletId: string) {
        return this.compiledPositions.filter(p => p.wallet === walletId);
    }

    generateStatisticByPositions = (positions: ICompiledPosition[]) => {
        const res = {
            ticks: positions[0].ticks,
            positionsNumber: positions.length,
            totalUSD: positions.reduce((acc, p) => acc + Number(p.totalUSD), 0),
            totalCollected: positions.reduce((acc, p) => acc + Number(p.totalCollected), 0),
            totalFees: positions.reduce((acc, p) => acc + Number(p.collectedFeesToken0) + Number(p.collectedFeesToken1), 0),
            avgApr: positions.reduce((acc, p) => acc + Number(p.apr), 0) / positions.length,
            avgAprStaking: positions.reduce((acc, p) => acc + Number(p.apr_staking), 0) / positions.length,
            avgAprFee: positions.reduce((acc, p) => acc + Number(p.apr_fee), 0) / positions.length,
            avgImpermanentLoss: positions.reduce((acc, p) => acc + Number(p.impermanent_loss), 0) / positions.length,
        }

        // Object.keys(res).forEach(key => {
        //     res[key] = Number(res[key]).toFixed(2);
        // });

        return res;
    }

    getStatisticByTicks(ticks: number = 200) {
        const positions = this.compiledPositions.filter(p => p.ticks === ticks && Number(p.apr) > 1 && Number(p.depositedToken0) > 100);

        return this.generateStatisticByPositions(positions);
    }

    getExtendedStatisticByTicks(ticks: number = 200) {
        const positions = this.compiledPositions.filter(p => p.ticks === ticks && Number(p.apr) > 1);

        const groupedByTicks = positions.reduce((acc, p) => {
            const ticksGroup = `${p.tickLower.tickIdx}_${p.tickUpper.tickIdx}`;

            acc[ticksGroup] = acc[ticksGroup] || [];
            acc[ticksGroup].push(p);
            return acc;
        }, {});

        Object.keys(groupedByTicks).forEach(key => {
            groupedByTicks[key] = this.generateStatisticByPositions(groupedByTicks[key]);
        });

        return groupedByTicks;
    }

    async getInfoByPosition(positionId: string) {
        const compiledPositions = this.compiledPositions.filter(p => String(p.id) === String(positionId));

        const eventsFromDb = await this.eventsRepository.find({
            where: {
                tokenId: positionId,
            },
        });

        const positionsDb = await this.positionsRepository.find({
            where: {
                id: positionId,
            },
        });

        const compiledRewards = this.rewards.filter(r => String(r.tokenId) === String(positionId));

        return {
            compiledPositions,
            eventDb: eventsFromDb,
            positionsDb,
            compiledRewards
        }
    }

    async getStatisticByWallet(walletId: string) {
        const compiledPositions = this.compiledPositions.filter(p => p.wallet === walletId);

        const eventsFromDb = await this.eventsRepository.find({
            where: {
                user: walletId,
            },
        });

        const compiledRewards = this.rewards.filter(r => String(r.wallet).toLowerCase() === String(walletId).toLowerCase());

        return {
            compiledPositions,
            events: eventsFromDb,
            compiledRewards
        }
    }

    generateFindParams(params: IGetQueryParams) {
        const { 
            limit = 100, 
            skip = 0, 
            order = 'DESC', 
            sortBy = 'blockNumber',
            blockNumberFrom, 
            blockNumberTo, 
            timestampFrom, 
            timestampTo, 
            wallet, 
            positionId,
            eventNames,
        } = params;

        const res = {
            skip,
            take: limit,
            order: {
                [sortBy]: order,
            },
            where: {} as any,
        }

        if(blockNumberFrom && blockNumberTo) {
            res.where.blockNumber = Between(Number(blockNumberFrom), Number(blockNumberTo));
        } else if (blockNumberFrom) {
            res.where.blockNumber = MoreThanOrEqual(Number(blockNumberFrom));
        } else if (blockNumberTo) {
            res.where.blockNumber = LessThanOrEqual(Number(blockNumberTo));
        }

        if (timestampFrom && timestampTo) {
            res.where.timestamp = Between(timestampFrom, timestampTo);
        } else if (timestampFrom) {
            res.where.timestamp = MoreThanOrEqual(timestampFrom);
        } else if (timestampTo) {
            res.where.timestamp = LessThanOrEqual(timestampTo);
        }

        if (wallet) {
            res.where.user = wallet;
        }   

        if (positionId) {
            res.where.id = positionId;
        }

        if (eventNames) {
            res.where.eventName = In(eventNames);
        }
        
        return res;
    }

    getPositions(params: IGetQueryParams) {
        return this.positionsRepository.find(this.generateFindParams(params));
    }

    getEvents(params: IGetQueryParams) {
        return this.eventsRepository.find(this.generateFindParams(params));
    }

    getCompiledPositions(params: IGetQueryPositionsParams) {
        const { 
            limit = 100, 
            skip = 0, 
            order = 'DESC', 
            sortBy = 'blockNumber',
        } = params;

        return this.compiledPositions
            .filter(p => {
                let isMatch = true;

                if(params.minDepositedUSD) {
                    isMatch = isMatch && Number(p.depositedUSD) >= Number(params.minDepositedUSD);
                }

                if(params.minApr) {
                    isMatch = isMatch && Number(p.apr) >= Number(params.minApr);
                }

                if(params.maxApr) {
                    isMatch = isMatch && Number(p.apr) <= Number(params.maxApr);
                }

                if(params.minHours) {
                    isMatch = isMatch && Number(p.hours) >= Number(params.minHours);
                }

                if(params.maxHours) {
                    isMatch = isMatch && Number(p.hours) <= Number(params.maxHours);
                }

                if(params.wallet) {
                    isMatch = isMatch && p.wallet === params.wallet;
                }

                if(params.positionId) {
                    isMatch = isMatch && p.id === params.positionId;
                }

                if(params.blockNumberFrom) {
                    isMatch = isMatch && Number(p.transaction.blockNumber) >= Number(params.blockNumberFrom);
                }

                if(params.blockNumberTo) {
                    isMatch = isMatch && Number(p.transaction.blockNumber) <= Number(params.blockNumberTo);
                }

                if(params.timestampFrom) {
                    isMatch = isMatch && Number(p.transaction.timestamp) >= Number(params.timestampFrom);
                }

                if(params.timestampTo) {
                    isMatch = isMatch && Number(p.transaction.timestamp) <= Number(params.timestampTo);
                }

                return isMatch;
            })
            .sort((a, b) => {
                const order = params.order === 'ASC' ? 1 : -1;

                if(sortBy === 'blockNumber') {
                    return Number(a.transaction.blockNumber) > Number(b.transaction.blockNumber) ? 1 * order : -1 * order;
                }

                return Number(a[sortBy]) > Number(b[sortBy]) ? 1 * order : -1 * order;

                //return Number(a.transaction.timestamp) > Number(b.transaction.timestamp) ? 1 * order : -1 * order;
            }).slice(skip, skip + limit);
    }

    getCompiledRewards(params: IGetQueryParams) {
        const { 
            limit = 100, 
            skip = 0, 
            order = 'DESC', 
            sortBy = 'blockNumber',
        } = params;

        return this.rewards
            .filter(r => {
                let isMatch = true;

                if(params.wallet) {
                    isMatch = isMatch && r.wallet === params.wallet;
                }

                if(params.positionId) {
                    isMatch = isMatch && r.tokenId === params.positionId;
                }

                if(params.blockNumberFrom) {
                    isMatch = isMatch && Number(r.blockNumber) >= Number(params.blockNumberFrom);
                }
                
                if(params.blockNumberTo) {
                    isMatch = isMatch && Number(r.blockNumber) <= Number(params.blockNumberTo);
                }

                if(params.timestampFrom) {
                    isMatch = isMatch && Number(r.timestamp) >= Number(params.timestampFrom);
                }

                if(params.timestampTo) {
                    isMatch = isMatch && Number(r.timestamp) <= Number(params.timestampTo);
                }

                return isMatch;
            })
            .sort((a, b) => {
                const order = params.order === 'ASC' ? 1 : -1;

                if(sortBy === 'blockNumber') {
                    return Number(a.transaction.blockNumber) > Number(b.transaction.blockNumber) ? 1 * order : -1 * order;
                }

                return Number(a.transaction.timestamp) > Number(b.transaction.timestamp) ? 1 * order : -1 * order;
            }).slice(skip, skip + limit);
    }
}