import { Model, Types } from 'mongoose';

export type TIssue = {
  _id: Types.ObjectId;
  title: string;
  magazineId: Types.ObjectId;
  filePath: string; // stored file name inside the uploads folder — static URL: /uploads/<filePath>
  fileSize: number; // in bytes
  isActive: boolean;
  downloadLimit: number; // max downloads per user for this issue
  createdAt: Date;
  updatedAt: Date;
};

export type IssueModel = Model<TIssue>;
