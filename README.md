# Getting Started
To run the app you'll need to create a `.env` file from the `.env.example` file and fill in the required values.

Then you'll need Docker installed and run:
```shell
docker-compose up --build
```

The app will be available at `http://localhost:4444`.
To change the port you'll need to update the `docker-compose.yml` file and the `Dockerfile` to match the new port defined in the `.env` file.

NB. SWC is not doing typechecking so you'll need to run `npm run type:watch` in a separate terminal to get typechecking.

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


# Realtime

Overall we should follow as much as possible the PubSub from [Twitch](https://dev.twitch.tv/docs/pubsub/):

For realtime updates we use Redis Pub/Sub pattern in combination with WebSockets.
Each server is responsible of listening to `realtime` channel and broadcasting the messages the clients.
We decide to broadcast or not a message based on the `topics` and each client has a list of topics it's interested in.

The naming of a topic should follow `[resource]:[subresource]:[action]` pattern.
Some examples:
- `channel:update`
- `channel:follow`
- `channel:prediction:lock`

Some `topics` might need Authorization so we need to check the scopes of the user. The scopes will be available in the JWT token provided by the `/ws/auth` endpoint.

The scopes are formatted like: `user:read:chat`

To access it the client should retrieve a JWT token from `/ws/auth` generally speaking the client is already authenticated through a login process and has a session cookie.

To send messages or listen to topics the token will be required.

