import { StatusCodes } from 'http-status-codes';
import { isValidObjectId } from 'mongoose';
import ApiError from '../../errors/ApiError';
import { Issue } from './issue.model';
import { IssueDownload } from './issue.download.model';
import { Magazine } from '../magazine/magazine.model';
import { Subscription } from '../subscription/subscription.model';
import unlinkFile from '../../shared/unlinkFile';

const createIssue = async (payload: { title: string; magazineId: string; filePath: string; fileSize: number; downloadLimit?: number }) => {
  const magazine = await Magazine.findById(payload.magazineId);
  if (!magazine) throw new ApiError(StatusCodes.NOT_FOUND, 'Magazine not found');
  return Issue.create(payload);
};

const getIssues = async (page: number, limit: number, magazineId?: string) => {
  const skip = (page - 1) * limit;
  // optional magazineId filter — lets the admin panel list issues of a single magazine (incl. inactive)
  const filter = magazineId && isValidObjectId(magazineId) ? { magazineId } : {};
  const [results, totalCount] = await Promise.all([
    Issue.find(filter).populate('magazineId', 'title slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Issue.countDocuments(filter),
  ]);
  return {
    results,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      itemsPerPage: limit,
    },
  };
};

const getIssuesByMagazine = async (magazineId: string) => {
  return Issue.find({ magazineId, isActive: true }).sort({ createdAt: -1 });
};

const getIssueById = async (id: string) => {
  const issue = await Issue.findById(id);
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found');
  return issue;
};

const updateIssue = async (id: string, payload: any, file?: Express.Multer.File) => {
  const issue = await getIssueById(id);
  Object.assign(issue, payload);
  if (file) {
    // replace the old PDF with the newly uploaded one
    unlinkFile(issue.filePath);
    issue.filePath = file.filename;
    issue.fileSize = file.size;
  }
  await issue.save();
  return issue;
};

const deleteIssue = async (id: string) => {
  const issue = await getIssueById(id);
  unlinkFile(issue.filePath);
  await Issue.findByIdAndDelete(id);
  // remove the per-user download counters for this issue
  await IssueDownload.deleteMany({ issueId: id });
};

// Download rules:
// 1. issue must exist and be active
// 2. user must have an active subscription for the issue's magazine
// 3. user's download count (IssueDownload collection) must be below the issue downloadLimit
// 4. the counter is incremented atomically to prevent parallel-request over-downloads
const downloadIssue = async (userId: string, issueId: string) => {
  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, 'Issue not found');
  if (!issue.isActive) throw new ApiError(StatusCodes.BAD_REQUEST, 'This issue is not available');

  const subscription = await Subscription.findOne({
    userId,
    magazineId: issue.magazineId,
    status: 'active',
  });
  if (!subscription || (subscription.endDate && subscription.endDate < new Date())) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You must subscribe to this magazine first');
  }

  // atomically increment the counter only while it is below the limit (race-safe).
  // on the very first download no counter exists yet — upsert creates it with count 1.
  let counter = await IssueDownload.findOneAndUpdate(
    { userId, issueId: issue._id, count: { $lt: issue.downloadLimit } },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  if (!counter) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You have reached the download limit for this issue');
  }

  return {
    issue,
    filePath: issue.filePath,
    remainingDownloads: issue.downloadLimit - counter.count,
  };
};

export const IssueService = {
  createIssue,
  getIssues,
  getIssuesByMagazine,
  getIssueById,
  updateIssue,
  deleteIssue,
  downloadIssue,
};
