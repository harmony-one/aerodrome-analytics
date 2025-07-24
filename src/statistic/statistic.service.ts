import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventA, Position, PoolHourData } from 'src/entities';
import { IEvent, IPosition, ICompiledPosition, IPoolHourDatas } from 'src/interfaces';
import { calculateStats } from './generate_stats/index';
import { compileRewards } from './generate_stats/rewards-utils';

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
            () => this.eventsRepository.find(),
            'Loading events from db'
        );

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

        while (!positionsFromDb || positionsFromDb.length === limit) {
            positionsFromDb = await this.startFn(
                () => this.positionsRepository.find({
                    skip,
                    take: limit,
                    order: {
                        blockNumber: 'ASC'
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

    getPositions() {
        return this.compiledPositions.slice(0, 100);
    }

    getPosition(id: string) {
        return this.compiledPositions.find(p => p.id === id);
    }

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

    async getEvents({ limit = 1000, skip = 0 }: { limit: number, skip: number }) {
        const eventsFromDb = await this.eventsRepository.find({
            skip,
            take: limit,
        });

        return eventsFromDb;
    }
}