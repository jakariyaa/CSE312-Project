/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ITransaction } from "./transaction.interface";
import { transactionService } from "./transaction.service";

const createTransaction = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { walletNumber, amount, transactionType, reference, pin } = req.body;

  const user = req.user as JwtPayload;

  const userId = user.userId;

  if (!walletNumber || !amount || !transactionType || !pin) {
    return next(new Error("All fields are required"));
  }

  const response = await transactionService.createTransaction(
    walletNumber,
    amount,
    transactionType,
    userId,
    pin,
    reference
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: response.message,
    data: { transactionId: response.transactionId },
  });
});

const getTransactionById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { transactionId } = req.params;

  if (!transactionId) {
    return next(new Error("Transaction ID is required"));
  }

  const transaction: ITransaction = await transactionService.getTransactionById(transactionId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transaction retrieved successfully",
    data: transaction,
  });
});

const getAllTransactions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const query = req.query;
  const { transactions, meta } = await transactionService.getAllTransactions(query as Record<string, string>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transactions retrieved successfully",
    data: transactions,
    meta,
  });
});

const getMyTransactions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as JwtPayload;
  const userId = user.userId;
  const query = req.query;

  const { transactions, meta } = await transactionService.getMyTransactions(userId, query as Record<string, string>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "My transactions retrieved successfully",
    data: transactions,
    meta,
  });
});

export const transactionController = {
  createTransaction,
  getTransactionById,
  getAllTransactions,
  getMyTransactions,
};
