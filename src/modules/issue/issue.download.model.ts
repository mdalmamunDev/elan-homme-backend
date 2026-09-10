import { model, Schema, Types } from 'mongoose';

export type TIssueDownload = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  issueId: Types.ObjectId;
  count: number;
  createdAt: Date;
  updatedAt: Date;
};

const issueDownloadSchema = new Schema<TIssueDownload>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    issueId: { type: Schema.Types.ObjectId, ref: 'Issue', required: true, index: true },
    count: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

// one counter document per user per issue
issueDownloadSchema.index({ userId: 1, issueId: 1 }, { unique: true });

export const IssueDownload = model<TIssueDownload>('IssueDownload', issueDownloadSchema);
