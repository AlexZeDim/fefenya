import { Repository } from 'typeorm';
import { GothEntity } from '@app/pg';

export const getGotdUserEntity = async (
  repository: Repository<GothEntity>,
  guildUserId: string,
  displayName: string,
  guildId: string,
) => {
  const gothUserEntity = await repository.findOneBy({
    id: guildUserId,
  });

  if (!gothUserEntity) {
    const gothEntity = repository.create({
      id: guildUserId,
      name: displayName,
      count: 1,
      guildId: guildId,
    });

    await repository.save(gothEntity);
  } else {
    await repository.update(
      { id: guildUserId },
      {
        name: displayName,
        count: gothUserEntity.count + 1,
      },
    );
  }
};
