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

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
