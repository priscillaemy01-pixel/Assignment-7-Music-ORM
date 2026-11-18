const express = require('express');
const { sequelize, Track, initializeDatabase } = require('./database/setup');

const app = express();
const requiredStringFields = ['songTitle', 'artistName', 'albumName', 'genre'];
const optionalIntegerFields = ['duration', 'releaseYear'];
const trackFields = [...requiredStringFields, ...optionalIntegerFields];

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

app.use(express.json({ limit: '1mb' }));

function validateTrackInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }

  const unknownFields = Object.keys(body).filter((field) => !trackFields.includes(field));
  if (unknownFields.length > 0) {
    throw new HttpError(400, `Unknown track field(s): ${unknownFields.join(', ')}.`);
  }

  const values = {};
  for (const field of requiredStringFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      if (!partial) {
        throw new HttpError(400, `${field} is required.`);
      }
      continue;
    }

    if (typeof body[field] !== 'string' || body[field].trim().length === 0) {
      throw new HttpError(400, `${field} must be a non-empty string.`);
    }
    values[field] = body[field].trim();
  }

  for (const field of optionalIntegerFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      continue;
    }
    if (body[field] !== null && (!Number.isInteger(body[field]) || body[field] < 0)) {
      throw new HttpError(400, `${field} must be a non-negative integer or null.`);
    }
    values[field] = body[field];
  }

  if (partial && Object.keys(values).length === 0) {
    throw new HttpError(400, 'Provide at least one track field to update.');
  }

  return values;
}

function parseTrackId(value) {
  const trackId = Number(value);
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(trackId)) {
    throw new HttpError(400, 'Track id must be a positive integer.');
  }
  return trackId;
}

function asyncHandler(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

app.get(
  '/api/tracks',
  asyncHandler(async (request, response) => {
    const tracks = await Track.findAll();
    response.json(tracks);
  })
);

app.get(
  '/api/tracks/:id',
  asyncHandler(async (request, response) => {
    const track = await Track.findByPk(parseTrackId(request.params.id));
    if (!track) {
      throw new HttpError(404, 'Track not found.');
    }
    response.json(track);
  })
);

app.post(
  '/api/tracks',
  asyncHandler(async (request, response) => {
    const values = validateTrackInput(request.body);
    const track = await Track.create(values);
    response.status(201).json(track);
  })
);

app.put(
  '/api/tracks/:id',
  asyncHandler(async (request, response) => {
    const trackId = parseTrackId(request.params.id);
    const values = validateTrackInput(request.body, { partial: true });
    const existingTrack = await Track.findByPk(trackId);
    if (!existingTrack) {
      throw new HttpError(404, 'Track not found.');
    }
    await Track.update(values, { where: { trackId } });
    const updatedTrack = await Track.findByPk(trackId);
    response.json(updatedTrack);
  })
);

app.delete(
  '/api/tracks/:id',
  asyncHandler(async (request, response) => {
    const trackId = parseTrackId(request.params.id);
    const deletedCount = await Track.destroy({ where: { trackId } });
    if (deletedCount === 0) {
      throw new HttpError(404, 'Track not found.');
    }
    response.json({ message: 'Track deleted successfully.' });
  })
);

app.use((request, response, next) => {
  next(new HttpError(404, 'Route not found.'));
});

app.use((error, request, response, next) => {
  const statusCode =
    error instanceof HttpError
      ? error.statusCode
      : Number.isInteger(error.status) && error.status >= 400 && error.status < 500
        ? error.status
        : 500;

  if (statusCode === 500) {
    console.error('API request failed:', error);
  }

  const message =
    statusCode === 413
      ? 'Request body is too large.'
      : statusCode === 500
        ? 'Internal server error.'
        : error.message;
  response.status(statusCode).json({ error: message });
});

async function startServer() {
  try {
    await initializeDatabase();
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT must be an integer between 1 and 65535.');
    }

    const server = await new Promise((resolve, reject) => {
      const listener = app.listen(port, () => {
        listener.removeListener('error', reject);
        resolve(listener);
      });
      listener.once('error', reject);
    });

    console.log(`Music library API listening on port ${port}.`);
    return server;
  } catch (error) {
    await sequelize.close();
    throw error;
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start the music library API:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer, sequelize, Track };
