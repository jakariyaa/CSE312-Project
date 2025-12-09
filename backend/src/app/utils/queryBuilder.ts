import { Query } from "mongoose";
import { excludeFields } from "../constants/constants";

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;
  private appliedFilters: Record<string, unknown> = {};
  private searchQuery: Record<string, unknown> = {};

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const filter = { ...this.query };
    for (const field of excludeFields) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete filter[field];
    }

    // Remove empty string values and null/undefined values
    Object.keys(filter).forEach((key) => {
      if (
        filter[key] === "" ||
        filter[key] === "all" ||
        filter[key] === null ||
        filter[key] === undefined ||
        filter[key] === "null" ||
        filter[key] === "undefined"
      ) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete filter[key];
      }
    });

    this.appliedFilters = { ...filter };
    this.modelQuery = this.modelQuery.find(filter);
    return this;
  }

  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm || "";
    if (searchTerm) {
      const searchQuery = {
        $or: searchableFields.map((field: string) => ({ [field]: { $regex: searchTerm, $options: "i" } })),
      };
      this.searchQuery = searchQuery;
      this.modelQuery = this.modelQuery.find(searchQuery);
    }
    return this;
  }
  sort(): this {
    const sort = this.query?.sort || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  paginate(): this {
    const page = parseInt(this.query.page, 10) || 1;
    const limit = parseInt(this.query.limit, 10) || 10;

    //   // Calculate the skip value for pagination
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  populate(populateFields: string | string[] | any, select?: string): this {
    if (Array.isArray(populateFields)) {
      for (const field of populateFields) {
        this.modelQuery = this.modelQuery.populate(field);
      }
    } else if (typeof populateFields === "string" && select) {
      // Handle populate("user", "-password -pin") syntax
      this.modelQuery = this.modelQuery.populate({
        path: populateFields,
        select: select,
      });
    } else {
      this.modelQuery = this.modelQuery.populate(populateFields);
    }
    return this;
  }

  async getMeta() {
    // Create a new query that starts with the same base conditions as the original query
    // We need to extract the base conditions from the original modelQuery
    const baseConditions = this.modelQuery.getQuery();

    // Combine base conditions with applied filters and search query
    const combinedFilters = {
      ...baseConditions,
      ...this.appliedFilters,
      ...this.searchQuery,
    };

    // Create a new count query with all conditions
    const totalDocuments = await this.modelQuery.model.countDocuments(combinedFilters);
    const page = parseInt(this.query.page, 10) || 1;
    const limit = parseInt(this.query.limit, 10) || 10;
    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      page,
      limit,
      total: totalDocuments,
      totalPages,
    };
  }
  // Get data from last N days (default: 30 days)
  // Usage from frontend: ?days=15&dateField=createdAt
  dateWise(dateField = "createdAt"): this {
    const days = parseInt(this.query.days, 10);

    // If no days specified in query, return all data (don't apply date filter)
    if (!days || days <= 0) {
      return this;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dateFilter = { [dateField]: { $gte: startDate } };
    this.modelQuery = this.modelQuery.find(dateFilter);

    // Track the date filter for getMeta method
    this.appliedFilters = { ...this.appliedFilters, ...dateFilter };

    return this;
  }

  build(): Query<T[], T> {
    return this.modelQuery;
  }
}
