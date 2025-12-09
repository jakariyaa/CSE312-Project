/* eslint-disable @typescript-eslint/no-unused-vars */
import { Types } from "mongoose";
import { Wallet } from "../wallet/wallet.model";
import { calculateTransactionFee } from "../../utils/calculateTransactionFee";
import { Transaction } from "./transaction.model";
import crypto from "crypto";
import { TransactionStatus, TransactionType } from "./transaction.interface";
import AppError from "../../errorHelpers/AppError";
import { StatusCodes } from "http-status-codes";
import { WalletType } from "../wallet/wallet.interface";
import bcrypt from "bcryptjs";
import { IUser } from "../user/user.interface";
import { QueryBuilder } from "../../utils/queryBuilder";

const generateTransactionId = () => {
  return `txn_${crypto.randomBytes(8).toString("hex")}`;
};

// Create a new transaction
const createTransaction = async (
  toWalletNumber: string,
  amount: number,
  transactionType: string,
  userId: string,
  pin: string,
  reference?: string
) => {
  // destination wallet
  const toWallet = await Wallet.findOne({
    walletNumber: toWalletNumber,
  }).populate("user", "_id");

  if (!toWallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Destination Wallet not found");
  }

  // source wallet
  const fromWallet = await Wallet.findOne({
    user: userId,
  }).populate("user", "_id pin");

  if (!fromWallet) {
    throw new AppError(StatusCodes.NOT_FOUND, "Source Wallet not found");
  }

  // Validate pin if provided

  const userPin = (fromWallet.user as unknown as IUser).pin;

  if (!userPin) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User pin is not set");
  }
  const validatePin = bcrypt.compareSync(pin, userPin);

  if (!validatePin) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid pin");
  }

  const { transactionFee, netAmount, adminCredit, agentCredit } = calculateTransactionFee(amount, transactionType);

  const session = await Wallet.startSession();
  session.startTransaction();

  const transactionId = generateTransactionId();

  try {
    const transaction = await Transaction.create(
      [
        {
          transactionType: transactionType,
          transactionId: transactionId,
          reference: reference ? reference : "",
          status: TransactionStatus.SUCCESS,
          transactionAmount: amount,
          transactionFee: transactionFee,
          netAmount: amount + transactionFee,
          fromWallet: fromWallet._id,
          toWallet: toWallet._id,
          fromUser: userId,
          toUser: toWallet.user._id,
        },
      ],
      { session }
    );

    //  ideal send money

    if (transactionType === TransactionType.SEND_MONEY) {
      // for send money both wallets have to be user wallets

      if (fromWallet.walletType !== WalletType.USER || toWallet.walletType !== WalletType.USER) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Both wallets must be user wallets");
      }

      // check if fromWallet has sufficient balance
      if (fromWallet.balance < amount + adminCredit) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient balance");
      }

      const deductBalance = amount + transactionFee;

      const updateFromWallet = await Wallet.findByIdAndUpdate(
        fromWallet._id,
        {
          $inc: {
            balance: -deductBalance,
          },
        },
        {
          runValidators: true,
          session,
        }
      );

      const updateToWallet = await Wallet.findByIdAndUpdate(
        toWallet._id,
        {
          $inc: {
            balance: amount,
          },
        },
        {
          runValidators: true,
          session,
        }
      );

      const updateAdminWallet = await Wallet.findOneAndUpdate(
        {
          walletType: WalletType.ADMIN,
        },
        {
          $inc: {
            balance: adminCredit,
          },
        },
        {
          runValidators: true,
          session,
        }
      );
    }

    //  ideal cash In
    else if (transactionType === TransactionType.CASH_IN) {
      if (fromWallet.walletType !== WalletType.MERCHANT || toWallet.walletType !== WalletType.USER) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "source wallet must be merchant wallet and destination wallet must be user wallet"
        );
      }

      // check if fromWallet has sufficient balance
      if (fromWallet.balance < amount) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient balance");
      }

      const deductBalance = amount;

      // update merchant wallet
      const updateFromWallet = await Wallet.findByIdAndUpdate(
        fromWallet._id,
        {
          $inc: {
            balance: -deductBalance,
          },
        },
        {
          runValidators: true,
          session,
        }
      );

      // update user  wallet

      const updateToWallet = await Wallet.findByIdAndUpdate(
        toWallet._id,
        {
          $inc: {
            balance: amount,
          },
        },
        {
          runValidators: true,
          session,
        }
      );
    }

    //  ideal cash Out
    else if (transactionType === TransactionType.CASH_OUT) {
      if (fromWallet.walletType !== WalletType.USER || toWallet.walletType !== WalletType.MERCHANT) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "source wallet must be user wallet and destination wallet must be Merchant wallet"
        );
      }

      // check if toWallet has sufficient balance
      if (toWallet.balance < amount + transactionFee) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Insufficient balance in destination wallet");
      }

      const deductBalance = amount + transactionFee;

      const updateFromWallet = await Wallet.findByIdAndUpdate(
        fromWallet._id,
        {
          $inc: {
            balance: -deductBalance,
          },
        },
        {
          runValidators: true,
          session,
        }
      );

      // update Merchant wallet
      const updateMerchantWallet = await Wallet.findOneAndUpdate(
        {
          id: toWallet._id,
        },
        {
          $inc: {
            balance: agentCredit + amount,
          },
        },
        {
          runValidators: true,
          session,
        }
      );

      // update admin wallet
      const updateAdminWallet = await Wallet.findOneAndUpdate(
        {
          walletType: WalletType.ADMIN,
        },
        {
          $inc: {
            balance: adminCredit,
          },
        },
        {
          runValidators: true,
          session,
        }
      );
    }

    // ideal admin credit
    else if (transactionType === TransactionType.ADMIN_CREDIT) {
      if (fromWallet.walletType !== WalletType.ADMIN || toWallet.walletType !== WalletType.MERCHANT) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          "source wallet must be admin wallet and destination wallet must be merchant wallet"
        );
      }
      // check if fromWallet has sufficient balance

      // update merchant account

      const updateFromWallet = await Wallet.findByIdAndUpdate(
        {
          _id: fromWallet._id,
        },
        {
          $inc: {
            balance: amount,
          },
        },
        {
          session,
          runValidators: true,
        }
      );
    } else {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transaction type");
    }

    await session.commitTransaction();
    return { message: `Transaction successful: ${transactionType} of ${amount} to ${toWalletNumber}`, transactionId };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }

  // update
};

// get transaction by id
const getTransactionById = async (transactionId: string) => {
  const transaction = await Transaction.findById(transactionId).populate(
    "fromWallet toWallet",
    "_id walletNumber user"
  );
  if (!transaction) {
    throw new AppError(StatusCodes.NOT_FOUND, "Transaction not found");
  }
  return transaction;
};

const getAllTransactions = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Transaction.find(), query);

  const transactions = await queryBuilder
    .filter()
    .search(["transactionId"])
    .dateWise()
    .paginate()
    .sort()
    .build()
    .populate("fromWallet toWallet", "_id walletNumber user");
  const meta = await queryBuilder.getMeta();
  return { transactions, meta };
};

// get my transactions
const getMyTransactions = async (userId: string, query: Record<string, string>) => {
  const myWallet = await Wallet.findOne({
    user: new Types.ObjectId(userId),
  });

  const walletType = myWallet?.walletType;

  const queryBuilder = new QueryBuilder(
    Transaction.find({
      $or: [{ fromWallet: myWallet?._id }, { toWallet: myWallet?._id }],
    }),
    query
  );

  // const transactions = await Transaction.find({
  //   $or: [{ fromWallet: myWallet?._id }, { toWallet: myWallet?._id }],
  // })
  //   .sort({ createdAt: -1 })
  //   .populate("fromWallet toWallet", "_id walletNumber user");

  const transactionsPromise = queryBuilder
    .filter()
    .dateWise()
    .paginate()
    .sort()
    .build()
    .populate("fromWallet toWallet", "_id walletNumber user");

  const metaPromise = queryBuilder.getMeta();

  const [transactions, meta] = await Promise.all([transactionsPromise, metaPromise]);

  return { transactions, meta };
};

export const transactionService = {
  createTransaction,
  getTransactionById,
  getAllTransactions,
  getMyTransactions,
};
