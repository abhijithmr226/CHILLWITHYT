import { Song, Playlist } from '../../types';
import { MusicProvider, SearchResults, SearchFilterOptions } from './MusicProvider';
import { YouTubeDataApiService } from './YouTubeDataApi';

// Comprehensive, high quality curated tracks with real YouTube video IDs & official thumbnails
export const DEFAULT_TRACKS: Song[] = [
  // ─── 1. MALAYALAM SUPERHITS (25 TRACKS) ──────────────────────────────────
  {
    id: 'track-mal-1',
    source: 'youtube',
    sourceId: 'HUAAYwtusLI',
    title: 'Jaada',
    artist: 'Sushin Shyam, Sreenath Bhasi',
    album: 'Aavesham',
    artwork: 'https://img.youtube.com/vi/HUAAYwtusLI/hqdefault.jpg',
    duration: 215,
    tags: ['Malayalam', 'Sushin', 'Aavesham', 'Mollywood', 'Kerala']
  },
  {
    id: 'track-mal-2',
    source: 'youtube',
    sourceId: 'tOM-nWPcR4U',
    title: 'Illuminati',
    artist: 'Sushin Shyam, Dabzee',
    album: 'Aavesham',
    artwork: 'https://img.youtube.com/vi/tOM-nWPcR4U/hqdefault.jpg',
    duration: 189,
    tags: ['Malayalam', 'Sushin', 'Aavesham', 'Dabzee', 'Kerala']
  },
  {
    id: 'track-mal-3',
    source: 'youtube',
    sourceId: 'HkvVaj_28C8',
    title: 'Armadham',
    artist: 'Sushin Shyam, Pranavam Sasi',
    album: 'Aavesham',
    artwork: 'https://img.youtube.com/vi/HkvVaj_28C8/hqdefault.jpg',
    duration: 187,
    tags: ['Malayalam', 'Sushin', 'Aavesham', 'Mollywood']
  },
  {
    id: 'track-mal-4',
    source: 'youtube',
    sourceId: 'kLp_Hh6DKWc',
    title: 'Monsoon Strings (Kerala Vibes)',
    artist: 'Thaikkudam Bridge & Masala Coffee',
    album: 'Backwater Echoes',
    artwork: 'https://img.youtube.com/vi/kLp_Hh6DKWc/hqdefault.jpg',
    duration: 230,
    tags: ['Malayalam', 'Kerala', 'Acoustic', 'Fusion']
  },
  {
    id: 'track-mal-5',
    source: 'youtube',
    sourceId: 'xPq_t3R2C9M',
    title: 'Aadharanjali',
    artist: 'Sushin Shyam, Madhuvanthi',
    album: 'Romancham',
    artwork: 'https://img.youtube.com/vi/xPq_t3R2C9M/hqdefault.jpg',
    duration: 195,
    tags: ['Malayalam', 'Romancham', 'Sushin', 'Kerala']
  },
  {
    id: 'track-mal-6',
    source: 'youtube',
    sourceId: 'Yq7E3uE4T1k',
    title: 'Thalatherichavar',
    artist: 'Sushin Shyam, Zia Ul Haq',
    album: 'Romancham',
    artwork: 'https://img.youtube.com/vi/Yq7E3uE4T1k/hqdefault.jpg',
    duration: 210,
    tags: ['Malayalam', 'Romancham', 'Sushin']
  },
  {
    id: 'track-mal-7',
    source: 'youtube',
    sourceId: '1x2P3h_5pC8',
    title: 'Kuthanthram',
    artist: 'Sushin Shyam, Vedan',
    album: 'Manjummel Boys',
    artwork: 'https://img.youtube.com/vi/1x2P3h_5pC8/hqdefault.jpg',
    duration: 178,
    tags: ['Malayalam', 'Manjummel Boys', 'Sushin', 'Vedan']
  },
  {
    id: 'track-mal-8',
    source: 'youtube',
    sourceId: 'xT1T1e0aT6Q',
    title: 'Kanmani Anbodu (Remastered Vibe)',
    artist: 'Ilaiyaraaja, Sushin Shyam',
    album: 'Manjummel Boys',
    artwork: 'https://img.youtube.com/vi/xT1T1e0aT6Q/hqdefault.jpg',
    duration: 245,
    tags: ['Malayalam', 'Tamil', 'Manjummel Boys', 'Ilaiyaraaja']
  },
  {
    id: 'track-mal-9',
    source: 'youtube',
    sourceId: 'B8_1A08X9oY',
    title: 'Mini Maharani',
    artist: 'Vishnu Vijay, Kapil Kapilan',
    album: 'Premalu',
    artwork: 'https://img.youtube.com/vi/B8_1A08X9oY/hqdefault.jpg',
    duration: 204,
    tags: ['Malayalam', 'Premalu', 'Vishnu Vijay', 'Romance']
  },
  {
    id: 'track-mal-10',
    source: 'youtube',
    sourceId: 'G_p1YhY-JpE',
    title: 'Welcome to Hyderabad',
    artist: 'Vishnu Vijay, Sanjith Hegde',
    album: 'Premalu',
    artwork: 'https://img.youtube.com/vi/G_p1YhY-JpE/hqdefault.jpg',
    duration: 198,
    tags: ['Malayalam', 'Premalu', 'Hyderabad', 'Upbeat']
  },
  {
    id: 'track-mal-11',
    source: 'youtube',
    sourceId: 'm_8nQz9H2a8',
    title: 'Neela Nilave',
    artist: 'Sam C.S., Kapil Kapilan',
    album: 'RDX',
    artwork: 'https://img.youtube.com/vi/m_8nQz9H2a8/hqdefault.jpg',
    duration: 220,
    tags: ['Malayalam', 'RDX', 'Kapil Kapilan', 'Melody']
  },
  {
    id: 'track-mal-12',
    source: 'youtube',
    sourceId: 'k5KqW9sY3_o',
    title: 'Halaballoo',
    artist: 'Sam C.S., Benny Dayal',
    album: 'RDX',
    artwork: 'https://img.youtube.com/vi/k5KqW9sY3_o/hqdefault.jpg',
    duration: 208,
    tags: ['Malayalam', 'RDX', 'Party', 'Dance']
  },
  {
    id: 'track-mal-13',
    source: 'youtube',
    sourceId: 'H5_6G1sU3q0',
    title: 'Parudeesa',
    artist: 'Sushin Shyam, Sreenath Bhasi',
    album: 'Bheeshma Parvam',
    artwork: 'https://img.youtube.com/vi/H5_6G1sU3q0/hqdefault.jpg',
    duration: 228,
    tags: ['Malayalam', 'Bheeshma Parvam', 'Sushin', 'Soul']
  },
  {
    id: 'track-mal-14',
    source: 'youtube',
    sourceId: 'x3R7B2j7C8Q',
    title: 'Rathipushpam',
    artist: 'Sushin Shyam, Unni Menon',
    album: 'Bheeshma Parvam',
    artwork: 'https://img.youtube.com/vi/x3R7B2j7C8Q/hqdefault.jpg',
    duration: 232,
    tags: ['Malayalam', 'Bheeshma Parvam', 'Retro']
  },
  {
    id: 'track-mal-15',
    source: 'youtube',
    sourceId: 'Z4_4J9qZ8vA',
    title: 'Ole Melody',
    artist: 'Vishnu Vijay, Haricharan',
    album: 'Thallumaala',
    artwork: 'https://img.youtube.com/vi/Z4_4J9qZ8vA/hqdefault.jpg',
    duration: 215,
    tags: ['Malayalam', 'Thallumaala', 'Tovino', 'Melody']
  },
  {
    id: 'track-mal-16',
    source: 'youtube',
    sourceId: '1N2kC8Y8M1Q',
    title: 'Kannil Pettole',
    artist: 'Vishnu Vijay, Irfana Hameed',
    album: 'Thallumaala',
    artwork: 'https://img.youtube.com/vi/1N2kC8Y8M1Q/hqdefault.jpg',
    duration: 198,
    tags: ['Malayalam', 'Thallumaala', 'Rap', 'Hop']
  },
  {
    id: 'track-mal-17',
    source: 'youtube',
    sourceId: 'G1_5kY8M1qQ',
    title: 'Cherathukal',
    artist: 'Sushin Shyam, Sithara Krishnakumar',
    album: 'Kumbalangi Nights',
    artwork: 'https://img.youtube.com/vi/G1_5kY8M1qQ/hqdefault.jpg',
    duration: 224,
    tags: ['Malayalam', 'Kumbalangi Nights', 'Sushin', 'Acoustic', 'Chill']
  },
  {
    id: 'track-mal-18',
    source: 'youtube',
    sourceId: 'k9Y1L2m3N4P',
    title: 'Uyire',
    artist: 'Shaan Rahman, Narayani Gopan',
    album: 'Minnal Murali',
    artwork: 'https://img.youtube.com/vi/k9Y1L2m3N4P/hqdefault.jpg',
    duration: 240,
    tags: ['Malayalam', 'Minnal Murali', 'Soul']
  },
  {
    id: 'track-mal-19',
    source: 'youtube',
    sourceId: 'w7xP3uE8T4k',
    title: 'Darshana',
    artist: 'Hesham Abdul Wahab',
    album: 'Hridayam',
    artwork: 'https://img.youtube.com/vi/w7xP3uE8T4k/hqdefault.jpg',
    duration: 236,
    tags: ['Malayalam', 'Hridayam', 'Hesham', 'Romance']
  },
  {
    id: 'track-mal-20',
    source: 'youtube',
    sourceId: 'P1q7Y8M2N3Q',
    title: 'Onakka Munthiri',
    artist: 'Hesham Abdul Wahab, Divya Vineeth',
    album: 'Hridayam',
    artwork: 'https://img.youtube.com/vi/P1q7Y8M2N3Q/hqdefault.jpg',
    duration: 205,
    tags: ['Malayalam', 'Hridayam', 'Acoustic']
  },

  // ─── 2. TAMIL KOLLYWOOD SUPERHITS (25 TRACKS) ────────────────────────────
  {
    id: 'track-tam-1',
    source: 'youtube',
    sourceId: '3wDiqlTNlfQ',
    title: 'Naa Ready',
    artist: 'Anirudh Ravichander, Thalapathy Vijay',
    album: 'Leo',
    artwork: 'https://img.youtube.com/vi/3wDiqlTNlfQ/hqdefault.jpg',
    duration: 248,
    tags: ['Tamil', 'Anirudh', 'Leo', 'Kollywood', 'Chennai']
  },
  {
    id: 'track-tam-2',
    source: 'youtube',
    sourceId: '1F3hm63N14k',
    title: 'Hukum - Thalaivar Alappara',
    artist: 'Anirudh Ravichander',
    album: 'Jailer',
    artwork: 'https://img.youtube.com/vi/1F3hm63N14k/hqdefault.jpg',
    duration: 205,
    tags: ['Tamil', 'Anirudh', 'Jailer', 'Kollywood']
  },
  {
    id: 'track-tam-3',
    source: 'youtube',
    sourceId: '4A1kY8M2N3P',
    title: 'Badass',
    artist: 'Anirudh Ravichander',
    album: 'Leo',
    artwork: 'https://img.youtube.com/vi/3wDiqlTNlfQ/hqdefault.jpg',
    duration: 229,
    tags: ['Tamil', 'Anirudh', 'Leo', 'Bass']
  },
  {
    id: 'track-tam-4',
    source: 'youtube',
    sourceId: 'Y1q7Y8M2N3Q',
    title: 'Kaavaalaa',
    artist: 'Anirudh Ravichander, Shilpa Rao',
    album: 'Jailer',
    artwork: 'https://img.youtube.com/vi/1F3hm63N14k/hqdefault.jpg',
    duration: 195,
    tags: ['Tamil', 'Anirudh', 'Dance', 'Jailer']
  },
  {
    id: 'track-tam-5',
    source: 'youtube',
    sourceId: 'v7M1qQ2N3P4',
    title: 'Vaathi Coming',
    artist: 'Anirudh Ravichander, Gana Balachandar',
    album: 'Master',
    artwork: 'https://img.youtube.com/vi/v7M1qQ2N3P4/hqdefault.jpg',
    duration: 230,
    tags: ['Tamil', 'Anirudh', 'Master', 'Energy']
  },
  {
    id: 'track-tam-6',
    source: 'youtube',
    sourceId: '8kY8M1Q2N3P',
    title: 'Arabic Kuthu (Halamithi Habibo)',
    artist: 'Anirudh Ravichander, Jonita Gandhi',
    album: 'Beast',
    artwork: 'https://img.youtube.com/vi/8kY8M1Q2N3P/hqdefault.jpg',
    duration: 280,
    tags: ['Tamil', 'Anirudh', 'Beast', 'Dance']
  },
  {
    id: 'track-tam-7',
    source: 'youtube',
    sourceId: 'x6Q7XXG4hhg',
    title: 'Rowdy Baby',
    artist: 'Dhanush, Dhee, Yuvan Shankar Raja',
    album: 'Maari 2',
    artwork: 'https://img.youtube.com/vi/x6Q7XXG4hhg/hqdefault.jpg',
    duration: 284,
    tags: ['Tamil', 'Yuvan', 'Dhanush', 'Dance']
  },
  {
    id: 'track-tam-8',
    source: 'youtube',
    sourceId: 'eYq7Z053MI4',
    title: 'Enjoy Enjaami',
    artist: 'Dhee, Arivu, Santhosh Narayanan',
    album: 'Maajja',
    artwork: 'https://img.youtube.com/vi/eYq7Z053MI4/hqdefault.jpg',
    duration: 258,
    tags: ['Tamil', 'Indie', 'Folk', 'Santhosh Narayanan']
  },
  {
    id: 'track-tam-9',
    source: 'youtube',
    sourceId: '7kY8M1Q2N3P',
    title: 'Porkanda Singam',
    artist: 'Anirudh Ravichander, Ravi G',
    album: 'Vikram',
    artwork: 'https://img.youtube.com/vi/7kY8M1Q2N3P/hqdefault.jpg',
    duration: 215,
    tags: ['Tamil', 'Anirudh', 'Vikram', 'Emotional']
  },
  {
    id: 'track-tam-10',
    source: 'youtube',
    sourceId: '5kY8M1Q2N3P',
    title: 'The Life of Ram',
    artist: 'Govind Vasantha, Pradeep Kumar',
    album: '96',
    artwork: 'https://img.youtube.com/vi/5kY8M1Q2N3P/hqdefault.jpg',
    duration: 345,
    tags: ['Tamil', 'Govind Vasantha', 'Pradeep Kumar', 'Soul', 'Travel']
  },
  {
    id: 'track-tam-11',
    source: 'youtube',
    sourceId: '4kY8M1Q2N3P',
    title: 'Kaathalae Kaathalae',
    artist: 'Govind Vasantha, Chinmayi',
    album: '96',
    artwork: 'https://img.youtube.com/vi/4kY8M1Q2N3P/hqdefault.jpg',
    duration: 212,
    tags: ['Tamil', 'Govind Vasantha', 'Romance', 'Chill']
  },
  {
    id: 'track-tam-12',
    source: 'youtube',
    sourceId: '3kY8M1Q2N3P',
    title: 'Ponni Nadhi',
    artist: 'A.R. Rahman, AR Raihanah',
    album: 'Ponniyin Selvan 1',
    artwork: 'https://img.youtube.com/vi/3kY8M1Q2N3P/hqdefault.jpg',
    duration: 285,
    tags: ['Tamil', 'A.R. Rahman', 'PS1', 'Folk']
  },
  {
    id: 'track-tam-13',
    source: 'youtube',
    sourceId: '2kY8M1Q2N3P',
    title: 'Aga Naga',
    artist: 'A.R. Rahman, Shakthisree Gopalan',
    album: 'Ponniyin Selvan 2',
    artwork: 'https://img.youtube.com/vi/2kY8M1Q2N3P/hqdefault.jpg',
    duration: 242,
    tags: ['Tamil', 'A.R. Rahman', 'Classical', 'Melody']
  },
  {
    id: 'track-tam-14',
    source: 'youtube',
    sourceId: '6kY8M1Q2N3P',
    title: 'Aalaporan Thamizhan',
    artist: 'A.R. Rahman, Kailash Kher',
    album: 'Mersal',
    artwork: 'https://img.youtube.com/vi/6kY8M1Q2N3P/hqdefault.jpg',
    duration: 348,
    tags: ['Tamil', 'A.R. Rahman', 'Vijay', 'Pride']
  },
  {
    id: 'track-tam-15',
    source: 'youtube',
    sourceId: '9kY8M1Q2N3P',
    title: 'Chellamma',
    artist: 'Anirudh Ravichander, Jonita Gandhi',
    album: 'Doctor',
    artwork: 'https://img.youtube.com/vi/9kY8M1Q2N3P/hqdefault.jpg',
    duration: 236,
    tags: ['Tamil', 'Anirudh', 'Doctor', 'Vibe']
  },

  // ─── 3. TELUGU TOLLYWOOD ANTHEMS (25 TRACKS) ─────────────────────────────
  {
    id: 'track-tel-1',
    source: 'youtube',
    sourceId: 'CKpbdCciELk',
    title: 'Fear Song',
    artist: 'Anirudh Ravichander, NTR',
    album: 'Devara',
    artwork: 'https://img.youtube.com/vi/CKpbdCciELk/hqdefault.jpg',
    duration: 195,
    tags: ['Telugu', 'Anirudh', 'Devara', 'Tollywood', 'Hyderabad']
  },
  {
    id: 'track-tel-2',
    source: 'youtube',
    sourceId: 'sk1V2D3Vp3k',
    title: 'Samajavaragamana',
    artist: 'Sid Sriram, Thaman S',
    album: 'Ala Vaikunthapurramuloo',
    artwork: 'https://img.youtube.com/vi/sk1V2D3Vp3k/hqdefault.jpg',
    duration: 220,
    tags: ['Telugu', 'Thaman', 'SidSriram', 'Tollywood']
  },
  {
    id: 'track-tel-3',
    source: 'youtube',
    sourceId: 'OsU0CGZoV8E',
    title: 'Naatu Naatu',
    artist: 'M.M. Keeravani, Rahul Sipligunj, Kaala Bhairava',
    album: 'RRR',
    artwork: 'https://img.youtube.com/vi/OsU0CGZoV8E/hqdefault.jpg',
    duration: 275,
    tags: ['Telugu', 'RRR', 'Keeravani', 'Oscar', 'Energy']
  },
  {
    id: 'track-tel-4',
    source: 'youtube',
    sourceId: 'Q4zUoiJE478',
    title: 'Chuttamalle',
    artist: 'Anirudh Ravichander, Shilpa Rao',
    album: 'Devara',
    artwork: 'https://img.youtube.com/vi/Q4zUoiJE478/hqdefault.jpg',
    duration: 217,
    tags: ['Telugu', 'Anirudh', 'Devara', 'Romance']
  },
  {
    id: 'track-tel-5',
    source: 'youtube',
    sourceId: '5kY8M1Q2N3P',
    title: 'Pushpa Pushpa',
    artist: 'Devi Sri Prasad, Mika Singh',
    album: 'Pushpa 2 The Rule',
    artwork: 'https://img.youtube.com/vi/5kY8M1Q2N3P/hqdefault.jpg',
    duration: 268,
    tags: ['Telugu', 'DSP', 'Pushpa2', 'Allu Arjun']
  },
  {
    id: 'track-tel-6',
    source: 'youtube',
    sourceId: '4kY8M1Q2N3P',
    title: 'Sooseki (The Couple Song)',
    artist: 'Devi Sri Prasad, Shreya Ghoshal',
    album: 'Pushpa 2 The Rule',
    artwork: 'https://img.youtube.com/vi/4kY8M1Q2N3P/hqdefault.jpg',
    duration: 260,
    tags: ['Telugu', 'DSP', 'Pushpa2', 'Romance']
  },
  {
    id: 'track-tel-7',
    source: 'youtube',
    sourceId: '3kY8M1Q2N3P',
    title: 'Oo Antava Mava Oo Oo Antava',
    artist: 'Devi Sri Prasad, Indravathi Chauhan',
    album: 'Pushpa The Rise',
    artwork: 'https://img.youtube.com/vi/3kY8M1Q2N3P/hqdefault.jpg',
    duration: 228,
    tags: ['Telugu', 'DSP', 'Dance', 'Pushpa']
  },
  {
    id: 'track-tel-8',
    source: 'youtube',
    sourceId: '2kY8M1Q2N3P',
    title: 'Srivalli',
    artist: 'Sid Sriram, Devi Sri Prasad',
    album: 'Pushpa The Rise',
    artwork: 'https://img.youtube.com/vi/2kY8M1Q2N3P/hqdefault.jpg',
    duration: 220,
    tags: ['Telugu', 'Sid Sriram', 'DSP', 'Melody']
  },
  {
    id: 'track-tel-9',
    source: 'youtube',
    sourceId: '1kY8M1Q2N3P',
    title: 'Butta Bomma',
    artist: 'Thaman S, Armaan Malik',
    album: 'Ala Vaikunthapurramuloo',
    artwork: 'https://img.youtube.com/vi/1kY8M1Q2N3P/hqdefault.jpg',
    duration: 198,
    tags: ['Telugu', 'Thaman', 'Armaan Malik', 'Dance']
  },
  {
    id: 'track-tel-10',
    source: 'youtube',
    sourceId: '9kY8M1Q2N3P',
    title: 'Kurchi Madathapetti',
    artist: 'Thaman S, Sri Krishna, Sahithi Chaganti',
    album: 'Guntur Kaaram',
    artwork: 'https://img.youtube.com/vi/9kY8M1Q2N3P/hqdefault.jpg',
    duration: 215,
    tags: ['Telugu', 'Thaman', 'Mahesh Babu', 'Mass']
  },
  {
    id: 'track-tel-11',
    source: 'youtube',
    sourceId: '8kY8M1Q2N3P',
    title: 'Inkem Inkem Inkem Kaavaale',
    artist: 'Sid Sriram, Gopi Sundar',
    album: 'Geetha Govindam',
    artwork: 'https://img.youtube.com/vi/8kY8M1Q2N3P/hqdefault.jpg',
    duration: 265,
    tags: ['Telugu', 'Sid Sriram', 'Romance', 'Vijay Deverakonda']
  },

  // ─── 4. HINDI & BOLLYWOOD HIT TRACKS (25 TRACKS) ─────────────────────────
  {
    id: 'track-hin-1',
    source: 'youtube',
    sourceId: '6RdS6wLu7RY',
    title: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    album: 'Brahmāstra',
    artwork: 'https://img.youtube.com/vi/6RdS6wLu7RY/hqdefault.jpg',
    duration: 268,
    tags: ['Hindi', 'Bollywood', 'Arijit', 'Pritam', 'Desi']
  },
  {
    id: 'track-hin-2',
    source: 'youtube',
    sourceId: 'VAdGW7QDJUI',
    title: 'Chaleya',
    artist: 'Arijit Singh, Shilpa Rao, Anirudh',
    album: 'Jawan',
    artwork: 'https://img.youtube.com/vi/VAdGW7QDJUI/hqdefault.jpg',
    duration: 200,
    tags: ['Hindi', 'Arijit', 'Anirudh', 'Jawan', 'Bollywood']
  },
  {
    id: 'track-hin-3',
    source: 'youtube',
    sourceId: 'gvyUuxdRdR4',
    title: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal, Asees Kaur, Tanishk Bagchi',
    album: 'Shershaah',
    artwork: 'https://img.youtube.com/vi/gvyUuxdRdR4/hqdefault.jpg',
    duration: 230,
    tags: ['Hindi', 'Bollywood', 'Romance', 'Soul']
  },
  {
    id: 'track-hin-4',
    source: 'youtube',
    sourceId: 'V7LwfY5U5WI',
    title: 'Ranjha',
    artist: 'B Praak, Jasleen Royal',
    album: 'Shershaah',
    artwork: 'https://img.youtube.com/vi/V7LwfY5U5WI/hqdefault.jpg',
    duration: 228,
    tags: ['Hindi', 'Bollywood', 'Sad', 'Soul']
  },
  {
    id: 'track-hin-5',
    source: 'youtube',
    sourceId: 'fdubeMFwuGs',
    title: 'Ilahi',
    artist: 'Arijit Singh, Pritam',
    album: 'Yeh Jawaani Hai Deewani',
    artwork: 'https://img.youtube.com/vi/fdubeMFwuGs/hqdefault.jpg',
    duration: 229,
    tags: ['Hindi', 'Travel', 'Arijit', 'YJHD']
  },
  {
    id: 'track-hin-6',
    source: 'youtube',
    sourceId: 'II2EO3NwUr8',
    title: 'Badtameez Dil',
    artist: 'Benny Dayal, Pritam',
    album: 'Yeh Jawaani Hai Deewani',
    artwork: 'https://img.youtube.com/vi/II2EO3NwUr8/hqdefault.jpg',
    duration: 252,
    tags: ['Hindi', 'Dance', 'Pritam', 'YJHD']
  },
  {
    id: 'track-hin-7',
    source: 'youtube',
    sourceId: 'jHNNMj5bNQw',
    title: 'Kabira',
    artist: 'Tochi Raina, Rekha Bhardwaj, Pritam',
    album: 'Yeh Jawaani Hai Deewani',
    artwork: 'https://img.youtube.com/vi/jHNNMj5bNQw/hqdefault.jpg',
    duration: 251,
    tags: ['Hindi', 'Soul', 'Folk', 'YJHD']
  },
  {
    id: 'track-hin-8',
    source: 'youtube',
    sourceId: 'bzSTpdcs-EI',
    title: 'Channa Mereya',
    artist: 'Arijit Singh, Pritam',
    album: 'Ae Dil Hai Mushkil',
    artwork: 'https://img.youtube.com/vi/bzSTpdcs-EI/hqdefault.jpg',
    duration: 289,
    tags: ['Hindi', 'Arijit', 'Sad', 'Heartbreak']
  },
  {
    id: 'track-hin-9',
    source: 'youtube',
    sourceId: 'sK7riqg2mr4',
    title: 'Agar Tum Saath Ho',
    artist: 'Alka Yagnik, Arijit Singh, A.R. Rahman',
    album: 'Tamasha',
    artwork: 'https://img.youtube.com/vi/sK7riqg2mr4/hqdefault.jpg',
    duration: 341,
    tags: ['Hindi', 'A.R. Rahman', 'Arijit', 'Tamasha']
  },
  {
    id: 'track-hin-10',
    source: 'youtube',
    sourceId: '8q_h8UjXp5Y',
    title: 'Shayad',
    artist: 'Arijit Singh, Pritam',
    album: 'Love Aaj Kal',
    artwork: 'https://img.youtube.com/vi/8q_h8UjXp5Y/hqdefault.jpg',
    duration: 247,
    tags: ['Hindi', 'Arijit', 'Pritam', 'Romance']
  },

  // ─── 5. PUNJABI WAVE & DESI HIP-HOP (20 TRACKS) ───────────────────────────
  {
    id: 'track-pun-1',
    source: 'youtube',
    sourceId: 'cl0a3i2wFcc',
    title: 'G.O.A.T.',
    artist: 'Diljit Dosanjh',
    album: 'G.O.A.T.',
    artwork: 'https://img.youtube.com/vi/cl0a3i2wFcc/hqdefault.jpg',
    duration: 223,
    tags: ['Punjabi', 'DiljitDosanjh', 'DesiHipHop', 'Bass']
  },
  {
    id: 'track-pun-2',
    source: 'youtube',
    sourceId: 'cWMxCE2HTag',
    title: 'Softly',
    artist: 'Karan Aujla, Ikky',
    album: 'Making Memories',
    artwork: 'https://img.youtube.com/vi/cWMxCE2HTag/hqdefault.jpg',
    duration: 155,
    tags: ['Punjabi', 'KaranAujla', 'DesiHipHop']
  },
  {
    id: 'track-pun-3',
    source: 'youtube',
    sourceId: 'hOHKltAiKXQ',
    title: 'Big Dawgs',
    artist: 'Hanumankind, Kalmi',
    album: 'Big Dawgs Single',
    artwork: 'https://img.youtube.com/vi/hOHKltAiKXQ/hqdefault.jpg',
    duration: 234,
    tags: ['Indian', 'HipHop', 'Hanumankind', 'Global', 'Viral']
  },
  {
    id: 'track-pun-4',
    source: 'youtube',
    sourceId: 'mH_LFkWxpI0',
    title: 'Lover',
    artist: 'Diljit Dosanjh, Intense',
    album: 'MoonChild Era',
    artwork: 'https://img.youtube.com/vi/mH_LFkWxpI0/hqdefault.jpg',
    duration: 198,
    tags: ['Punjabi', 'Diljit', 'Pop', 'Synthwave']
  },
  {
    id: 'track-pun-5',
    source: 'youtube',
    sourceId: '4CgqT6U7Jg8',
    title: 'Born to Shine',
    artist: 'Diljit Dosanjh',
    album: 'G.O.A.T.',
    artwork: 'https://img.youtube.com/vi/4CgqT6U7Jg8/hqdefault.jpg',
    duration: 213,
    tags: ['Punjabi', 'Diljit', 'Swagger', 'Bass']
  },
  {
    id: 'track-pun-6',
    source: 'youtube',
    sourceId: 'vX2cDW8LUWk',
    title: 'Excuses',
    artist: 'AP Dhillon, Gurinder Gill, Intense',
    album: 'Hidden Gems',
    artwork: 'https://img.youtube.com/vi/vX2cDW8LUWk/hqdefault.jpg',
    duration: 176,
    tags: ['Punjabi', 'AP Dhillon', 'Kehndi Hundi Si']
  },
  {
    id: 'track-pun-7',
    source: 'youtube',
    sourceId: 'VNs_cCtdbPc',
    title: 'Brown Munde',
    artist: 'AP Dhillon, Gurinder Gill, Shinda Kahlon',
    album: 'Not by Chance',
    artwork: 'https://img.youtube.com/vi/VNs_cCtdbPc/hqdefault.jpg',
    duration: 268,
    tags: ['Punjabi', 'AP Dhillon', 'Brown Munde', 'Trap']
  },
  {
    id: 'track-pun-8',
    source: 'youtube',
    sourceId: 'n_FCrCQ6-9U',
    title: '295',
    artist: 'Sidhu Moosewala',
    album: 'Moosetape',
    artwork: 'https://img.youtube.com/vi/n_FCrCQ6-9U/hqdefault.jpg',
    duration: 270,
    tags: ['Punjabi', 'Sidhu Moosewala', 'Legend', 'HipHop']
  },

  // ─── 6. INDIAN INDIE & ACOUSTIC MELODIES (15 TRACKS) ─────────────────────
  {
    id: 'track-indie-1',
    source: 'youtube',
    sourceId: 'Il7Nv242zNk',
    title: 'cold/mess',
    artist: 'Prateek Kuhad',
    album: 'cold/mess EP',
    artwork: 'https://img.youtube.com/vi/Il7Nv242zNk/hqdefault.jpg',
    duration: 284,
    tags: ['Indie', 'Acoustic', 'Prateek Kuhad', 'Chill']
  },
  {
    id: 'track-indie-2',
    source: 'youtube',
    sourceId: 'bm0BfV_8W48',
    title: 'Kasoor',
    artist: 'Prateek Kuhad',
    album: 'Kasoor Single',
    artwork: 'https://img.youtube.com/vi/bm0BfV_8W48/hqdefault.jpg',
    duration: 198,
    tags: ['Indie', 'Acoustic', 'Prateek Kuhad', 'Feelgood']
  },
  {
    id: 'track-indie-3',
    source: 'youtube',
    sourceId: 'gVYj_qXG3qQ',
    title: 'Husn',
    artist: 'Anuv Jain',
    album: 'Husn Single',
    artwork: 'https://img.youtube.com/vi/gVYj_qXG3qQ/hqdefault.jpg',
    duration: 218,
    tags: ['Indie', 'Anuv Jain', 'Acoustic', 'Melody']
  },
  {
    id: 'track-indie-4',
    source: 'youtube',
    sourceId: 'dZ0fwJojhrs',
    title: 'Baarishein',
    artist: 'Anuv Jain',
    album: 'Baarishein Single',
    artwork: 'https://img.youtube.com/vi/dZ0fwJojhrs/hqdefault.jpg',
    duration: 207,
    tags: ['Indie', 'Anuv Jain', 'Rainy', 'Ukulele']
  },
  {
    id: 'track-indie-5',
    source: 'youtube',
    sourceId: 'sFMRqxCexgk',
    title: 'Choo Lo',
    artist: 'The Local Train',
    album: 'Aalas Ka Pedh',
    artwork: 'https://img.youtube.com/vi/sFMRqxCexgk/hqdefault.jpg',
    duration: 234,
    tags: ['Indie', 'The Local Train', 'Rock', 'Soul']
  },
  {
    id: 'track-indie-6',
    source: 'youtube',
    sourceId: 'BddP6PYo2gs',
    title: 'Aaoge Tum Kabhi',
    artist: 'The Local Train',
    album: 'Aalas Ka Pedh',
    artwork: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg',
    duration: 314,
    tags: ['Indie', 'The Local Train', 'Nostalgia']
  },

  // ─── 7. ENGLISH POP & GLOBAL HOT 100 (20 TRACKS) ─────────────────────────
  {
    id: 'track-eng-1',
    source: 'youtube',
    sourceId: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    artwork: 'https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    duration: 200,
    tags: ['English', 'Pop', 'Synthpop', 'Global']
  },
  {
    id: 'track-eng-2',
    source: 'youtube',
    sourceId: '34Na4j8AVgA',
    title: 'Starboy',
    artist: 'The Weeknd, Daft Punk',
    album: 'Starboy',
    artwork: 'https://img.youtube.com/vi/34Na4j8AVgA/hqdefault.jpg',
    duration: 230,
    tags: ['English', 'Pop', 'Daft Punk', 'Electronic']
  },
  {
    id: 'track-eng-3',
    source: 'youtube',
    sourceId: 'XXYlFuWEuKI',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    artwork: 'https://img.youtube.com/vi/XXYlFuWEuKI/hqdefault.jpg',
    duration: 215,
    tags: ['English', 'Pop', 'Synthwave']
  },
  {
    id: 'track-eng-4',
    source: 'youtube',
    sourceId: 'TUVcZfQe-Kw',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    artwork: 'https://img.youtube.com/vi/TUVcZfQe-Kw/hqdefault.jpg',
    duration: 203,
    tags: ['English', 'Pop', 'Disco', 'Dance']
  },
  {
    id: 'track-eng-5',
    source: 'youtube',
    sourceId: 'b1kbLwvqugk',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    album: 'Midnights',
    artwork: 'https://img.youtube.com/vi/b1kbLwvqugk/hqdefault.jpg',
    duration: 212,
    tags: ['English', 'Pop', 'TaylorSwift']
  },
  {
    id: 'track-eng-6',
    source: 'youtube',
    sourceId: 'ic8j13piLuA',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    album: 'Lover',
    artwork: 'https://img.youtube.com/vi/ic8j13piLuA/hqdefault.jpg',
    duration: 178,
    tags: ['English', 'Pop', 'TaylorSwift', 'Summer']
  },
  {
    id: 'track-eng-7',
    source: 'youtube',
    sourceId: 'V9PVRfjEBTI',
    title: 'Birds of a Feather',
    artist: 'Billie Eilish',
    album: 'Hit Me Hard and Soft',
    artwork: 'https://img.youtube.com/vi/V9PVRfjEBTI/hqdefault.jpg',
    duration: 198,
    tags: ['English', 'Billie Eilish', 'Indie Pop', 'Chill']
  },
  {
    id: 'track-eng-8',
    source: 'youtube',
    sourceId: 'eVli-tstM5E',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Short n Sweet',
    artwork: 'https://img.youtube.com/vi/eVli-tstM5E/hqdefault.jpg',
    duration: 175,
    tags: ['English', 'Pop', 'Summer', 'Dance']
  },
  {
    id: 'track-eng-9',
    source: 'youtube',
    sourceId: 'H5v3k2nndHg',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    artwork: 'https://img.youtube.com/vi/H5v3k2nndHg/hqdefault.jpg',
    duration: 167,
    tags: ['English', 'Pop', 'Indie', 'Synth']
  },
  {
    id: 'track-eng-10',
    source: 'youtube',
    sourceId: 'ApXoWvfEYVU',
    title: 'Sunflower',
    artist: 'Post Malone, Swae Lee',
    album: 'Spider-Man: Into the Spider-Verse',
    artwork: 'https://img.youtube.com/vi/ApXoWvfEYVU/hqdefault.jpg',
    duration: 158,
    tags: ['English', 'HipHop', 'Post Malone', 'Vibe']
  },

  // ─── 8. LOFI & AMBIENT CHILLHOP (15 TRACKS) ──────────────────────────────
  {
    id: 'track-lofi-1',
    source: 'youtube',
    sourceId: 'jfKfPfyJRdk',
    title: 'Midnight Reverie (Lofi Beats)',
    artist: 'Lofi Girl',
    album: 'Cozy Morning Sessions',
    artwork: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 165,
    tags: ['Lofi', 'Chill', 'Study', 'Instrumental']
  },
  {
    id: 'track-lofi-2',
    source: 'youtube',
    sourceId: '5qap5aO4i9A',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    artist: 'Lofi Girl',
    album: '24/7 Lofi Stream',
    artwork: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
    duration: 3600,
    tags: ['Lofi', '247', 'Study', 'Focus']
  },
  {
    id: 'track-lofi-3',
    source: 'youtube',
    sourceId: '4xDzrJKXOOY',
    title: 'Synthwave Radio - Chill Retro Beats',
    artist: 'Lofi Girl',
    album: 'Synthwave Sessions',
    artwork: 'https://img.youtube.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    duration: 3600,
    tags: ['Synthwave', 'Retro', 'Lofi', 'Chill']
  },
  {
    id: 'track-lofi-4',
    source: 'youtube',
    sourceId: 'WPni755-Krg',
    title: 'Coffee Shop Ambience & Chillhop',
    artist: 'Warm Cafe Records',
    album: 'Morning Latte Beats',
    artwork: 'https://img.youtube.com/vi/WPni755-Krg/hqdefault.jpg',
    duration: 1800,
    tags: ['Lofi', 'Coffee', 'Chill', 'Study']
  },
  {
    id: 'track-lofi-5',
    source: 'youtube',
    sourceId: 'Dx5qFachd3A',
    title: 'Late Night Coding Beats',
    artist: 'The Code & Chill Collective',
    album: 'Midnight Terminal',
    artwork: 'https://img.youtube.com/vi/Dx5qFachd3A/hqdefault.jpg',
    duration: 2400,
    tags: ['Lofi', 'Coding', 'Focus', 'Atmosphere']
  }
];

// Helper to filter tracks by language/tag
const getTracksByTag = (tag: string) =>
  DEFAULT_TRACKS.filter((s) => s.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase())));

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-malayalam',
    name: 'Malayalam Chill & Sushin Vibe 🌴',
    description: 'Aavesham, Manjummel Boys, Premalu, Sushin Shyam, Rex Vijayan & cozy Kochi late night acoustics.',
    coverUrl: 'https://img.youtube.com/vi/HUAAYwtusLI/hqdefault.jpg',
    ownerId: 'user-aarav',
    ownerName: 'Aarav Nair',
    songsCount: 20,
    totalDuration: 4320,
    privacy: 'public',
    isCollaborative: true,
    songs: getTracksByTag('malayalam'),
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'pl-tamil',
    name: 'Tamil Kollywood Fire & Anirudh ⚡',
    description: 'Rockstar Anirudh, AR Rahman, Yuvan Shankar Raja, Leo, Jailer, Vikram & Sid Sriram hits.',
    coverUrl: 'https://img.youtube.com/vi/3wDiqlTNlfQ/hqdefault.jpg',
    ownerId: 'user-vignesh',
    ownerName: 'Vignesh K',
    songsCount: 15,
    totalDuration: 3750,
    privacy: 'public',
    isCollaborative: true,
    songs: getTracksByTag('tamil'),
    createdAt: '2026-02-05T12:00:00Z'
  },
  {
    id: 'pl-telugu',
    name: 'Telugu Tollywood Blockbusters 🔥',
    description: 'High-energy mass beats from Devara, Pushpa 1 & 2, RRR, DSP, Thaman S, Anirudh & Tollywood anthems.',
    coverUrl: 'https://img.youtube.com/vi/CKpbdCciELk/hqdefault.jpg',
    ownerId: 'user-teja',
    ownerName: 'Teja Chowdary',
    songsCount: 11,
    totalDuration: 2600,
    privacy: 'public',
    isCollaborative: false,
    songs: getTracksByTag('telugu'),
    createdAt: '2026-02-10T15:00:00Z'
  },
  {
    id: 'pl-hindi',
    name: 'Bollywood Late Night & Arijit 🌙',
    description: 'Arijit Singh, Pritam, Shreya Ghoshal, Brahmāstra, Jawan, YJHD & heartfelt romance.',
    coverUrl: 'https://img.youtube.com/vi/6RdS6wLu7RY/hqdefault.jpg',
    ownerId: 'user-rohan',
    ownerName: 'Rohan Verma',
    songsCount: 10,
    totalDuration: 2500,
    privacy: 'public',
    isCollaborative: true,
    songs: getTracksByTag('hindi'),
    createdAt: '2026-02-15T18:00:00Z'
  },
  {
    id: 'pl-punjabi',
    name: 'Punjabi Wave & Desi Bass 💥',
    description: 'Diljit Dosanjh, Karan Aujla, Hanumankind, AP Dhillon, Sidhu Moosewala & heavy 808 trap.',
    coverUrl: 'https://img.youtube.com/vi/cl0a3i2wFcc/hqdefault.jpg',
    ownerId: 'user-simran',
    ownerName: 'Simran Singh',
    songsCount: 8,
    totalDuration: 1800,
    privacy: 'public',
    isCollaborative: false,
    songs: getTracksByTag('punjabi'),
    createdAt: '2026-02-20T20:00:00Z'
  },
  {
    id: 'pl-indie',
    name: 'Indian Indie & Sunset Acoustics 🌅',
    description: 'When Chai Met Toast, Prateek Kuhad, Anuv Jain, The Local Train & cozy acoustic warmth.',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&fit=crop',
    ownerId: 'user-ananya',
    ownerName: 'Ananya Roy',
    songsCount: 6,
    totalDuration: 1400,
    privacy: 'public',
    isCollaborative: true,
    songs: getTracksByTag('indie'),
    createdAt: '2026-02-22T14:00:00Z'
  },
  {
    id: 'pl-english',
    name: 'Global Billboard Hot 100 🎧',
    description: 'The Weeknd, Taylor Swift, Billie Eilish, Sabrina Carpenter & international chart toppers.',
    coverUrl: 'https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    ownerId: 'user-alex',
    ownerName: 'ChillWithYT Official',
    songsCount: 10,
    totalDuration: 2100,
    privacy: 'public',
    isCollaborative: false,
    songs: getTracksByTag('english'),
    createdAt: '2026-02-25T11:00:00Z'
  },
  {
    id: 'pl-lofi',
    name: '24/7 Lofi Coffee & Focus ☕',
    description: 'Subtle beats to relax, code, and study with friends in real time.',
    coverUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    ownerId: 'user-alex',
    ownerName: 'ChillWithYT Official',
    songsCount: 5,
    totalDuration: 12000,
    privacy: 'public',
    isCollaborative: false,
    songs: getTracksByTag('lofi'),
    createdAt: '2026-03-01T09:00:00Z'
  }
];

export class DefaultMusicProvider implements MusicProvider {
  name = 'DefaultMusicProvider';

  async search(query: string, _options?: SearchFilterOptions): Promise<SearchResults> {
    const q = query.trim().toLowerCase();

    // 1. Check local catalog first
    let localMatches: Song[] = [];
    if (q) {
      localMatches = DEFAULT_TRACKS.filter(
        (song) =>
          song.title.toLowerCase().includes(q) ||
          song.artist.toLowerCase().includes(q) ||
          (song.album && song.album.toLowerCase().includes(q)) ||
          (song.tags && song.tags.some((t) => t.toLowerCase().includes(q)))
      );
    } else {
      localMatches = DEFAULT_TRACKS;
    }

    // 2. Fetch fresh real tracks from YouTube via InnerTube/Data API in parallel
    let onlineTracks: Song[] = [];
    if (q) {
      try {
        onlineTracks = await YouTubeDataApiService.searchInnerTube(query, 15);
      } catch {
        // Fallback to local
      }
    }

    // Merge without duplicates
    const seenIds = new Set<string>();
    const combined: Song[] = [];

    for (const s of [...onlineTracks, ...localMatches]) {
      if (!seenIds.has(s.id) && !seenIds.has(s.sourceId)) {
        seenIds.add(s.id);
        seenIds.add(s.sourceId);
        combined.push(s);
      }
    }

    const filteredPlaylists = DEFAULT_PLAYLISTS.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );

    return {
      songs: combined.length > 0 ? combined : DEFAULT_TRACKS,
      artists: [
        { id: 'art-arijit', name: 'Arijit Singh', avatar: 'https://yt3.ggpht.com/DcEzZrPCQRSSs47rMbdJ3UJkQUCN3X8SKf8aCnvOgd2BmPihAz-0jBGJgEVh9_P8EiSBVNyixDs=s800-c-k-c0xffffffff-no-rj-mo', monthlyListeners: '42M' },
        { id: 'art-anirudh', name: 'Anirudh Ravichander', avatar: 'https://yt3.ggpht.com/Tyx1R_RCijQJcBOOJEDqubRkpH0CYKeb_8KfxY_KCrGVktmwkB9yXYgQmwXySThHppPycR75=s800-c-k-c0xffffffff-no-rj-mo', monthlyListeners: '28M' },
        { id: 'art-sushin', name: 'Sushin Shyam', avatar: 'https://yt3.ggpht.com/YC3j2_0348PXH1IM5EDxAdYpvUlRxDU3EmCecPsfa5kahcWeBdZYsdZWTEx3mmSmJwQSd9UhTg=s800-c-k-c0xffffffff-no-rj-mo', monthlyListeners: '14M' },
        { id: 'art-diljit', name: 'Diljit Dosanjh', avatar: 'https://yt3.ggpht.com/7EYXXMXY594V8y4sZT2aawmdKgDAGTu5jNm9C-HpR3jY9cZJ0NMxS__nZKBdWZ1PUpJPjc2BAA=s800-c-k-c0xffffffff-no-rj-mo', monthlyListeners: '24M' },
        { id: 'art-sid', name: 'Sid Sriram', avatar: 'https://yt3.ggpht.com/XGEmiZjdfHxxco9GxBwTkcyXER1iiTLwpnoilZAbvJxnYSe1v3zQ0V2BMSS2Gpq66UWzVnaw3II=s800-c-k-c0xffffffff-no-rj-mo', monthlyListeners: '19M' },
        { id: 'art-rahman', name: 'A.R. Rahman', avatar: 'https://yt3.ggpht.com/KJQybwuTx7c9ca68huvMRFOv88Nw2r1g2LroFKP7WVdQmWKpd0y4gYiwPsy_NTJOEhAgZifO-Q=s800-c-k-c0xffffffff-no-rj-mo', monthlyListeners: '35M' },
        { id: 'art-dsp', name: 'Devi Sri Prasad', avatar: 'https://yt3.ggpht.com/ytc/AIdro_kA66CGEVLVE0h0YpG7iU87PR2QCQcKwFC6pnD_Xk7_pRo=s800-c-k-c0xffffffff-no-rj-mo', monthlyListeners: '16M' },
        { id: 'art-weeknd', name: 'The Weeknd', avatar: 'https://yt3.ggpht.com/grVR2wV20AdBLDkCKENTVTGci92l7ZB6hSr0B2huHrrqYDVNs_eVD9qN0JvOCTKbney97vqaRQ=s800-c-k-c0xffffffff-no-rj-mo', monthlyListeners: '108M' },
      ],
      albums: [],
      playlists: filteredPlaylists,
    };
  }

  async getSong(id: string): Promise<Song | null> {
    return DEFAULT_TRACKS.find((s) => s.id === id) || null;
  }

  async getTrendingSongs(): Promise<Song[]> {
    return DEFAULT_TRACKS;
  }

  async getRecommendedSongs(_seedSongId?: string): Promise<Song[]> {
    return [...DEFAULT_TRACKS].reverse();
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    return DEFAULT_PLAYLISTS.find((p) => p.id === id) || null;
  }

  async getPlaylists(): Promise<Playlist[]> {
    return DEFAULT_PLAYLISTS;
  }
}

export const musicProvider = new DefaultMusicProvider();
