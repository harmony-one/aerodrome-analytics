import { Module } from '@nestjs/common';
import { LoaderController } from './loader.controller';
import { LoaderService } from './loader.service';
import { PoolHourData } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([PoolHourData])],
  controllers: [LoaderController],
  providers: [LoaderService],
  exports: [LoaderService],
})
export class LoaderModule {}
