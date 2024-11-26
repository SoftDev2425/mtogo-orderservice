/* eslint-disable @typescript-eslint/no-explicit-any */
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Load the .proto file
const PROTO_PATH = path.resolve(
  __dirname,
  '../../node_modules/mtogo-proto-provider/protos/restaurant.proto',
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const restaurantProto = grpc.loadPackageDefinition(packageDefinition)
  .restaurant as any;

const client = new restaurantProto.RestaurantService(
  'localhost:50051', // Address of the restaurant-service
  grpc.credentials.createInsecure(),
);

export default client;
