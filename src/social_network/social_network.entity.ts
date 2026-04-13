import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, Index } from 'typeorm';

// Idempotency tầng DB
@Unique(['userId', 'friendId']) // tránh duplicate relation + cover CanChat/Unfriend/BlockUser
// Tại sao đánh composite index với status?
// Lý do 1 — composite index: status selectivity thấp (chỉ 3 giá trị)
//   nhưng đứng sau userId/friendId thì ổn vì userId đã thu hẹp
//   xuống ~N relations của 1 user, status chỉ filter trong tập nhỏ đó
//   → tránh scan toàn bộ relations của user rồi filter ở tầng app
//
// Lý do 2 — business logic: query trong service chủ yếu nhắm vào status=0 (pending)
//   pending thường chiếm tỉ lệ nhỏ (popularity thấp → selectivity cao trong thực tế)
//   → index lọc được phần lớn rows không cần thiết
@Index(['userId', 'status'])    // GetSentFriend, GetAllFriend (userId side)
@Index(['friendId', 'status'])  // GetIncomingFriend, GetAllFriend (friendId side)
@Entity('social_network') 
export class SocialNetworkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // Unique(userId, friendId) cover query WHERE userId = ? qua leftmost prefix
  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  friendId: number;

  @Column({ nullable: false })
  status: number;

  @CreateDateColumn()
  createdAt: Date;
}
