const { sequelize, Track, initializeDatabase } = require('./setup');

const sampleTracks = [
  {
    songTitle: 'Main Theme',
    artistName: 'Koji Kondo',
    albumName: 'Super Mario Bros. Original Soundtrack',
    genre: 'Chiptune',
    duration: 90,
    releaseYear: 1985,
  },
  {
    songTitle: "Zelda's Lullaby",
    artistName: 'Koji Kondo',
    albumName: 'The Legend of Zelda: Ocarina of Time Original Soundtrack',
    genre: 'Video Game Soundtrack',
    duration: 165,
    releaseYear: 1998,
  },
  {
    songTitle: 'One-Winged Angel',
    artistName: 'Nobuo Uematsu',
    albumName: 'Final Fantasy VII Original Soundtrack',
    genre: 'Orchestral',
    duration: 271,
    releaseYear: 1997,
  },
  {
    songTitle: 'To Zanarkand',
    artistName: 'Nobuo Uematsu',
    albumName: 'Final Fantasy X Original Soundtrack',
    genre: 'Piano',
    duration: 188,
    releaseYear: 2001,
  },
  {
    songTitle: 'Baba Yetu',
    artistName: 'Christopher Tin',
    albumName: 'Civilization IV Soundtrack',
    genre: 'Choral',
    duration: 209,
    releaseYear: 2005,
  },
  {
    songTitle: 'Still Alive',
    artistName: 'Jonathan Coulton',
    albumName: 'Portal Original Soundtrack',
    genre: 'Video Game Soundtrack',
    duration: 176,
    releaseYear: 2007,
  },
  {
    songTitle: "Ezio's Family",
    artistName: 'Jesper Kyd',
    albumName: "Assassin's Creed II Original Soundtrack",
    genre: 'Orchestral',
    duration: 237,
    releaseYear: 2009,
  },
  {
    songTitle: 'Sweden',
    artistName: 'C418',
    albumName: 'Minecraft - Volume Alpha',
    genre: 'Ambient',
    duration: 215,
    releaseYear: 2011,
  },
  {
    songTitle: 'Dragonborn',
    artistName: 'Jeremy Soule',
    albumName: 'The Elder Scrolls V: Skyrim Original Soundtrack',
    genre: 'Orchestral',
    duration: 235,
    releaseYear: 2011,
  },
  {
    songTitle: 'Megalovania',
    artistName: 'Toby Fox',
    albumName: 'UNDERTALE Soundtrack',
    genre: 'Chiptune',
    duration: 156,
    releaseYear: 2015,
  },
  {
    songTitle: 'Hollow Knight',
    artistName: 'Christopher Larkin',
    albumName: 'Hollow Knight Original Soundtrack',
    genre: 'Orchestral',
    duration: 174,
    releaseYear: 2017,
  },
];

async function seedDatabase() {
  try {
    await initializeDatabase();
    const newTracks = [];

    for (const track of sampleTracks) {
      const where = {
        songTitle: track.songTitle,
        artistName: track.artistName,
        albumName: track.albumName,
      };
      const existingTrack = await Track.findOne({ where, attributes: ['trackId'] });

      if (existingTrack) {
        await Track.update(track, { where });
      } else {
        newTracks.push(track);
      }
    }

    if (newTracks.length > 0) {
      await Track.bulkCreate(newTracks);
    }

    console.log(`Updated existing tracks and added ${newTracks.length} new tracks.`);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error('Unable to seed the music library:', error);
    process.exitCode = 1;
  });
}

module.exports = { seedDatabase, sampleTracks };
