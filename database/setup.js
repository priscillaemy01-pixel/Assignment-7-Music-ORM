const path = require('node:path');
const dotenv = require('dotenv');
const { DataTypes, Sequelize } = require('sequelize');

const environment = process.env.NODE_ENV || 'development';
const envFile = environment === 'production' ? '.env.production' : '.env';
const projectRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.resolve(projectRoot, envFile) });

const storage = process.env.DB_STORAGE || './music_library.db';
const databasePath = path.resolve(projectRoot, storage);
const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'sqlite',
  storage: databasePath,
  logging: false,
});

const Track = sequelize.define(
  'Track',
  {
    trackId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    songTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    artistName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    albumName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    genre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    releaseYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'tracks',
    timestamps: false,
  }
);

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log(`Connected to SQLite database and synced tracks at ${databasePath}`);
}

async function setupDatabase() {
  try {
    await initializeDatabase();
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  setupDatabase().catch((error) => {
    console.error('Unable to set up the SQLite database:', error);
    process.exitCode = 1;
  });
}

module.exports = { sequelize, Track, initializeDatabase, setupDatabase, databasePath };
