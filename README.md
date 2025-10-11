# VectorNotes

This is a simple note-taking app built to leverage vector embeddings for semantic and contextual search. The idea is you use ideas to search across your notes. It's built with Angular and Electron for cross-platform desktop support.

It is still work in progress. Eventually I'm planning on having a compiled app for macos and linux desktops.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Launching the Electron App

To launch the Electron desktop application, run:

```bash
npm run electron
```

This command will:
1. Build your Angular application (`ng build`)
2. Launch the Electron app using the built files

### Alternative Development Workflow

For development with hot reloading, you can:

1. Start the Angular development server:
   ```bash
   npm start
   ```

2. In a separate terminal, launch Electron (you may need to modify the main process to point to the dev server URL).

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

3. **Verify all dependencies are properly installed**, especially `better-sqlite3` and `sqlite-vss` for the database functionality.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running Tests

This project includes comprehensive tests for both the Angular components and the database/vector search functionality.

### Angular Unit Tests

To execute Angular unit tests with the [Karma](https://karma-runner.github.io) test runner, use:

```bash
ng test
```

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

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
