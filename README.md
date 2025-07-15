# Aerodrome Analytics

A NestJS-based analytics service for monitoring Aerodrome pools on the Base network. This application provides real-time data tracking, statistics, and analytics for DeFi pools.

## Features

- **Real-time Pool Monitoring**: Tracks Aerodrome pools on Base network
- **Event Tracking**: Monitors blockchain events and transactions
- **Position Analytics**: Analyzes user positions and liquidity
- **Statistics API**: Provides comprehensive pool statistics
- **Swagger Documentation**: Interactive API documentation
- **Prometheus Metrics**: Built-in monitoring and metrics
- **PostgreSQL Database**: Robust data storage with TypeORM

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker and Docker Compose
- PostgreSQL (or use the provided Docker setup)

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd aerodrome-analytics
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
BASE_NODE_URL=https://endpoints.omniatech.io/v1/base/mainnet/public

THEGRAPH_URL=https://gateway.thegraph.com/api/subgraphs/id/GENunSHWLBXm59mBSgPzQ8metBEp9YDfdqwFr91Av1UM
THEGRAPH_TOKEN=your_thegraph_token_here

STATISTIC_SYNC_INTERVAL=600000
START_SYNC_BLOCK=28200766

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=api
```

### 4. Start the Database

Using Docker Compose (recommended):

```bash
npm run start:db
```

Or manually start PostgreSQL and create a database named `api`.

### 5. Start the Application

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

#### Debug Mode
```bash
npm run start:debug
```

## Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run start:db` - Start PostgreSQL database with Docker
- `npm run stop:db` - Stop PostgreSQL database
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## API Documentation

Once the application is running, you can access the Swagger API documentation at: