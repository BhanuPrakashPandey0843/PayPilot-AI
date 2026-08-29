import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { customers } from "../../db/schema/customers.js";
import type { NewCustomer } from "../../db/schema/customers.js";

export interface CustomerFilters {
  search?: string;
  status?: "active" | "inactive" | "blocked";
}

export interface Pagination {
  page: number;
  limit: number;
}

function buildWhere(organizationId: string, filters: CustomerFilters) {
  const conditions = [eq(customers.organizationId, organizationId)];

  if (filters.status) {
    conditions.push(eq(customers.status, filters.status));
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    const searchCondition = or(
      ilike(customers.name, term),
      ilike(customers.email, term),
      ilike(customers.phone, term)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  return and(...conditions);
}

export async function listCustomers(
  organizationId: string,
  filters: CustomerFilters,
  pagination: Pagination
) {
  const where = buildWhere(organizationId, filters);
  const offset = (pagination.page - 1) * pagination.limit;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(where)
      .orderBy(asc(customers.name))
      .limit(pagination.limit)
      .offset(offset),
    db.select({ total: count() }).from(customers).where(where),
  ]);

  return { rows, total };
}

export async function getCustomerByIdScoped(organizationId: string, id: string) {
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.organizationId, organizationId)))
    .limit(1);
  return row;
}

export async function insertCustomer(values: NewCustomer) {
  const [row] = await db.insert(customers).values(values).returning();
  return row;
}

export async function updateCustomerScoped(
  organizationId: string,
  id: string,
  values: Partial<NewCustomer>
) {
  const [row] = await db
    .update(customers)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(customers.id, id), eq(customers.organizationId, organizationId)))
    .returning();
  return row;
}
