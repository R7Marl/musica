import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import { BusinessEntity } from './entities/business.entity';
import { MusicQueueEntity } from './entities/music-queue.entity';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessesRepository: Repository<BusinessEntity>,
    @InjectRepository(MusicQueueEntity)
    private readonly queuesRepository: Repository<MusicQueueEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async createBusiness(input: {
    name: string;
    slug?: string;
    userEmail: string;
    userPassword: string;
    defaultQueueName?: string;
  }) {
    const businessSlug = await this.ensureUniqueBusinessSlug(
      input.slug ?? input.name,
    );
    const normalizedEmail = input.userEmail.toLowerCase();
    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Ya existe un usuario con ese email');
    }

    const business = await this.businessesRepository.save(
      this.businessesRepository.create({
        name: input.name,
        slug: businessSlug,
      }),
    );

    const passwordHash = await bcrypt.hash(input.userPassword, 12);
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email: normalizedEmail,
        passwordHash,
        role: 'client',
        businessId: business.id,
      }),
    );

    const queue = await this.createQueueForBusiness(business.id, {
      name: input.defaultQueueName ?? 'Principal',
      slug: `${business.slug}-principal`,
    });

    return {
      business,
      user: this.toPublicUser(user),
      defaultQueue: queue,
    };
  }

  async listBusinesses() {
    const businesses = await this.businessesRepository.find({
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      businesses.map(async (business) => ({
        business,
        queues: await this.listQueuesForBusiness(business.id),
      })),
    );
  }

  async createQueueForBusiness(
    businessId: string,
    input: { name: string; slug?: string },
  ) {
    const business = await this.businessesRepository.findOne({
      where: { id: businessId, isActive: true },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const slug = await this.ensureUniqueQueueSlug(
      input.slug ?? `${business.slug}-${input.name}`,
    );

    return this.queuesRepository.save(
      this.queuesRepository.create({
        businessId: business.id,
        name: input.name,
        slug,
      }),
    );
  }

  async listQueuesForBusiness(businessId: string) {
    return this.queuesRepository.find({
      where: { businessId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async getPublicBusinessBySlug(slug: string) {
    const business = await this.businessesRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!business) {
      throw new NotFoundException('Negocio no encontrado');
    }

    return {
      business,
      queues: await this.listQueuesForBusiness(business.id),
    };
  }

  async ensureQueueAccess(
    user: {
      role: string;
      businessId: string | null;
    },
    queueId: string,
  ) {
    const queue = await this.queuesRepository.findOne({
      where: { id: queueId, isActive: true },
    });

    if (!queue) {
      throw new NotFoundException('Playlist no encontrada');
    }

    if (user.role === 'owner') {
      return queue;
    }

    if (queue.businessId !== user.businessId) {
      throw new ForbiddenException('No tenes acceso a esta playlist');
    }

    return queue;
  }

  async findPublicQueue(queueIdOrSlug: string) {
    const where = this.isUuid(queueIdOrSlug)
      ? [{ id: queueIdOrSlug }, { slug: queueIdOrSlug }]
      : [{ slug: queueIdOrSlug }];
    const queue = await this.queuesRepository.findOne({
      where,
    });

    if (!queue || !queue.isActive) {
      throw new NotFoundException('Playlist no encontrada');
    }

    return queue;
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private async ensureUniqueBusinessSlug(value: string) {
    const baseSlug = this.slugify(value);
    let slug = baseSlug;
    let suffix = 2;

    while (await this.businessesRepository.exists({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private async ensureUniqueQueueSlug(value: string) {
    const baseSlug = this.slugify(value);
    let slug = baseSlug;
    let suffix = 2;

    while (await this.queuesRepository.exists({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180);
  }

  private toPublicUser(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    };
  }
}
