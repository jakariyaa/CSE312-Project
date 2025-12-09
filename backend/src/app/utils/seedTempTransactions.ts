/* eslint-disable no-console */
import { Types } from "mongoose";
import User from "../modules/user/user.model";
import { Wallet } from "../modules/wallet/wallet.model";
import { Transaction } from "../modules/transactions/transaction.model";
import { TransactionStatus, TransactionType } from "../modules/transactions/transaction.interface";
import { UserRole } from "../modules/user/user.interface";

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateTransactionId(): string {
  return `TXN${Date.now()}${getRandomNumber(1000, 9999)}`;
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

export const seedTempTransactions = async () => {
  try {
    console.log("\nStarting to seed 426 temporary transactions...");

    // Get all users and their wallets
    const users = await User.find({ role: { $in: [UserRole.USER, UserRole.AGENT] } }).lean();
    const wallets = await Wallet.find({}).lean();

    if (users.length < 2) {
      console.log("Not enough users to create transactions. Need at least 2 users.");
      return;
    }

    if (wallets.length < 2) {
      console.log("Not enough wallets to create transactions. Need at least 2 wallets.");
      return;
    }

    // Create a map of user to wallet
    const userWalletMap = new Map();
    wallets.forEach((wallet) => {
      userWalletMap.set(wallet.user.toString(), wallet);
    });

    const transactionTypes = Object.values(TransactionType);
    const statuses = [
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.SUCCESS,
      TransactionStatus.FAILED,
      TransactionStatus.PENDING,
    ];

    const references = [
      "Payment for services",
      "Online purchase",
      "Bill payment",
      "Gift to friend",
      "Refund",
      "Subscription fee",
      "Salary transfer",
      "Freelance payment",
      "Grocery shopping",
      "Utility bill",
      "Rent payment",
      "Medical expenses",
      "Travel booking",
      "Restaurant bill",
      "Shopping",
      "Entertainment",
      "Education fee",
      "Insurance premium",
      "Loan repayment",
      "Investment",
    ];

    // Date range for transactions (last 90 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < 426; i++) {
      try {
        // Select random sender and receiver
        const fromUser = getRandomElement(users);
        let toUser = getRandomElement(users);

        // Ensure sender and receiver are different
        while (toUser._id.toString() === fromUser._id.toString()) {
          toUser = getRandomElement(users);
        }

        const fromWallet = userWalletMap.get(fromUser._id.toString());
        const toWallet = userWalletMap.get(toUser._id.toString());

        if (!fromWallet || !toWallet) {
          console.log(`Skipping transaction ${i + 1}: Wallet not found`);
          failedCount++;
          continue;
        }

        const transactionType = getRandomElement(transactionTypes);
        const status = getRandomElement(statuses);
        const transactionAmount = getRandomNumber(10, 5000);
        const transactionFee = Math.floor(transactionAmount * 0.01); // 1% fee
        const netAmount = transactionAmount - transactionFee;

        const transactionData = {
          transactionType,
          transactionId: generateTransactionId(),
          reference: getRandomElement(references),
          status,
          transactionAmount,
          transactionFee,
          netAmount,
          fromWallet: new Types.ObjectId(fromWallet._id),
          toWallet: new Types.ObjectId(toWallet._id),
          fromUser: new Types.ObjectId(fromUser._id),
          toUser: new Types.ObjectId(toUser._id),
          createdAt: getRandomDate(startDate, endDate),
        };

        await Transaction.create(transactionData);
        successCount++;

        if ((i + 1) % 50 === 0) {
          console.log(`✓ Seeded ${i + 1}/426 transactions...`);
        }
      } catch (error) {
        console.error(`Error creating transaction ${i + 1}:`, error);
        failedCount++;
      }
    }

    console.log("\n=== Transaction Seeding Summary ===");
    console.log(`Total transactions created: ${successCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log(`Target: 426`);
    console.log("===================================\n");
  } catch (error) {
    console.error("Error in seedTempTransactions:", error);
  }
};
