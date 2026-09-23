import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function runMigration() {
  console.log('Connecting to Supabase PostgreSQL database at db.zuucfwituhhimgcagrue.supabase.co...');
  
  const client = new Client({
    host: 'db.zuucfwituhhimgcagrue.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Abhijith@123',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully to Supabase Postgres!');

    const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
    console.log('Applying relational schema (profiles, rooms, songs, room_queue, messages, etc.)...');
    
    await client.query(schemaSql);
    console.log('Schema migration applied successfully to Supabase!');

    // Let's seed initial real rooms if none exist
    const checkRooms = await client.query('SELECT count(*) FROM public.rooms');
    console.log(`Current rooms in Supabase: ${checkRooms.rows[0].count}`);

    if (parseInt(checkRooms.rows[0].count, 10) === 0) {
      console.log('Seeding initial real live listening rooms into Supabase...');
      // Ensure system owner profile exists
      await client.query(`
        INSERT INTO public.profiles (id, username, display_name, avatar_url, bio)
        VALUES ('00000000-0000-0000-0000-000000000001', 'alex', 'Alex Carter', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop', 'Good music. Better company. 🎧')
        ON CONFLICT (id) DO NOTHING;
      `);

      // Seed Real Rooms
      await client.query(`
        INSERT INTO public.rooms (id, owner_id, name, description, cover_url, privacy, max_members, playback_mode)
        VALUES 
          ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Late Night Vibes', 'Good music, great people, relaxed vibes for late hours.', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop', 'public', 50, 'dj_controlled'),
          ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Study & Focus', 'Deep concentration with lofi hip hop and ambient beats.', 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&fit=crop', 'public', 40, 'host_controlled'),
          ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Good Music Only', 'Only the best indie, rock, and alternative gems.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&fit=crop', 'public', 60, 'community_voting')
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('Seeded real live rooms into Supabase successfully!');
    }

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

runMigration();
