// Script temporaire : supprimer tous les pros et en recréer 4 avec mots de passe en clair
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Suppression de tous les professionnels...');

  // Supprimer les tables liées d'abord (celles sans cascade auto)
  await prisma.professionalZone.deleteMany();
  await prisma.adminNote.deleteMany();
  await prisma.earning.deleteMany();
  await prisma.proRefreshToken.deleteMany();
  await prisma.proLocationHistory.deleteMany();

  // Détacher les missions des pros (SetNull)
  await prisma.mission.updateMany({
    data: { professionalId: null },
  });

  // Supprimer tous les professionnels
  await prisma.professional.deleteMany();
  console.log('Tous les professionnels supprimés.');

  // Récupérer les zones existantes
  const zones = await prisma.zone.findMany();
  console.log(`Zones trouvées: ${zones.map(z => z.name).join(', ')}`);

  // Créer 4 professionnels
  const pros = [
    {
      email: 'marie.dupont@test.com',
      password: 'Pro1234',
      firstName: 'Marie',
      lastName: 'Dupont',
      phone: '0612345601',
      address: '15 Rue de Vaugirard',
      city: 'Paris',
      postalCode: '75015',
      rating: 4.8,
      totalMissions: 12,
      isAvailable: true,
      isVerified: true,
      accountSetupComplete: true,
      language: 'fr',
    },
    {
      email: 'sophie.martin@test.com',
      password: 'Pro1234',
      firstName: 'Sophie',
      lastName: 'Martin',
      phone: '0612345602',
      address: '8 Avenue Mozart',
      city: 'Paris',
      postalCode: '75016',
      rating: 4.5,
      totalMissions: 8,
      isAvailable: true,
      isVerified: true,
      accountSetupComplete: true,
      language: 'fr',
    },
    {
      email: 'anna.ivanova@test.com',
      password: 'Pro1234',
      firstName: 'Anna',
      lastName: 'Ivanova',
      phone: '0612345603',
      address: '22 Rue du Point du Jour',
      city: 'Boulogne-Billancourt',
      postalCode: '92100',
      rating: 4.9,
      totalMissions: 20,
      isAvailable: false,
      isVerified: true,
      accountSetupComplete: true,
      language: 'ru',
    },
    {
      email: 'lucas.pereira@test.com',
      password: 'Pro1234',
      firstName: 'Lucas',
      lastName: 'Pereira',
      phone: '0612345604',
      address: '5 Rue de la Convention',
      city: 'Paris',
      postalCode: '75015',
      rating: 3.8,
      totalMissions: 3,
      isAvailable: true,
      isVerified: false,
      accountSetupComplete: true,
      language: 'pt',
    },
  ];

  for (const pro of pros) {
    const created = await prisma.professional.create({ data: pro });

    // Assigner une zone si correspondance par code postal
    const matchingZone = zones.find(z => z.postalCodes.includes(pro.postalCode));
    if (matchingZone) {
      await prisma.professionalZone.create({
        data: {
          professionalId: created.id,
          zoneId: matchingZone.id,
        },
      });
      console.log(`  → ${pro.firstName} ${pro.lastName} assigné(e) à la zone ${matchingZone.name}`);
    }

    console.log(`Créé: ${pro.firstName} ${pro.lastName} (${pro.email}) — mdp: ${pro.password}`);
  }

  console.log('\nTerminé ! 4 professionnels créés.');
}

main()
  .catch((e) => {
    console.error('Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
