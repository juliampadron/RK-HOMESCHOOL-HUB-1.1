import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Resource Catalog',
  description:
    'Browse NYS-aligned curriculum resources for grades 3–5 from Renaissance Kids.',
};

// Seed data from bulk_upload_science_template.csv
const RESOURCES = [
  {
    slug: 'solar-system-explorer',
    title: 'Solar System Explorer',
    subject_tags: ['Science'],
    grade_level: '3–5',
    resource_type: 'Unit',
    price: 3.49,
    is_member_only: false,
    description:
      'A comprehensive unit exploring the planets, moons, and stars in our solar system with hands-on activities.',
  },
  {
    slug: 'light-and-shadows-experiment',
    title: 'Light and Shadows Experiment',
    subject_tags: ['Science'],
    grade_level: '3–5',
    resource_type: 'Lab',
    price: 2.99,
    is_member_only: false,
    description:
      'An experiment kit for exploring how light interacts with objects to create shadows.',
  },
  {
    slug: 'animal-adaptations-slide-deck',
    title: 'Animal Adaptations Slide Deck',
    subject_tags: ['Science'],
    grade_level: '3–5',
    resource_type: 'Presentation',
    price: 1.99,
    is_member_only: false,
    description:
      'A visually engaging slide deck explaining how animals adapt to their environments.',
  },
  {
    slug: 'water-cycle-storybook',
    title: 'Water Cycle Storybook',
    subject_tags: ['Science', 'Language Arts'],
    grade_level: '3–5',
    resource_type: 'Storybook',
    price: 0,
    is_member_only: false,
    description:
      'A narrative storybook following a water droplet through the water cycle with illustrations and comprehension questions.',
  },
  {
    slug: 'earthquake-engineering-challenge',
    title: 'Earthquake Engineering Challenge',
    subject_tags: ['Science', 'Art'],
    grade_level: '3–5',
    resource_type: 'Project',
    price: 3.99,
    is_member_only: false,
    description:
      'An art-integrated project where students design and build earthquake-resistant structures.',
  },
  {
    slug: 'plant-observation-journal',
    title: 'Plant Observation Journal',
    subject_tags: ['Science'],
    grade_level: '3–5',
    resource_type: 'Worksheet',
    price: 0,
    is_member_only: false,
    description:
      'A printable journal for students to record observations of plants over time.',
  },
  {
    slug: 'ocean-food-web-diagram',
    title: 'Ocean Food Web Diagram',
    subject_tags: ['Science'],
    grade_level: '3–5',
    resource_type: 'Worksheet',
    price: 1.49,
    is_member_only: false,
    description:
      'A worksheet that guides students to construct and label an ocean food web.',
  },
  {
    slug: 'simple-machines-game',
    title: 'Simple Machines Game',
    subject_tags: ['Science'],
    grade_level: '3–5',
    resource_type: 'Game',
    price: 2.49,
    is_member_only: false,
    description:
      'A board game that helps students identify and classify different types of simple machines.',
  },
  {
    slug: 'mysterious-matter-investigation',
    title: 'Mysterious Matter Investigation',
    subject_tags: ['Science', 'Math'],
    grade_level: '3–5',
    resource_type: 'Lab',
    price: 3.25,
    is_member_only: false,
    description:
      'A lab where students measure and classify different states of matter using math skills.',
  },
  {
    slug: 'weather-reporter-video-project',
    title: 'Weather Reporter Video Project',
    subject_tags: ['Science', 'Language Arts', 'Art'],
    grade_level: '3–5',
    resource_type: 'Project',
    price: 2.75,
    is_member_only: false,
    description:
      'A multimedia project where students script and film their own weather report with artistic flair.',
  },
  {
    slug: 'rock-cycle-coloring-sheet',
    title: 'Rock Cycle Coloring Sheet',
    subject_tags: ['Science', 'Art'],
    grade_level: '3–5',
    resource_type: 'Worksheet',
    price: 0.99,
    is_member_only: false,
    description:
      'A coloring activity that helps students visualize the stages of the rock cycle.',
  },
] as const;

function PriceTag({ price }: { price: number }) {
  if (price === 0) {
    return (
      <span className="text-xs font-semibold text-rk-green bg-green-50 px-2 py-0.5 rounded-full">
        Free
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-rk-orange bg-orange-50 px-2 py-0.5 rounded-full">
      ${price.toFixed(2)}
    </span>
  );
}

export default function ResourceCatalogPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-rk-green">
              Resource Catalog
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              NYS-aligned science resources for grades 3–5
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-rk-blue hover:underline focus-visible:ring-2 focus-visible:ring-rk-blue"
          >
            ← Back to Hub
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {RESOURCES.map((resource) => (
            <article
              key={resource.slug}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="text-base font-semibold text-gray-800 leading-snug">
                  {resource.title}
                </h2>
                <PriceTag price={resource.price} />
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                {resource.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {resource.resource_type}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  Gr {resource.grade_level}
                </span>
                {resource.subject_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-blue-50 text-rk-blue px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <footer className="text-center text-xs text-gray-400 pt-4">
          © {new Date().getFullYear()} Renaissance Kids, Inc. — Light up
          learning through the arts.
        </footer>
      </div>
    </main>
  );
}
