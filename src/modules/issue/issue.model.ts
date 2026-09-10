import { model, Schema } from 'mongoose';
import { TIssue, IssueModel } from './issue.interface';

const issueSchema = new Schema<TIssue, IssueModel>(
  {
    title: { type: String, required: true, trim: true },
    magazineId: { type: Schema.Types.ObjectId, ref: 'Magazine', required: true, index: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    downloadLimit: { type: Number, default: 3, min: 1 },
  },
  { timestamps: true }
);

export const Issue = model<TIssue, IssueModel>('Issue', issueSchema);
