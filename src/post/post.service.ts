import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePostDto } from './dto/createPost';

@Injectable()
export class PostService {
  constructor(private prismaService: PrismaService) {}
  async createPost(post: CreatePostDto, user: User) {
    await this.prismaService.post.create({
      data: {
        title: post.title,
        description: post.description,
        content: post.content,
        author: {
          connect: { id: user.id },
        },
      },
    });
  }

  async getPosts() {
    return await this.prismaService.post.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        author: {
          select: {
            username: true,
          },
        },
      },
    });
  }
}
