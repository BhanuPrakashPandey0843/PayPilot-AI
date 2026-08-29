import { Errors } from "../../utils/errors.js";
import { buildPaginationMeta } from "../../utils/response.js";
import { isUniqueViolation } from "../../utils/pg-error.js";
import {
  listCustomers,
  getCustomerByIdScoped,
  insertCustomer,
  updateCustomerScoped,
  type CustomerFilters,
  type Pagination,
} from "./customers.repository.js";
import type { CreateCustomerBody, UpdateCustomerBody } from "./customers.schemas.js";

export async function listCustomersForOrg(
  organizationId: string,
  filters: CustomerFilters,
  pagination: Pagination
) {
  const { rows, total } = await listCustomers(organizationId, filters, pagination);
  return { rows, meta: buildPaginationMeta(pagination, total) };
}

export async function getCustomerForOrg(organizationId: string, id: string) {
  const customer = await getCustomerByIdScoped(organizationId, id);
  if (!customer) {
    throw Errors.notFound("Customer not found");
  }
  return customer;
}

export async function createCustomerForOrg(
  organizationId: string,
  body: CreateCustomerBody
) {
  try {
    return await insertCustomer({
      organizationId,
      externalCustomerId: body.externalCustomerId || null,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      status: body.status,
      metadata: body.metadata,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw Errors.conflict(
        "A customer with this external customer ID already exists in this organization"
      );
    }
    throw err;
  }
}

export async function updateCustomerForOrg(
  organizationId: string,
  id: string,
  body: UpdateCustomerBody
) {
  await getCustomerForOrg(organizationId, id);

  try {
    const updateData: Partial<{
      externalCustomerId: string | null;
      name: string;
      email: string | null;
      phone: string | null;
      status: "active" | "inactive" | "blocked";
      metadata: Record<string, unknown>;
    }> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined)
      updateData.email = body.email === "" ? null : body.email;
    if (body.phone !== undefined)
      updateData.phone = body.phone === "" ? null : body.phone;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.externalCustomerId !== undefined)
      updateData.externalCustomerId =
        body.externalCustomerId === "" ? null : body.externalCustomerId;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    const updated = await updateCustomerScoped(organizationId, id, updateData);
    if (!updated) {
      throw Errors.notFound("Customer not found");
    }
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw Errors.conflict(
        "A customer with this external customer ID already exists in this organization"
      );
    }
    throw err;
  }
}
