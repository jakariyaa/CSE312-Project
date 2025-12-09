/* eslint-disable no-console */
import envVariables from "../config/env";
import { IUser, UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import { WalletStatus, WalletType } from "../modules/wallet/wallet.interface";
import { Wallet } from "../modules/wallet/wallet.model";
import createWalletNumber from "./createWalletNumber";
import { hashPassword } from "./hashPassword";
import bcrypt from "bcryptjs";

// Realistic fake data
const firstNames = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "William",
  "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander",
  "Abigail", "Michael", "Emily", "Daniel", "Elizabeth", "Matthew", "Sofia", "Jackson", "Avery", "Sebastian",
  "Ella", "David", "Scarlett", "Joseph", "Grace", "Samuel", "Chloe", "John", "Victoria", "Owen",
  "Riley", "Dylan", "Aria", "Luke", "Lily", "Gabriel", "Aubrey", "Anthony", "Zoey", "Isaac",
  "Penelope", "Christopher", "Layla", "Joshua", "Nora", "Andrew", "Hannah", "Ryan", "Addison", "Nathan"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes"
];

const cities = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego",
  "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "San Francisco",
  "Indianapolis", "Seattle", "Denver", "Washington", "Boston", "Nashville", "Detroit", "Portland",
  "Las Vegas", "Memphis", "Louisville", "Baltimore", "Milwaukee", "Albuquerque"
];

const streets = [
  "Main St", "Oak Ave", "Maple Dr", "Park Blvd", "Cedar Ln", "Pine St", "Elm Ave", "Washington St",
  "Lake Dr", "Hill Rd", "Forest Ave", "River Rd", "Sunset Blvd", "Broadway", "Madison Ave",
  "Lincoln St", "Market St", "Church St", "Spring St", "Center St"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  const areaCode = getRandomNumber(200, 999);
  const firstPart = getRandomNumber(200, 999);
  const secondPart = getRandomNumber(1000, 9999);
  return `+1${areaCode}${firstPart}${secondPart}`;
}

function generateAddress(): string {
  const streetNumber = getRandomNumber(100, 9999);
  const street = getRandomElement(streets);
  const city = getRandomElement(cities);
  const state = "USA";
  return `${streetNumber} ${street}, ${city}, ${state}`;
}

function generateEmail(firstName: string, lastName: string, role: string): string {
  const random = getRandomNumber(1, 999);
  const cleanFirst = firstName.toLowerCase();
  const cleanLast = lastName.toLowerCase();
  return `${cleanFirst}.${cleanLast}${random}@${role === "AGENT" ? "agent" : "user"}.com`;
}

export const seedTempUsers = async () => {
  try {
    console.log("Starting to seed temporary users...");
    
    // Generate 10 agents
    const agentsData = [];
    for (let i = 0; i < 10; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const email = generateEmail(firstName, lastName, "AGENT");
      
      agentsData.push({
        firstName,
        lastName,
        email,
        phone: generatePhone(),
        role: UserRole.AGENT,
        walletType: WalletType.MERCHANT,
        balance: getRandomNumber(5000, 50000),
        address: generateAddress(),
      });
    }

    // Generate 50 normal users
    const usersData = [];
    for (let i = 0; i < 50; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const email = generateEmail(firstName, lastName, "USER");
      
      usersData.push({
        firstName,
        lastName,
        email,
        phone: generatePhone(),
        role: UserRole.USER,
        walletType: WalletType.USER,
        balance: getRandomNumber(100, 5000),
        address: generateAddress(),
      });
    }

    // Combine all users
    const allUsers = [...agentsData, ...usersData];

    let seededCount = 0;
    let skippedCount = 0;

    for (const userData of allUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        skippedCount++;
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
        address: userData.address,
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

        seededCount++;
        console.log(`✓ ${userData.role} ${userData.firstName} ${userData.lastName} (${userData.email}) seeded successfully.`);
      } catch (error) {
        console.error(`Error seeding user ${userData.email}:`, error);
      }
    }

    console.log("\n=== Seeding Summary ===");
    console.log(`Total users seeded: ${seededCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Agents: 10`);
    console.log(`Normal users: 50`);
    console.log("=======================\n");
  } catch (error) {
    console.error("Error in seedTempUsers:", error);
  }
};
