import { Magazine } from './magazine.model';

type TMagazineSeed = {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  tag?: string;
};

// NOTE: insertion order is intentional. "ÉLAN Homme" is seeded LAST
// ("1st one will insert at end") so it becomes the newest document
// and shows up first in the createdAt-desc magazine listings.
const magazinesData: TMagazineSeed[] = [
  {
    slug: 'elan-homme',
    title: 'ÉLAN Homme',
    description:
      'The definitive guide to modern masculine living — from fashion and grooming to travel, culture and the art of living well.',
    coverImage: 'cover/1.jpg',
    tag: 'FEATURED',
  },
  {
    slug: 'joie-de-vivre',
    title: 'Joie de Vivre',
    description:
      "Journey to the world's most captivating destinations with stunning photography and authoritative travel editorial.",
    coverImage: 'cover/2.jpg',
  },
  {
    slug: 'a-world-of-culture',
    title: 'A World of Culture',
    description:
      'Explore the finest expressions of contemporary art, design, architecture and cultural experiences from around the globe.',
    coverImage: 'cover/3.jpg',
  },
  {
    slug: 'island-escapes',
    title: 'Island Escapes',
    description:
      'Exceptional cuisine, fine dining and the pleasures of the table — from celebrated chefs to hidden culinary gems.',
    coverImage: 'cover/4.jpg',
  },
  {
    slug: 'irresistible-italy',
    title: 'Irresistible Italy',
    description:
      'A refined approach to health and wellbeing — mindfulness, fitness, nutrition and the pursuit of balance.',
    coverImage: 'cover/5.jpg',
  },
  {
    slug: 'blue-serenade-greece',
    title: 'Blue Serenade Greece',
    description:
      'The art of living well — interiors, design, entertaining and the finer things that make life extraordinary.',
    coverImage: 'cover/6.jpg',
  },
  {
    slug: 'dream-hotels',
    title: 'Dream Hotels',
    description:
      'The definitive guide to modern masculine living — from fashion and grooming to travel, culture and the art of living well.',
    coverImage: 'cover/7.jpg',
    tag: 'FEATURED',
  },
  {
    slug: 'elan-voyage',
    title: 'ÉLAN Voyage',
    description:
      "Journey to the world's most captivating destinations with stunning photography and authoritative travel editorial.",
    coverImage: 'cover/8.jpg',
  },
  {
    slug: 'elan-culture',
    title: 'ÉLAN Culture',
    description:
      'Explore the finest expressions of contemporary art, design, architecture and cultural experiences from around the globe.',
    coverImage: 'cover/9.jpg',
  },
  {
    slug: 'elan-cuisine',
    title: 'ÉLAN Cuisine',
    description:
      'Exceptional cuisine, fine dining and the pleasures of the table — from celebrated chefs to hidden culinary gems.',
    coverImage: 'cover/10.jpg',
  },
  {
    slug: 'elan-wellness',
    title: 'ÉLAN Wellness',
    description:
      'A refined approach to health and wellbeing — mindfulness, fitness, nutrition and the pursuit of balance.',
    coverImage: 'cover/11.jpg',
  },
];

const MagazineSeeder = async () => {
  let created = 0;
  let skipped = 0;

  // Insert one-by-one (not bulkWrite) so each document gets its own
  // timestamp — this keeps the required creation order intact.
  for (let i=magazinesData.length-1; i>=0; i--) {
    const magazine = magazinesData[i];
    const existing = await Magazine.findOne({ slug: magazine.slug });
    if (existing) {
      skipped++;
      continue;
    }
    await Magazine.create(magazine);
    created++;
    console.log(`Magazine seeded: ${magazine.title}`);
  }

  console.log(
    `Magazines seeded (inserted if missing) successfully — created: ${created}, already existed: ${skipped}`
  );
};

export default MagazineSeeder;