// Seed script pour initialiser la base de données avec des données de test
import { PrismaClient, ServiceType, BookingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Créer un utilisateur de test
  const hashedPassword = await bcrypt.hash('Test1234', 12);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@cleanhouse.com' },
    update: {},
    create: {
      email: 'test@cleanhouse.com',
      password: hashedPassword,
      name: 'Jean Test',
      phone: '0612345678',
    },
  });

  console.log(`Created test user: ${testUser.email}`);

  // Créer quelques réservations de test
  const bookings = [
    {
      userId: testUser.id,
      service: ServiceType.MENAGE,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
      time: '09:00',
      duration: 3,
      address: '123 Rue de la Paix, 75001 Paris',
      price: 75.00,
      professional: 'Marie Dupont',
      status: BookingStatus.confirmed,
    },
    {
      userId: testUser.id,
      service: ServiceType.REPASSAGE,
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Dans 14 jours
      time: '14:00',
      duration: 2,
      address: '123 Rue de la Paix, 75001 Paris',
      price: 40.00,
      professional: 'Sophie Martin',
      status: BookingStatus.confirmed,
    },
    {
      userId: testUser.id,
      service: ServiceType.MENAGE_REPASSAGE,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 7 jours
      time: '10:00',
      duration: 4,
      address: '123 Rue de la Paix, 75001 Paris',
      price: 160.00,
      professional: 'Julie Bernard',
      status: BookingStatus.completed,
    },
  ];

  for (const booking of bookings) {
    await prisma.booking.create({ data: booking });
  }

  console.log(`Created ${bookings.length} test bookings`);

  // Créer quelques transactions de test
  const transactions = [
    {
      userId: testUser.id,
      type: 'deposit' as const,
      amount: 200.00,
      description: 'Dépôt initial',
    },
    {
      userId: testUser.id,
      type: 'expense' as const,
      amount: 100.00,
      description: 'Paiement - Ménage + Repassage',
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.create({ data: transaction });
  }

  console.log(`Created ${transactions.length} test transactions`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
