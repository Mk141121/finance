import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Tenant } from './tenant.entity';
import { Role } from '../../auth/entities/role.entity';

@Entity('user_tenants')
export class UserTenant {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @PrimaryColumn({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'role_id', nullable: true })
  roleId: string;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_owner', default: false })
  isOwner: boolean;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @Column({ name: 'last_accessed_at', type: 'timestamp', nullable: true })
  lastAccessedAt: Date;
}
