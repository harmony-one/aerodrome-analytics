import { Module } from '@nestjs/common';
import { LoaderController } from './loader.controller';
import { LoaderService } from './loader.service';
import { User, EventA, Position } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User, EventA, Position])],
  controllers: [LoaderController],
  providers: [LoaderService],
  exports: [LoaderService],
})
export class LoaderModule {}
