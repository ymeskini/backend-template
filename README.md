# Getting Started
To run the app you'll need to create a `.env` file from the `.env.example` file and fill in the required values.

Then you'll need Docker installed and run:
```shell
docker-compose up --build
```

The app will be available at `http://localhost:4444`.
To change the port you'll need to update the `docker-compose.yml` file and the `Dockerfile` to match the new port defined in the `.env` file.

# Installing new packages
When you install a new package you'll need to rebuild the image by stopping the container.

# Scripts
Testing with Jest
```shell
npm t
```

Linting with ESLint
```shell
npm run lint
```

Typecheck with TypeScript
```shell
npm run type
```

For production you'll need a Sentry DSN.