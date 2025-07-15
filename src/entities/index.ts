
import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;
}

@Entity()
class EventD {
  @PrimaryColumn()
  id: string;

  @Column()
  tokenId: string;

  @Column()
  user: string;

  @Column()
  eventName: string;

  @Column()
  transactionHash: string;

  @Column()
  blockNumber: number;

  @Column()
  contractAddress: string;

  @Column('jsonb')
  eventValues: any;
}


@Entity()
class PositionC {
  @PrimaryColumn()
  id: string;

  @Column()
  timestamp: string;

  @Column()
  blockNumber: number;

  @Column()
  transactionHash: string;

  @Column()
  depositedToken0: string;

  @Column()
  depositedToken1: string;

  @Column()
  tickLower: string;

  @Column()
  tickUpper: string;

  @Column()
  pool: string;

  @Column('jsonb')
  metadata: any;
}

@Entity()
class PoolHourData {
  @PrimaryColumn()
  id: number;

  @Column()
  periodStartUnix: number;

  @Column()
  token0Price: string;

  @Column()
  token1Price: string;

  @Column()
  tick: string;

  @Column()
  pool: string;

  @Column('jsonb')
  metadata: any;
}


export { PositionC as Position, EventD as EventA, User, PoolHourData };