import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './configs/config';
import { Web3Module } from 'nest-web3';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoaderModule as EventsLoaderModule } from './events-loader/loader.module';
import { LoaderModule as PositionsLoaderModule } from './positions-loader/loader.module';
import { LoaderModule as PoolHourDatasLoaderModule } from './pool-hours-data-loader/loader.module';
import { StatisticModule } from './statistic/statistic.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, EventA, Position, PoolHourData } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    Web3Module.forRootAsync({
      useFactory: (configService: ConfigService) => [
        configService.get('base'),
      ],
      inject: [ConfigService],
    }),
    Web3Module,
    PositionsLoaderModule,
    EventsLoaderModule,
    PoolHourDatasLoaderModule,
    StatisticModule,
    PrometheusModule.register(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      entities: [User, EventA, Position, PoolHourData],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }