/* eslint-disable no-console */
import envVariables from "../config/env";
import { IUser, UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import { WalletStatus, WalletType } from "../modules/wallet/wallet.interface";
import { Wallet } from "../modules/wallet/wallet.model";
import createWalletNumber from "./createWalletNumber";
import { hashPassword } from "./hashPassword";
import bcrypt from "bcryptjs";

export const seedSuperAdmin = async () => {
  try {
    // console.log("object");

    // check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: envVariables.ADMIN.SUPER_ADMIN_EMAIL });

    if (existingSuperAdmin) {
      console.log("Super admin already exists.");
      return;
    }

    const password = await hashPassword(envVariables.ADMIN.SUPER_ADMIN_PASSWORD);

    const pin = await bcrypt.hash(envVariables.ADMIN.SUPER_ADMIN_PIN, Number(envVariables.BCRYPT_SALT_ROUNDS));

    const payload: Partial<IUser> = {
      firstName: "Admin",
      lastName: "Admin",
      email: envVariables.ADMIN.SUPER_ADMIN_EMAIL,
      role: UserRole.SUPER_ADMIN,
      password,
      isVerified: true,
      pin: pin,
      address: envVariables.ADMIN.SUPER_ADMIN_ADDRESS,
    };

    const user = await User.create(payload);

    await Wallet.create({
      user: user._id,
      walletNumber: createWalletNumber(),
      balance: 0,
      walletType: WalletType.ADMIN,
      walletStatus: WalletStatus.ACTIVE,
    });

    console.log("Super admin seeded successfully.");
  } catch (error) {
    console.error("Error seeding super admin:", error);
  }
};

export const seedUsers = async () => {
  try {
    // Define users to seed
    const usersToSeed = [
      {
        firstName: "Agent",
        lastName: "User",
        email: "agent@example.com",
        phone: "+1234567890",
        role: UserRole.AGENT,
        walletType: WalletType.MERCHANT,
        balance: 5000,
      },
      {
        firstName: "Normal",
        lastName: "User",
        email: "user@example.com",
        phone: "+1234567891",
        role: UserRole.USER,
        walletType: WalletType.USER,
        balance: 1000,
      },
    ];

    for (const userData of usersToSeed) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists.`);
        continue;
      }

      // Hash password (using email as password)
      const password = await hashPassword(userData.email);

      // Hash pin (using default pin 12345)
      const pin = await bcrypt.hash("12345", Number(envVariables.BCRYPT_SALT_ROUNDS));

      const userPayload: Partial<IUser> = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        password,
        isVerified: true,
        pin: pin,
        address: "123 Main St, City, Country",
      };

      try {
        const user = await User.create(userPayload);

        await Wallet.create({
          user: user._id,
          walletNumber: createWalletNumber(),
          balance: userData.balance,
          walletType: userData.walletType,
          walletStatus: WalletStatus.ACTIVE,
        });

        console.log(`${userData.role} user ${userData.email} seeded successfully.`);
      } catch (error) {
        console.error(`Error seeding user ${userData.email}:`, error);
      }
    }

    console.log("All users seeded successfully.");
  } catch (error) {
    console.error("Error seeding users:", error);
  }
};
