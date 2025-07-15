import { Module } from '@nestjs/common';
import { LoaderController } from './loader.controller';
import { LoaderService } from './loader.service';
import { Position } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Position])],
  controllers: [LoaderController],
  providers: [LoaderService],
  exports: [LoaderService],
})
export class LoaderModule {}
