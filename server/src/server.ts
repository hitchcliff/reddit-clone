import "reflect-metadata";
import "dotenv-safe/config";
import cors, { CorsOptions } from "cors";
import { AppDataSource } from "./data-source";
import express from "express";
import session from "express-session";
import Redis from "ioredis";
import connectRedis from "connect-redis";
import { Context } from "./types";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import HelloResolver from "./resolvers/hello";
import PostResolver from "./resolvers/post";
import UserResolver from "./resolvers/user";
import { COOKIE_NAME } from "./utils/constants";
import PhotoResolver from "./resolvers/photo";
import { graphqlUploadExpress } from "graphql-upload-ts";
import LikeResolver from "./resolvers/like";
// import { deleteData } from "./utils/deleteData";

const main = async () => {
  // Database
  await AppDataSource.initialize();

  // Delete Data (For dev only)
  // await deleteData();

  // Run Server
  const app = express();

  // Session
  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  // const corsOptions: CorsOptions = {
  //   origin: process.env.CORS_ORIGIN,
  //   credentials: true,
  //   preflightContinue: true,
  // };

  // app.set("trust proxy", 1);

  // console.log(process.env.CORS_ORIGIN);

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      secret: process.env.SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: process.env.NODE_ENV === "production", //https
        domain:
          process.env.NODE_ENV === "production" ? ".poster.asia" : undefined,
      },
    })
  );

  // Apollo Recommended Plugin
  let plugins: any = [];
  // if (process.env.NODE_ENV === "production") {
  //   plugins = [
  //     ApolloServerPluginLandingPageProductionDefault({
  //       embed: true,
  //       graphRef: "myGraph@prod",
  //       includeCookies: true,
  //     }),
  //   ];
  // } else {
  plugins = [
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
      includeCookies: true,
    }),
  ];
  // }

  // Apollo
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        HelloResolver,
        PostResolver,
        UserResolver,
        PhotoResolver,
        LikeResolver,
      ],
      validate: false,
    }),
    context: ({ req, res }): Context => ({
      req,
      res,
      redis,
    }),
    plugins,
  });
  await apolloServer.start();

  // Uploading a files/images
  app.use(graphqlUploadExpress({ maxFileSize: 100000, maxFiles: 1 }));

  // runs the middleware
  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: [process.env.CORS_ORIGIN, "https://studio.apollographql.com"],
      credentials: true,
    },
  });

  // Run server
  const PORT = parseInt(process.env.PORT);
  app.listen(PORT, () => {
    console.log(
      `Listening at http://localhost:${PORT}${apolloServer.graphqlPath}`
    );
  });
};

main().catch((err) => {
  console.error(err);
});
