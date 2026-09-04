// import { PopulateOptions } from 'mongoose';

// interface PaginationOptions {
//   page: number | string;
//   limit: number | string;
//   filters: any;
//   sortField?: string;
//   sortOrder?: string;
//   model: any;
//   select?: string;
//   populate?: PopulateOptions[];
//   lean?: boolean; // 👈 new
// }

// const paginate = async ({
//   page,
//   limit,
//   filters,
//   sortField = 'createdAt',
//   sortOrder = 'desc',
//   model,
//   select = '',
//   populate,
//   lean = false,
// }: PaginationOptions) => {
//   const pageNumber = typeof page === 'string' ? parseInt(page) : page;
//   const limitNumber = typeof limit === 'string' ? parseInt(limit) : limit;
//   const skip = (pageNumber - 1) * limitNumber;

//   let query = model
//     .find(filters)
//     .select(select)
//     .sort({ [sortField]: sortOrder === 'desc' ? -1 : 1 })
//     .skip(skip)
//     .limit(limitNumber);

//   // Apply populate if provided
//   if (populate && populate.length > 0) {
//     query = query.populate(populate);
//   }

//   if (lean) {
//     query = query.lean();
//   }

//   // Run both in parallel — not sequentially
//   const [results, totalCount] = await Promise.all([
//     query,
//     model.countDocuments(filters),
//   ]);

//   return {
//     results,
//     pagination: {
//       totalCount,
//       totalPages: Math.ceil(totalCount / limitNumber),
//       currentPage: pageNumber,
//       itemsPerPage: limitNumber,
//     },
//   };
// };

// export default paginate;

// ─── common/plugins/paginate.ts ──────────────────────────────────────────────
import { Model, PopulateOptions, FilterQuery, SortOrder } from 'mongoose';

export interface PaginationResult<T> {
  results: T[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

interface PaginationOptions<T> {
  page: number;
  limit: number;
  filters: FilterQuery<T>;
  sortField?: string;
  sortOrder?: string;
  model: Model<T>;
  select?: string;
  populate?: PopulateOptions[];
  lean?: boolean;
}

const paginate = async <T>({
  page,
  limit,
  filters,
  sortField = 'createdAt',
  sortOrder = 'desc',
  model,
  select = '',
  populate,
  lean = false,
}: PaginationOptions<T>): Promise<PaginationResult<T>> => {
  // Clamp to sane values
  const pageNumber = Math.max(1, page);
  const limitNumber = Math.min(Math.max(1, limit), 100); // cap at 100
  const skip = (pageNumber - 1) * limitNumber;

  const sort: Record<string, SortOrder> = {
    [sortField]: sortOrder === 'asc' ? 1 : -1,
  };

  let query = model
    .find(filters)
    .select(select)
    .sort(sort)
    .skip(skip)
    .limit(limitNumber);

  if (populate && populate.length > 0) {
    for (const p of populate) {
      query = query.populate(p);
    }
  }

  // Type assertion to handle lean() type mismatch
  if (lean) {
    query = query.lean() as any;
  }

  const [results, totalCount] = await Promise.all([
    query.exec(),
    model.countDocuments(filters).exec(),
  ]);

  return {
    results: results as T[],
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
      itemsPerPage: limitNumber,
    },
  };
};

export default paginate;
