import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'fs_challenge',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: false,
});

export const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(400),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'USER', 'STORE_OWNER'),
      allowNull: false,
      defaultValue: 'USER',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
  }
);

export const Store = sequelize.define(
  'Store',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.STRING(400),
      allowNull: false,
    },
  },
  {
    tableName: 'stores',
    timestamps: true,
  }
);

export const Rating = sequelize.define(
  'Rating',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
  },
  {
    tableName: 'ratings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['UserId', 'StoreId'],
      },
    ],
  }
);

// Associations
User.hasMany(Store, { foreignKey: 'ownerId', as: 'ownedStores' });
Store.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.belongsToMany(Store, { through: Rating });
Store.belongsToMany(User, { through: Rating });

Rating.belongsTo(User);
Rating.belongsTo(Store);
User.hasMany(Rating);
Store.hasMany(Rating);

export async function initDb() {
  await sequelize.authenticate();
  await sequelize.sync();
}

