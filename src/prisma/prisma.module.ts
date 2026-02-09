import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Agar PrismaService bisa dipakai di semua module tanpa import ulang
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export agar bisa dipakai module lain
})
export class PrismaModule {}
