# VectorNotes

This is a simple note-taking app built to leverage vector embeddings for semantic and contextual search. The idea is you use ideas to search across your notes. It's built with React (Vite) and Electron for cross-platform desktop support.

It is still work in progress. Eventually I'm planning on having a compiled app for macos and linux desktops.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to the printed local URL (typically `http://localhost:5173/`). The application will automatically reload whenever you modify any of the source files.

## Launching the Electron App

To launch the Electron desktop application, run:

```bash
npm run electron
```

This command will:
1. Build the React renderer (`npm run build`)
2. Launch the Electron app using the built files

### Alternative Development Workflow

For UI development with hot reloading, run `npm start` and develop in the browser. When you need end-to-end IPC/DB behavior, use `npm run electron`.

### Troubleshooting

If you encounter issues:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Check if the build succeeds**:
   ```bash
   npm run build
   ```

3. **Verify DuckDB/VSS works in your environment** (the app uses `@duckdb/node-api` + DuckDB's `vss` extension).

## Building

To build the project run:

```bash
npm run build
```

This will build the React renderer into the `dist/` directory. The Electron app loads `dist/vector-notes/browser/index.html`.

## Running Tests

This project includes tests for the DuckDB database and vector search functionality.

### Database and Vector Search Tests

The project includes extensive tests for the DuckDB database and vector search functionality using Jest.

#### Run All Database Tests

```bash
npm run test:all
```

#### Run Specific Test Suites

Run only database CRUD tests:
```bash
npm run test:db
```

Run only vector search tests:
```bash
npm run test:vector
```

#### Watch Mode

Run tests in watch mode (automatically re-runs tests when files change):
```bash
npm run test:watch
```

#### Coverage Report

Generate a test coverage report:
```bash
npm run test:coverage
```

The coverage report will be generated in the `coverage/` directory.

### Test Structure

- **`tests/db.test.ts`**: Tests for basic database operations (CRUD operations, embedding storage, deletion)
- **`tests/vector-search.test.ts`**: Comprehensive tests for vector similarity search functionality, including:
  - Basic similarity search
  - Result ordering by similarity
  - Multiple embeddings per note
  - Edge cases and error handling
  - 1536-dimensional embedding validation

### What the Tests Cover

1. **Database Operations**
   - Creating, reading, updating, and deleting notes
   - Storing and retrieving embeddings
   - Handling multiple embeddings per note
   - Proper timestamp handling

2. **Vector Search Functionality**
   - Finding similar notes based on vector embeddings
   - Correct ordering of results by similarity
   - Respecting search limits
   - Handling edge cases (empty database, extreme values)
   - Validating 1536-dimensional embeddings

3. **Data Integrity**
   - Embedding dimension correctness (1536 dimensions for OpenAI models)
   - Proper cleanup of embeddings when notes are deleted
   - Handling multiple ideas per note

## Renderer tech

- React + Vite (renderer lives in `renderer/` and outputs to `dist/vector-notes/browser/` for Electron)
