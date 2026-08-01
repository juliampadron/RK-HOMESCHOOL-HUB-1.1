-- Seed: 11 science resources for grades 3–5 (from bulk_upload_science_template.csv)
-- Prices stored as cents to avoid floating-point issues.

begin;

insert into public.resources
  (title, slug, subject_tags, grade_level, resource_type, price_cents, file_path, is_member_only, description)
values
  (
    'Solar System Explorer',
    'solar-system-explorer',
    array['Science'],
    '3-5',
    'Unit',
    349,
    'pdfs/solar-system-explorer.pdf',
    false,
    'A comprehensive unit exploring the planets, moons, and stars in our solar system with hands-on activities.'
  ),
  (
    'Light and Shadows Experiment',
    'light-and-shadows-experiment',
    array['Science'],
    '3-5',
    'Lab',
    299,
    'pdfs/light-and-shadows-experiment.pdf',
    false,
    'An experiment kit for exploring how light interacts with objects to create shadows.'
  ),
  (
    'Animal Adaptations Slide Deck',
    'animal-adaptations-slide-deck',
    array['Science'],
    '3-5',
    'Presentation',
    199,
    'pdfs/animal-adaptations-slide-deck.pdf',
    false,
    'A visually engaging slide deck explaining how animals adapt to their environments.'
  ),
  (
    'Water Cycle Storybook',
    'water-cycle-storybook',
    array['Science', 'Language Arts'],
    '3-5',
    'Storybook',
    0,
    'pdfs/water-cycle-storybook.pdf',
    false,
    'A narrative storybook following a water droplet through the water cycle with illustrations and comprehension questions.'
  ),
  (
    'Earthquake Engineering Challenge',
    'earthquake-engineering-challenge',
    array['Science', 'Art'],
    '3-5',
    'Project',
    399,
    'pdfs/earthquake-engineering-challenge.pdf',
    false,
    'An art-integrated project where students design and build earthquake-resistant structures.'
  ),
  (
    'Plant Observation Journal',
    'plant-observation-journal',
    array['Science'],
    '3-5',
    'Worksheet',
    0,
    'pdfs/plant-observation-journal.pdf',
    false,
    'A printable journal for students to record observations of plants over time.'
  ),
  (
    'Ocean Food Web Diagram',
    'ocean-food-web-diagram',
    array['Science'],
    '3-5',
    'Worksheet',
    149,
    'pdfs/ocean-food-web-diagram.pdf',
    false,
    'A worksheet that guides students to construct and label an ocean food web.'
  ),
  (
    'Simple Machines Game',
    'simple-machines-game',
    array['Science'],
    '3-5',
    'Game',
    249,
    'pdfs/simple-machines-game.pdf',
    false,
    'A board game that helps students identify and classify different types of simple machines.'
  ),
  (
    'Mysterious Matter Investigation',
    'mysterious-matter-investigation',
    array['Science', 'Math'],
    '3-5',
    'Lab',
    325,
    'pdfs/mysterious-matter-investigation.pdf',
    false,
    'A lab where students measure and classify different states of matter using math skills.'
  ),
  (
    'Weather Reporter Video Project',
    'weather-reporter-video-project',
    array['Science', 'Language Arts', 'Art'],
    '3-5',
    'Project',
    275,
    'pdfs/weather-reporter-video-project.pdf',
    false,
    'A multimedia project where students script and film their own weather report with artistic flair.'
  ),
  (
    'Rock Cycle Coloring Sheet',
    'rock-cycle-coloring-sheet',
    array['Science', 'Art'],
    '3-5',
    'Worksheet',
    99,
    'pdfs/rock-cycle-coloring-sheet.pdf',
    false,
    'A coloring activity that helps students visualize the stages of the rock cycle.'
  )
on conflict (slug) do update set
  title = excluded.title,
  subject_tags = excluded.subject_tags,
  grade_level = excluded.grade_level,
  resource_type = excluded.resource_type,
  price_cents = excluded.price_cents,
  file_path = excluded.file_path,
  is_member_only = excluded.is_member_only,
  description = excluded.description,
  updated_at = now();

commit;
